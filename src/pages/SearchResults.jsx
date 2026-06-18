/**
 * pages/SearchResults.jsx
 * Resultados de búsqueda agrupados por tipo de contenido.
 *
 * Grid específico para búsqueda: más columnas → tarjetas más pequeñas → menos zoom.
 *   Mobile:  3 columnas  (~120px/card)
 *   Tablet:  4 columnas  (~160px/card)
 *   Desktop: 6 columnas  (~180px/card)
 *
 * Resultados agrupados por tipo (Películas, Series, Anime, Juegos, Libros, Música)
 * para que el usuario entienda de dónde viene cada resultado.
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion }          from 'motion/react';
import { Film, Tv, Zap, Sword, BookOpen, Music, Search } from 'lucide-react';
import MediaCard    from '@/components/cards/MediaCard';
import AnimeCard    from '@/components/cards/AnimeCard';
import BookCard     from '@/components/cards/BookCard';
import GameCard from '@/components/cards/GameCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import SearchBar    from '@/components/ui/SearchBar';
import { useSearch } from '@/hooks/useSearch';
import { MEDIA_TYPES, CARD_STAGGER_DELAY } from '@/utils/constants';
import { useTrendingMovies, useTrendingSeries } from '@/hooks/useTMDB';
import { useTopAnime } from '@/hooks/useJikan';
import { useBooksBySubject } from '@/hooks/useOpenLibrary';
import { useTopGames } from '@/hooks/useRAWG';
import { useMusicSearch } from '@/hooks/useMusicBrainz';
import { BOOK_SUBJECTS } from '@/utils/constants';

/* ── Configuración de grupos por tipo ─────────────────────── */
const TYPE_GROUPS = [
  { type: MEDIA_TYPES.MOVIE,  label: 'Películas',   icon: Film,     cardType: 'media' },
  { type: MEDIA_TYPES.SERIES, label: 'Series',      icon: Tv,       cardType: 'media' },
  { type: MEDIA_TYPES.ANIME,  label: 'Anime',       icon: Zap,      cardType: 'anime' },
  { type: MEDIA_TYPES.GAME,   label: 'Videojuegos', icon: Sword,    cardType: 'game'  },
  { type: MEDIA_TYPES.BOOK,   label: 'Libros',      icon: BookOpen, cardType: 'book'  },
  { type: MEDIA_TYPES.MUSIC,  label: 'Música',      icon: Music,    cardType: 'media' },
];

const TRENDING_LABELS = new Map([
  ['all',    'contenidos en tendencia'],
  ['movie',  'películas en tendencia'],
  ['series', 'series en tendencia'],
  ['anime',  'animes destacados'],
  ['book',   'libros recomendados'],
  ['game',   'juegos destacados'],
  ['music',  'álbumes destacados'],
]);

/* ── Selector de card por tipo ────────────────────────────── */
function CardForType({ obra, cardType }) {
  if (cardType === 'anime') return <AnimeCard obra={obra} />;
  if (cardType === 'book')  return <BookCard  obra={obra} />;
  if (cardType === 'game')  return <GameCard  obra={obra} />;
  return <MediaCard obra={obra} />;
}

/* ── Encabezado de grupo (con barra animada de marca) ─────── */
function GroupHeader({ icon: Icon, label, count, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1,  x: 0   }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          'var(--space-3)',
        marginBottom: 'var(--space-4)',
        paddingBottom:'var(--space-3)',
        borderBottom: '1px solid var(--nl-border)',
      }}
    >
      {/* Barra roja animada */}
      <motion.span
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
        style={{
          display:         'block',
          width:           '20px',
          height:          '2px',
          background:      'var(--nl-accent)',
          transformOrigin: 'left',
          flexShrink:      0,
        }}
      />

      <Icon size={13} color="var(--nl-accent)" />

      <span
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color:         'white',
        }}
      >
        {label}
      </span>

      {/* Contador */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize:   '11px',
          color:      'var(--nl-accent)',
        }}
      >
        {count}
      </span>
    </motion.div>
  );
}

