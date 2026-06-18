/**
 * pages/Saga.jsx
 * Vista de saga con dos modos:
 *
 *  1. CURADA — sagas conocidas (ver sagaData.js):
 *     Hero con backdrop dedicado, descripción editorial, tagline,
 *     y secciones de contenido con identidad visual propia de la saga.
 *
 *  2. GENÉRICA — sagas desconocidas:
 *     Buscador + resultados agrupados por tipo.
 */

import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Film, Tv, Sword, BookOpen, Music, Zap, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import MediaCard    from '@/components/cards/MediaCard';
import AnimeCard    from '@/components/cards/AnimeCard';
import BookCard     from '@/components/cards/BookCard';
import GameCard from '@/components/cards/GameCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import WhereToFind  from '@/components/ui/WhereToFind';
import { useSagaSearch } from '@/hooks/useSearch';
import { getCuratedSaga, CURATED_SAGAS } from '@/utils/sagaData';
import { searchMovies }       from '@/services/tmdb';
import { normalizeTmdbMovie } from '@/utils/normalizeMedia';
import { CARD_STAGGER_DELAY } from '@/utils/constants';

/* ── Config de secciones ─────────────────────────────────── */
const SECTIONS = [
  { key: 'movies', label: 'Películas',   icon: Film,     cardType: 'media' },
  { key: 'series', label: 'Series',      icon: Tv,       cardType: 'media' },
  { key: 'anime',  label: 'Anime',       icon: Zap,      cardType: 'anime' },
  { key: 'games',  label: 'Videojuegos', icon: Sword,    cardType: 'media' },
  { key: 'books',  label: 'Libros',      icon: BookOpen, cardType: 'book'  },
  { key: 'music',  label: 'Música',      icon: Music,    cardType: 'media' },
];

function CardByType({ obra, cardType }) {
  if (cardType === 'anime') return <AnimeCard obra={obra} />;
  if (cardType === 'book')  return <BookCard  obra={obra} />;
  return <MediaCard obra={obra} />;
}

