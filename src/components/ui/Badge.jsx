/**
 * components/ui/Badge.jsx
 * Chip de tipo de obra y de rating para no/limits.
 *
 * Props:
 *  type     — MEDIA_TYPES.* (movie | series | anime | book | music | game)
 *  label    — texto a mostrar (si no se pasa, usa MEDIA_TYPE_LABELS[type])
 *  variant  — 'type' | 'rating' (rating usa el acento de marca)
 *
 * Restricción brandbook §04.3:
 *  Solo en chips pequeños. Texto al 100%, fondo al 15%.
 *  Nunca como background dominante.
 *
 * Estilos: components.css (.nl-badge*)
 */

import PropTypes from 'prop-types';
import { MEDIA_TYPE_LABELS, MEDIA_TYPE_BADGE_CLASS } from '@/utils/constants';

function Badge({ type, label, variant = 'type' }) {
  /* Badge de rating (★ 8.7) */
  if (variant === 'rating') {
    return (
      <span className="nl-badge nl-badge--rating">
        ★ {label}
      </span>
    );
  }

  /* Badge de tipo de obra */
  const badgeClass = MEDIA_TYPE_BADGE_CLASS.get(type) ?? '';
  const displayLabel = label ?? MEDIA_TYPE_LABELS.get(type) ?? type;

  return (
    <span className={`nl-badge ${badgeClass}`}>
      {displayLabel}
    </span>
  );
}

Badge.propTypes = {
  type:    PropTypes.string,
  label:   PropTypes.string,
  variant: PropTypes.oneOf(['type', 'rating']),
};

export default Badge;