/* ── Grupo de resultados por tipo ─────────────────────────── */
function ResultGroup({ group, obras, groupIndex }) {
  if (!obras || obras.length === 0) return null;

  const uniqueObras = Array.from(
    new Map(obras.map((obra) => [obra.id, obra])).values()
  );

  /* Libros: grid horizontal */
  const gridClass = group.cardType === 'book'
    ? 'nl-grid nl-grid--books'
    : 'nl-grid nl-grid--search';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1,  y: 0  }}
      transition={{ duration: 0.45, delay: groupIndex * 0.07, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginBottom: 'var(--space-10)', marginTop: 'var(--space-12)' }}

    >
      <GroupHeader
        icon={group.icon}
        label={group.label}
        count={uniqueObras.length}
        index={groupIndex}
      />

      <motion.div
        className={gridClass}
        variants={{ visible: { transition: { staggerChildren: CARD_STAGGER_DELAY } } }}
        initial="hidden"
        animate="visible"
      >
        {uniqueObras.slice(0, 18).map((obra) => (
          <CardForType key={obra.id} obra={obra} cardType={group.cardType} />
        ))}
      </motion.div>
    </motion.section>
  );
}

/* ── Página principal ─────────────────────────────────────── */
function SearchResults() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const query    = params.get('q')    ?? '';
  const type     = params.get('type') ?? 'all';

  const { data: results, isLoading, isFetching } = useSearch(query, type);

  const isDefaultView = !query.trim();

  const defaultMovies = useTrendingMovies();
  const defaultSeries = useTrendingSeries();
  const defaultAnime  = useTopAnime();
  const defaultBooks  = useBooksBySubject(BOOK_SUBJECTS.SCI_FI);
  const defaultGames  = useTopGames();
  const defaultMusic  = useMusicSearch('soundtrack');

  const defaultQueryByType = new Map([
    [MEDIA_TYPES.MOVIE,  defaultMovies],
    [MEDIA_TYPES.SERIES, defaultSeries],
    [MEDIA_TYPES.ANIME,  defaultAnime],
    [MEDIA_TYPES.BOOK,   defaultBooks],
    [MEDIA_TYPES.GAME,   defaultGames],
    [MEDIA_TYPES.MUSIC,  defaultMusic],
  ]);

  const activeDefaultQuery = defaultQueryByType.get(type);

  const allDefaultResults = [
    ...(defaultMovies.data ?? []),
    ...(defaultSeries.data ?? []),
    ...(defaultAnime.data ?? []),
    ...(defaultBooks.data ?? []),
    ...(defaultGames.data ?? []),
    ...(defaultMusic.data ?? []),
  ];

  const allDefaultIsLoading =
    defaultMovies.isLoading ||
    defaultSeries.isLoading ||
    defaultAnime.isLoading ||
    defaultBooks.isLoading ||
    defaultGames.isLoading ||
    defaultMusic.isLoading;

  const finalResults = isDefaultView
    ? type === 'all'
      ? allDefaultResults
      : activeDefaultQuery?.data ?? []
    : results ?? [];

  const finalIsLoading = isDefaultView
    ? type === 'all'
      ? allDefaultIsLoading
      : activeDefaultQuery?.isLoading
    : isLoading;

  const totalCount = finalResults.length;

  /* Agrupa los resultados por tipo */
  const grouped = TYPE_GROUPS.reduce((acc, group) => {
    acc[group.type] = finalResults.filter((o) => o.type === group.type);
    return acc;
  }, {});

  return (
    <div style={{ paddingBottom: 'var(--space-16)' }}>
      {/* ── ENCABEZADO DE BÚSQUEDA ────────────────────────── */}
      <div
        style={{
          background:   'var(--nl-bg-elevated)',
          borderBottom: '1px solid var(--nl-border)',
          paddingTop:   'var(--space-6)',
          paddingBottom:'var(--space-6)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div className="container">
          {/* Label de sección */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
            <Search size={12} color="var(--nl-accent)" />
            <span
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color:         'var(--nl-accent)',
              }}
            >
              Resultados de búsqueda
            </span>
          </div>

          {/* Título con query */}
          {(query || isDefaultView) && (
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1,  y: 0 }}
              style={{
                fontFamily:    'var(--font-display)',
                fontSize:      'clamp(20px, 3vw, 36px)',
                fontWeight:    700,
                letterSpacing: '-0.03em',
                marginBottom:  'var(--space-4)',
              }}
            >
              {finalIsLoading ? (
                query ? (
                  <>Buscando <span style={{ color: 'var(--nl-accent)' }}>"{query}"</span>…</>
                ) : (
                  <>Cargando contenido…</>
                )
              ) : totalCount > 0 ? (
                query ? (
                  <>
                    <span style={{ color: 'var(--nl-accent)' }}>{totalCount}</span>
                    {' '}resultado{totalCount !== 1 ? 's' : ''} para{' '}
                    <span style={{ color: 'var(--nl-text-secondary)', fontWeight: 500 }}>
                      "{query}"
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ color: 'var(--nl-accent)' }}>{totalCount}</span>
                    {' '}
                    {TRENDING_LABELS.get(type) ?? 'contenidos disponibles'}
                  </>
                )
              ) : (
                query ? (
                  <>
                    Sin resultados para{' '}
                    <span style={{ color: 'var(--nl-text-secondary)' }}>
                      "{query}"
                    </span>
                  </>
                ) : (
                  <>Sin contenido disponible</>
                )
              )}

              {/* Indicador de fetch en progreso */}
              {isFetching && !finalIsLoading && !isDefaultView && (
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ marginLeft: '10px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--nl-text-muted)', fontWeight: 400 }}
                >
                  · cargando más…
                </motion.span>
              )}
            </motion.h1>
          )}

          {/* SearchBar */}
          <SearchBar initialQuery={query} initialType={type} />
        </div>
      </div>

      {/* ── CONTENIDO ─────────────────────────────────────── */}
      <div className="container">
        {/* Skeleton */}
        {finalIsLoading && (
          <div className="nl-grid nl-grid--search">
            <SkeletonCard count={12} />
          </div>
        )}

        {/* Grupos de resultados */}
        {!finalIsLoading && totalCount > 0 && (
          TYPE_GROUPS.map((group, i) => (
            grouped[group.type]?.length > 0 && (
              <ResultGroup
                key={group.type}
                group={group}
                obras={grouped[group.type]}
                groupIndex={i}
                activeType={type}
              />
            )
          ))
        )}

        {/* Estado vacío */}
        {!finalIsLoading && totalCount === 0 && query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: 'var(--space-3)',
              }}
            >
              Sin resultados
            </p>

            <p
              style={{
                color: 'var(--nl-text-muted)',
                fontSize: '14px',
                marginBottom: 'var(--space-6)',
              }}
            >
              {type === 'all'
                ? (
                  <>
                    No se encontraron resultados para{" "}
                    <span style={{ color: 'var(--nl-text-secondary)' }}>
                      "{query}"
                    </span>.
                  </>
                )
                : (
                  <>
                    No se encontraron{" "}
                    <span style={{ color: 'var(--nl-accent)' }}>
                      {TYPE_GROUPS.find((g) => g.type === type)?.label.toLowerCase()}
                    </span>{" "}
                    para{" "}
                    <span style={{ color: 'var(--nl-text-secondary)' }}>
                      "{query}"
                    </span>.
                  </>
                )}
            </p>

            <button
              onClick={() => navigate(`/saga/${encodeURIComponent(query)}`)}
              className="nl-btn nl-btn--primary nl-btn--md"
            >
              Explorar saga "{query}"
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;