/**
 * components/sections/FeaturedSagas.jsx
 * Grid de sagas destacadas con backdrops dinámicos de TMDB.
 * Es el bloque visual principal de la home — entrada cinematográfica con stagger.
 *
 * Cada card muestra:
 *  - Backdrop de la película/serie principal de la saga
 *  - Nombre de la saga
 *  - Tipos de contenido disponibles (🎬📺🎮📚)
 *
 * Click → /saga/:name
 */

import { useNavigate }         from 'react-router-dom';
import { useQueries }          from '@tanstack/react-query';
import { motion }              from 'motion/react';
import { Film, Tv, Sword, BookOpen, Zap, Music } from 'lucide-react';
import { searchMovies }        from '@/services/tmdb';
import { normalizeTmdbMovie }  from '@/utils/normalizeMedia';

/* ── Sagas predefinidas ────────────────────────────────────── */
const FEATURED_SAGAS = [
  {
    name:   'Spider-Man',
    query:  'Spider-Man No Way Home',
    types:  ['movies', 'games', 'anime', 'books', 'music'],
  },
  {
    name:   'Star Wars',
    query:  'Star Wars A New Hope',
    types:  ['movies', 'series', 'games', 'books', 'music']
  },
  {
    name:   'Batman',
    query:  'The Dark Knight',
    types:  ['movies', 'series', 'games', 'books', 'music']
  },
  {
    name:   'Dragon Ball',
    query:  'Dragon Ball Super Broly',
    types:  ['anime', 'games', 'movies', 'books', 'music']
  },
  {
    name:   'Harry Potter',
    query:  'Harry Potter Sorcerer Stone',
    types:  ['movies', 'series', 'books', 'games', 'music']
  },
  {
    name:        'Lord of the Rings',
    displayName: 'El Señor de los Anillos',
    query:       'Lord of the Rings Fellowship',
    types:       ['movies', 'series', 'books', 'games', 'music']
  },
  {
    name:   'The Last of Us',
    query:  'The Last of Us',
    types:  ['series', 'games', 'books', 'music']
  },
  {
    name:   'Attack on Titan',
    query:  'Attack on Titan',
    types:  ['anime', 'movies', 'games', 'books', 'music']
  },
];

/* ── Íconos por tipo de contenido ─────────────────────────── */
const TYPE_ICONS = new Map([
  ['movies', { Icon: Film,     label: 'Películas' }],
  ['series', { Icon: Tv,       label: 'Series'    }],
  ['anime',  { Icon: Zap,      label: 'Anime'     }],
  ['games',  { Icon: Sword,    label: 'Juegos'    }],
  ['books',  { Icon: BookOpen, label: 'Libros'    }],
  ['music',  { Icon: Music,    label: 'Música'    }],
]);

/* ── Variantes de animación ───────────────────────────────── */
const cardVariants = {
  hidden:  { opacity: 0, scale: 0.82, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    scale:   1,
    filter:  'blur(0px)',
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function SagaCard({ saga, backdropUrl, index }) {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.04, transition: { duration: 0.2 } }}
      onClick={() => navigate(`/saga/${encodeURIComponent(saga.name)}`)}
      style={{
        position:     'relative',
        aspectRatio:  '16/9',
        borderRadius: 'var(--radius-card)',
        overflow:     'hidden',
        cursor:       'pointer',
        background:   'var(--nl-bg-elevated)',
      }}
      role="button"
      tabIndex={0}
      aria-label={`Explorar saga ${saga.name}`}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/saga/${encodeURIComponent(saga.name)}`)}
    >
      {/* Backdrop con Ken Burns */}
      {backdropUrl && (
        <motion.img
          src={backdropUrl}
          alt={saga.name}
          style={{
            position:   'absolute',
            inset:      0,
            width:      '100%',
            height:     '100%',
            objectFit:  'cover',
          }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1.0 }}
          transition={{ duration: 8, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
        />
      )}

      {/* Skeleton si no hay imagen */}
      {!backdropUrl && (
        <div className="nl-skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
      )}

      {/* Gradiente de texto */}
      <div
        style={{
          position:   'absolute',
          inset:      0,
          background: 'linear-gradient(to top, rgba(10,10,11,0.92) 0%, rgba(10,10,11,0.3) 50%, transparent 100%)',
        }}
      />

      {/* Borde inferior rojo en hover */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        style={{
          position:        'absolute',
          bottom:          0,
          left:            0,
          right:           0,
          height:          '3px',
          background:      'var(--nl-accent)',
          transformOrigin: 'left',
        }}
      />

      {/* Número de saga */}
      <span
        style={{
          position:   'absolute',
          top:        '12px',
          left:       '12px',
          fontFamily: 'var(--font-mono)',
          fontSize:   '11px',
          color:      'rgba(255,255,255,0.4)',
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Contenido inferior */}
      <div
        style={{
          position: 'absolute',
          bottom:   0,
          left:     0,
          right:    0,
          padding:  '16px',
        }}
      >
        <h3
          style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'clamp(16px, 2vw, 22px)',
            fontWeight:    700,
            letterSpacing: '-0.02em',
            color:         '#fff',
            marginBottom:  '8px',
          }}
        >
          {saga.displayName ?? saga.name}
        </h3>

        {/* Tipos de contenido */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {saga.types.map((t) => {
            const cfg = TYPE_ICONS.get(t);
            if (!cfg) return null;
            const { Icon, label } = cfg;
            return (
              <span
                key={t}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        '4px',
                  fontSize:   '10px',
                  color:      'rgba(255,255,255,0.65)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                }}
              >
                <Icon size={10} />
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function FeaturedSagas() {
  /* Obtiene backdrops en paralelo para todas las sagas */
  const results = useQueries({
    queries: FEATURED_SAGAS.map((saga) => ({
      queryKey:  ['saga-backdrop', saga.query],
      queryFn:   () => searchMovies(saga.query).then((r) => {
        const first = r.results?.[0];
        if (!first) return null;
        return normalizeTmdbMovie(first).backdrop;
      }),
      staleTime: Infinity,
      retry:     false,
    })),
  });

  return (
    <section style={{ marginTop: 'var(--space-12)' }}>
      {/* Encabezado de sección */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          'var(--space-3)',
          marginBottom: 'var(--space-6)',
          paddingBottom:'var(--space-4)',
          borderBottom: '1px solid var(--nl-border)',
        }}
      >
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{
            display:         'block',
            width:           '32px',
            height:          '3px',
            background:      'var(--nl-accent)',
            transformOrigin: 'left',
            flexShrink:      0,
          }}
        />
        <h2
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:         'white',
          }}
        >
          Sagas destacadas · Explora el universo completo
        </h2>
      </motion.div>

      {/* Grid 2×4 → 4×2 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap:                 'var(--space-4)',
        }}
      >
        {FEATURED_SAGAS.map((saga, i) => (
          <SagaCard
            key={saga.name}
            saga={saga}
            // eslint-disable-next-line security/detect-object-injection -- `i` es el índice numérico del propio .map(), no una clave externa
            backdropUrl={results[i]?.data}
            index={i}
          />
        ))}
      </motion.div>

    </section>
  );
}

export default FeaturedSagas;