/* ── Sección individual con animación stagger ─────────────── */
function SagaSection({ section, obras, accentColor }) {
  const [page, setPage] = useState(0);
  if (!obras || obras.length === 0) return null;
  const Icon = section.icon;
  const PAGE_SIZE = section.key === 'games' ? 8 : section.key === 'books' ? 12 : 10;
  const totalPages = Math.ceil(obras.length / PAGE_SIZE);
  const visible = obras.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <motion.section
      id={`saga-section-${section.key}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{
        marginTop: 'var(--space-12)',
        scrollMarginTop: '90px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--nl-border)' }}>
        <Icon size={14} color={accentColor || 'var(--nl-accent)'} />
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white' }}>
          {section.label}
        </h2>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: accentColor || 'var(--nl-accent)' }}>
          {obras.length}
        </span>
        {/* Botones de paginación */}
        {totalPages > 1 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'transparent',
                border: `2px solid ${page === 0 ? 'rgba(255,255,255,0.3)' : '#C9A84C'}`,
                cursor: page === 0 ? 'default' : 'pointer',
                color: page === 0 ? 'rgba(255,255,255,0.3)' : '#C9A84C',
                fontSize: '20px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 150ms ease, color 150ms ease',
              }}
            >‹</button>

            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--nl-text-primary)', minWidth: '40px', textAlign: 'center' }}>
              {page + 1}/{totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'transparent',
                border: `2px solid ${page === totalPages - 1 ? 'rgba(255,255,255,0.3)' : '#C9A84C'}`,
                cursor: page === totalPages - 1 ? 'default' : 'pointer',
                color: page === totalPages - 1 ? 'rgba(255,255,255,0.3)' : '#C9A84C',
                fontSize: '20px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 150ms ease, color 150ms ease',
              }}
            >›</button>
          </div>
        )}
      </div>

      <motion.div
        className={
          section.cardType === 'book' ? 'nl-grid nl-grid--books' :
          section.key === 'games' ? 'nl-grid nl-grid--games' :
          'nl-grid nl-grid--cards'
        }
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={{ visible: { transition: { staggerChildren: CARD_STAGGER_DELAY } } }}
      >
        {visible.map((obra) => (
          <div key={obra.id}>
            <CardByType obra={obra} cardType={section.cardType} />
            <div style={{ marginTop: '6px' }}>
              <WhereToFind obra={obra} compact />
            </div>
          </div>
        ))}
      </motion.div>
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════════
   VISTA CURADA — para sagas conocidas
════════════════════════════════════════════════════════════ */
function CuratedSagaView({ sagaName, curated }) {
  const navigate = useNavigate();
  const { grouped, isLoading } = useSagaSearch(sagaName, curated?.searchAlias, curated?.displayName);

  /* Backdrop de la saga desde TMDB */
  const { data: backdropUrl } = useQuery({
    queryKey:  ['curated-backdrop', curated.heroQuery],
    queryFn:   () => searchMovies(curated.heroQuery).then((r) => {
      const first = r.results?.[0];
      return first ? normalizeTmdbMovie(first).backdrop : null;
    }),
    staleTime: Infinity,
    retry:     false,
  });

  const totalResults = Object.values(grouped).reduce((acc, arr) => acc + (arr?.length ?? 0), 0);

  const scrollToSection = (id) => {
    document.getElementById(`saga-section-${id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const availableSections = SECTIONS.filter((section) => {
    return curated.types.includes(section.key) && grouped[section.key]?.length > 0;
  });

  return (
    <>
      {/* ── Hero de la saga ─────────────────────────────────── */}
      <div style={{ position: 'relative', minHeight: '520px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        {/* Backdrop */}
        {backdropUrl && (
          <motion.img
            src={backdropUrl}
            alt={curated.displayName}
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1.0,  opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
          />
        )}
        {!backdropUrl && (
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, #0A0A0B 0%, ${curated.accent}22 100%)` }} />
        )}

        {/* Gradiente */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,11,1) 0%, rgba(10,10,11,0.6) 50%, rgba(10,10,11,0.2) 100%)' }} />

        {/* Botón volver */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate(-1)}
          style={{ position: 'absolute', top: 'var(--space-6)', left: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', zIndex: 1 }}
        >
          <ArrowLeft size={16} /> Volver
        </motion.button>

        {/* Contenido del hero */}
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: 'var(--space-10)', paddingTop: 'var(--space-12)' }}>
          {/* Label de saga */}
          <motion.p
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1,  x: 0   }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ width: '20px', height: '2px', background: curated.accent, display: 'inline-block' }} />
            <span style={{ color: curated.accent }}>Saga curada</span>
          </motion.p>

          {/* Título de la saga */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1,  y: 0  }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.0, color: '#fff', marginBottom: 'var(--space-3)' }}
          >
            {curated.displayName}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            style={{ fontFamily: 'var(--font-ui)', fontSize: '15px', fontStyle: 'italic', color: curated.accent, marginBottom: 'var(--space-4)' }}
          >
            "{curated.tagline}"
          </motion.p>

          {/* Descripción */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', maxWidth: '640px', marginBottom: 'var(--space-6)' }}
          >
            {curated.description}
          </motion.p>

          {/* Tipos de contenido disponibles */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1,  y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}
          >
            {availableSections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => scrollToSection(section.key)}
                style={{
                  padding:      '4px 12px',
                  borderRadius: '20px',
                  background:   `${curated.accent}22`,
                  border:       `1px solid ${curated.accent}55`,
                  color:        curated.accent,
                  fontSize:     '12px',
                  fontFamily:   'var(--font-mono)',
                  letterSpacing:'0.04em',
                  cursor:       'pointer',
                }}
              >
                {section.label}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Secciones de contenido ──────────────────────────── */}
      <div className="container" style={{ paddingBottom: 'var(--space-16)' }}>
        {/* Resumen de resultados */}
        {!isLoading && totalResults > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ color: 'var(--nl-text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)', marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)' }}
          >
            Se encontraron{' '}
            <span style={{ color: curated.accent }}>{totalResults} obras</span>
            {' '}relacionadas
          </motion.p>
        )}

        {/* Skeletons mientras carga */}
        {isLoading && (
          <div className="nl-grid nl-grid--cards" style={{ marginTop: 'var(--space-8)' }}>
            <SkeletonCard count={5} />
          </div>
        )}

        {/* Secciones por tipo */}
        {!isLoading && SECTIONS
          .filter((section) => curated.types.includes(section.key))
          .map((section) => (
            <SagaSection
              key={section.key}
              section={section}
              obras={grouped[section.key]}
              accentColor={curated.accent}
            />
          ))
        }
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   VISTA GENÉRICA — para sagas no curadas
════════════════════════════════════════════════════════════ */
function GenericSagaView({ sagaName }) {
  const { grouped, isLoading, error } = useSagaSearch(sagaName);
  const totalResults = Object.values(grouped).reduce((acc, arr) => acc + (arr?.length ?? 0), 0);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nl-accent)', marginBottom: 'var(--space-2)' }}>
        Búsqueda de saga
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 'var(--space-6)' }}>
        {sagaName}
      </h1>

      {isLoading && (
        <div className="nl-grid nl-grid--cards">
          <SkeletonCard count={5} />
        </div>
      )}

      {error && !isLoading && (
        <p style={{ color: 'var(--nl-text-muted)', fontSize: '14px' }}>
          No pudimos cargar los datos. Verifica tu conexión.
        </p>
      )}

      {!isLoading && totalResults > 0 && (
        <p style={{ color: 'var(--nl-text-secondary)', fontSize: '14px', marginBottom: 'var(--space-6)' }}>
          Se encontraron <strong style={{ color: 'var(--nl-text-primary)' }}>{totalResults} obras</strong> relacionadas
        </p>
      )}

      {!isLoading && SECTIONS.map((section) => (
        <SagaSection key={section.key} section={section} obras={grouped[section.key]} />
      ))}

      {!isLoading && !error && totalResults === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
          <p style={{ fontSize: '20px', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
            Sin resultados para "{sagaName}"
          </p>
          <p style={{ color: 'var(--nl-text-muted)', fontSize: '14px' }}>
            Intenta con el nombre original en inglés o una variación del nombre.
          </p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL — selector de vista + buscador raíz
════════════════════════════════════════════════════════════ */
function Saga() {
  const { sagaName: sagaParam } = useParams();
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();

  const sagaFromUrl   = sagaParam ? decodeURIComponent(sagaParam) : '';
  const sagaFromQuery = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(sagaFromUrl || sagaFromQuery);
  const [activeSaga,  setActiveSaga] = useState(sagaFromUrl || sagaFromQuery);

  /* Sincroniza cuando cambia el param de URL */
  useEffect(() => {
    const name = sagaParam ? decodeURIComponent(sagaParam) : '';
    setActiveSaga(name);
    setInputValue(name);
  }, [sagaParam]);

  const curatedData = activeSaga ? getCuratedSaga(activeSaga) : null;

  function handleSearch(e) {
    e.preventDefault();
    if (!inputValue.trim()) return;
    navigate(`/saga/${encodeURIComponent(inputValue.trim())}`);
  }

  /* ── Página de entrada (sin saga seleccionada) ─────────── */
  if (!activeSaga) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nl-accent)', marginBottom: 'var(--space-2)' }}>
            Explorar saga
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 'var(--space-6)' }}>
            ¿Qué universo quieres explorar?
          </h1>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-3)', maxWidth: '560px', marginBottom: 'var(--space-8)' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--nl-text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Spider-Man, Star Wars, Dragon Ball…"
                autoFocus
                style={{ width: '100%', height: '52px', background: 'var(--nl-bg-elevated)', border: '1px solid var(--nl-border)', borderRadius: 'var(--radius-input)', color: 'var(--nl-text-primary)', fontSize: '15px', padding: '0 var(--space-4) 0 48px', outline: 'none', fontFamily: 'var(--font-ui)' }}
              />
            </div>
            <button type="submit" className="nl-btn nl-btn--primary nl-btn--md">Explorar</button>
          </form>

          {/* Sagas curadas como shortcuts */}
          <p style={{ color: 'var(--nl-text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)', letterSpacing: '0.06em' }}>
            SAGAS CON VISTA PROPIA
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {Object.values(CURATED_SAGAS).map((saga) => (
              <button
                key={saga.displayName}
                onClick={() => navigate(`/saga/${encodeURIComponent(saga.displayName)}`)}
                style={{
                  padding:      '8px 16px',
                  borderRadius: '20px',
                  border:       `1px solid ${saga.accent}44`,
                  background:   `${saga.accent}11`,
                  color:        saga.accent,
                  fontSize:     '13px',
                  cursor:       'pointer',
                  fontFamily:   'var(--font-ui)',
                  fontWeight:   500,
                  transition:   'all 150ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${saga.accent}22`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${saga.accent}11`; }}
              >
                {saga.displayName}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Vista curada o genérica ───────────────────────────── */
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeSaga}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{    opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {curatedData
          ? <CuratedSagaView sagaName={activeSaga} curated={curatedData} />
          : <GenericSagaView sagaName={activeSaga} />
        }
      </motion.div>
    </AnimatePresence>
  );
}

export default Saga;
