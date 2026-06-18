/**
 * components/layout/Logo.jsx
 * Wordmark SVG inline del brandbook no/limits.
 *
 * Props:
 *  size    — 'sm' | 'md' | 'lg' (controla el font-size del SVG)
 *  variant — 'dark' | 'light' | 'mono-white' | 'compact'
 *
 * Composición (brandbook §03):
 *  "no" + "/" + "limits" — todo minúsculas, Geist 700, tracking -0.04em
 *  "/" en --nl-accent (#FF4D4D en dark, #E63946 en light)
 *  "no" y "limits" en --nl-text-primary
 *
 * Restricción brandbook: nunca deformar, rotar ni aplicar efectos al wordmark.
 */

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/* Tamaños de fuente mapeados a variantes */
const FONT_SIZES = new Map([
  ['sm', '16px'],
  ['md', '22px'],
  ['lg', '32px'],
]);

function Logo({ size = 'md', variant = 'dark' }) {
  const fontSize = FONT_SIZES.get(size) ?? FONT_SIZES.get('md');

  /* En variante compacta solo muestra "n/l" */
  if (variant === 'compact') {
    return (
      <Link to="/" aria-label="no/limits — inicio">
        <span
          style={{
            fontFamily:    'var(--font-display)',
            fontWeight:    700,
            fontSize,
            letterSpacing: '-0.04em',
            lineHeight:    1,
            userSelect:    'none',
          }}
        >
          <span style={{ color: 'var(--nl-text-primary)' }}>n</span>
          <span style={{ color: 'var(--nl-accent)' }}>/</span>
          <span style={{ color: 'var(--nl-text-primary)' }}>l</span>
        </span>
      </Link>
    );
  }

  /* Colores según variante */
  const textColor = variant === 'mono-white' ? '#FFFFFF' : 'var(--nl-text-primary)';
  const slashColor = variant === 'mono-white' ? '#FFFFFF' : 'var(--nl-accent)';

  return (
    <Link to="/" aria-label="no/limits — inicio">
      <span
        style={{
          fontFamily:    'var(--font-display)',
          fontWeight:    700,
          fontSize,
          letterSpacing: '-0.04em',
          lineHeight:    1,
          userSelect:    'none',
        }}
      >
        <span style={{ color: textColor }}>no</span>
        <span style={{ color: slashColor }}>/</span>
        <span style={{ color: textColor }}>limits</span>
      </span>
    </Link>
  );
}

Logo.propTypes = {
  size:    PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['dark', 'light', 'mono-white', 'compact']),
};

export default Logo;
