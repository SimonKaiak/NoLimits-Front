/**
 * components/sections/ContentSection.jsx
 * Sección con encabezado de marca + grid de cards con stagger.
 *
 * Encabezado: barra roja animada · etiqueta en mono uppercase · contador en acento
 * Grid: usa nl-grid--cards (home) por defecto.
 *
 * Props:
 *  title      — etiqueta de sección (ej: "EN TENDENCIA · ESTA SEMANA")
 *  obras      — Obra[]
 *  isLoading  — boolean
 *  error      — Error | null
 *  cardType   — 'media' | 'anime' | 'book'
 *  limit      — máx items a mostrar
 *  gridClass  — override del CSS grid (ej: 'nl-grid--search')
 */

import PropTypes from 'prop-types';
import { motion } from 'motion/react';
import MediaCard    from '@/components/cards/MediaCard';
import AnimeCard    from '@/components/cards/AnimeCard';
import BookCard     from '@/components/cards/BookCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { CARD_STAGGER_DELAY } from '@/utils/constants';

const CARD_COMPONENTS = new Map([
  ['media', MediaCard],
  ['anime', AnimeCard],
  ['book',  BookCard],
]);

function ContentSection({
  title,
  obras,
  isLoading,
  error,
  cardType    = 'media',
  limit       = 10,
  gridClass,
}) {
  const CardComponent  = CARD_COMPONENTS.get(cardType) ?? MediaCard;
  const resolvedGrid   = gridClass ?? (cardType === 'book' ? 'nl-grid nl-grid--books' : 'nl-grid nl-grid--cards');
  const visibleObras   = obras ? obras.slice(0, limit) : [];

  return (
    <section className="nl-section">
      {/* ── Encabezado de sección con identidad de marca ──── */}
      {title && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1,  x: 0  }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="container"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            'var(--space-3)',
            marginBottom:   'var(--space-6)',
            paddingBottom:  'var(--space-4)',
            borderBottom:   '1px solid var(--nl-border)',
          }}
        >
          {/* Barra roja animada */}
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.1 }}
            style={{
              display:         'block',
              width:           '24px',
              height:          '2px',
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
            {title}
          </h2>

          {/* Contador si hay datos */}
          {!isLoading && visibleObras.length > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize:   '11px',
                color:      'var(--nl-accent)',
                marginLeft: 'auto',
              }}
            >
              {visibleObras.length < limit
                ? visibleObras.length
                : `${limit}+`
              }
            </span>
          )}
        </motion.div>
      )}

      <div className="container">
        {/* Skeleton */}
        {(isLoading || (error && !obras?.length)) && (
          <div className={resolvedGrid}>
            <SkeletonCard count={Math.min(limit, 5)} />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && !obras?.length && (
          <p style={{ color: 'white', fontFamily: 'var(--font-mono)', fontSize: '12px', padding: 'var(--space-4) 0' }}>
            No se pudo cargar esta sección.
          </p>
        )}

        {/* Grid con stagger */}
        {!isLoading && !error && visibleObras.length > 0 && (
          <motion.div
            className={resolvedGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={{
              visible: { transition: { staggerChildren: CARD_STAGGER_DELAY } },
            }}
          >
            {visibleObras.map((obra) => (
              <CardComponent key={obra.id} obra={obra} />
            ))}
          </motion.div>
        )}

        {/* Vacío */}
        {!isLoading && !error && visibleObras.length === 0 && (
          <p style={{ color: 'white', fontSize: '13px', padding: 'var(--space-4) 0' }}>
            Sin contenido en esta sección.
          </p>
        )}
      </div>
    </section>
  );
}

ContentSection.propTypes = {
  title:     PropTypes.string,
  obras:     PropTypes.array,
  isLoading: PropTypes.bool,
  error:     PropTypes.object,
  cardType:  PropTypes.oneOf(['media', 'anime', 'book']),
  limit:     PropTypes.number,
  gridClass: PropTypes.string,
};

export default ContentSection;
