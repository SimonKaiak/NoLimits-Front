/**
 * components/sections/HeroSection.jsx
 *
 * Fondo: 6 columnas verticales de sagas.
 *   - Cada columna contiene 2 imágenes apiladas (luego duplicadas para loop infinito).
 *   - Columnas pares suben lentamente, impares bajan.
 *   - Velocidades distintas por columna para efecto orgánico.
 *
 * Texto: headline animado palabra a palabra + stats + SearchBar.
 */

import { useQueries }         from '@tanstack/react-query';
import { motion }             from 'motion/react';
import SearchBar              from '@/components/ui/SearchBar';
import { searchMovies }       from '@/services/tmdb';
import { normalizeTmdbMovie } from '@/utils/normalizeMedia';
import { MOSAIC_SAGA_QUERIES } from '@/utils/sagaData';

/* ── Columna vertical con pan infinito ────────────────────── */
/**
 * @param {(string|null)[]} urls     — 2 URLs de imagen (se duplican internamente)
 * @param {'up'|'down'}     direction
 * @param {number}          speed    — Segundos por ciclo completo
 */
function MosaicColumn({ urls, direction, speed }) {
  /* Duplicamos para loop continuo: [A, B, A, B] → animar -50% ≡ volver al inicio */
  const doubled = [...urls, ...urls];

  /* Punto de inicio según dirección para que ambas "ya estén en movimiento" al cargar */
  const from = direction === 'up'   ? '0%'   : '-50%';
  const to   = direction === 'up'   ? '-50%' : '0%';

  return (
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minWidth: 0 }}>
      <motion.div
        style={{ display: 'flex', flexDirection: 'column' }}
        animate={{ y: [from, to] }}
        transition={{ duration: speed, ease: 'linear', repeat: Infinity, repeatType: 'loop' }}
      >
        {doubled.map((url, i) => (
          <div
            key={i}
            style={{
              /* Cada imagen ocupa exactamente la mitad del ciclo completo (200vh / 4) */
              height:     '50vh',
              flexShrink: 0,
              overflow:   'hidden',
              background: 'var(--nl-bg-elevated)',
            }}
          >
            {url
              ? <img
                  src={url}
                  alt=""
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.7 }}
                />
              : <div className="nl-skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
            }
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Variantes de texto ───────────────────────────────────── */
const HEADLINE = 'Una plataforma. Todas las sagas.';

const wordVariants = {
  hidden:  { opacity: 0, y: 18, filter: 'blur(4px)' },
  visible: (i) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, delay: 0.3 + i * 0.09, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ── Componente principal ─────────────────────────────────── */
function HeroSection() {
  /* 12 queries en paralelo, una por saga del mosaico */
  const results = useQueries({
    queries: MOSAIC_SAGA_QUERIES.map((query) => ({
      queryKey:  ['mosaic-backdrop', query],
      queryFn:   () => searchMovies(query).then((r) => {
        const first = r.results?.[0];
        return first ? normalizeTmdbMovie(first).backdrop : null;
      }),
      staleTime: Infinity,
      retry:     false,
    })),
  });

  const backdrops = results.map((r) => r.data ?? null);

  /*
   * Distribuye 12 imágenes en 6 columnas de 2 imágenes c/u.
   * [0,1] → col0 | [2,3] → col1 | ... | [10,11] → col5
   */
  const columns = Array.from({ length: 6 }, (_, col) => [
    backdrops[col * 2]     ?? null,
    backdrops[col * 2 + 1] ?? null,
  ]);

  /* Velocidades variadas por columna para romper la monotonía */
  const speeds = [28, 34, 24, 38, 30, 26];

  const words = HEADLINE.split(' ');

  return (
    <section
      style={{
        position:      'relative',
        minHeight:     'calc(100vh - var(--header-h))',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
      }}
      aria-label="Hero principal"
    >
      {/* ── Columnas verticales de fondo ──────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset:    0,
          display:  'flex',
          gap:      '3px',
        }}
      >
        {columns.map((colUrls, i) => (
          <MosaicColumn
            key={i}
            urls={colUrls}
            direction={i % 2 === 0 ? 'up' : 'down'}
            // eslint-disable-next-line security/detect-object-injection -- `i` es el índice numérico del propio .map(), no una clave externa
            speed={speeds[i]}
          />
        ))}
      </div>

      {/* ── Gradientes de legibilidad ──────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          inset:      0,
          background: `
            linear-gradient(to right,  rgba(10,10,11,0.92) 0%, rgba(10,10,11,0.55) 55%, rgba(10,10,11,0.15) 100%),
            linear-gradient(to bottom, rgba(10,10,11,0.4)  0%, transparent 30%),
            linear-gradient(to top,    rgba(10,10,11,0.7)  0%, transparent 35%)
          `,
        }}
      />

      {/* ── Contenido superpuesto ─────────────────────────── */}
      <div
        className="container"
        style={{
          position:       'relative',
          zIndex:         1,
          flex:           1,
          display:        'flex',
          flexDirection:  'column',
          justifyContent: 'center',
          padding:        'var(--space-16) var(--space-6)',
          maxWidth:       '680px',
        }}
      >
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1,  x: 0   }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:         'var(--nl-accent)',
            marginBottom:  'var(--space-4)',
            display:       'flex',
            alignItems:    'center',
            gap:           '10px',
          }}
        >
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ display: 'inline-block', width: '24px', height: '2px', background: 'var(--nl-accent)', transformOrigin: 'left' }}
          />
          no/limits · hub cultural
        </motion.p>

        {/* Headline word-by-word */}
        <h1
          style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'clamp(40px, 7vw, 80px)',
            fontWeight:    700,
            letterSpacing: '-0.04em',
            lineHeight:    1.0,
            color:         '#fff',
            marginBottom:  'var(--space-6)',
          }}
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={wordVariants}
              initial="hidden"
              animate="visible"
              style={{
                display:     'inline-block',
                marginRight: '0.25em',
                color:       word === 'sagas.' ? 'var(--nl-accent)' : '#fff',
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.1 }}
          style={{
            fontSize:     'clamp(14px, 1.8vw, 17px)',
            lineHeight:   1.7,
            color:        'rgba(255,255,255,0.6)',
            marginBottom: 'var(--space-8)',
            maxWidth:     '480px',
          }}
        >
          Películas, series, videojuegos, libros y anime —
          todos los universos de una franquicia en un solo lugar.
        </motion.p>

        {/* SearchBar */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1,  y: 0  }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          <SearchBar />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.9 }}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginTop: 'var(--space-8)' }}
        >
          {[['12+', 'sagas curadas'], ['5', 'fuentes de datos'], ['∞', 'contenido']].map(([n, label]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--nl-accent)', letterSpacing: '-0.02em' }}>
                {n}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
