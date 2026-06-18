/**
 * components/ui/Button.jsx
 * Botón base del sistema de diseño no/limits.
 *
 * Props:
 *  variant  — 'primary' | 'secondary' | 'ghost' | 'destructive'
 *  size     — 'sm' | 'md' | 'lg'
 *  children — contenido del botón
 *  ...rest  — cualquier prop nativa de <button> (onClick, disabled, type, etc.)
 *
 * Estilos: components.css (.nl-btn*)
 * Restricción brandbook: sin gradientes, sin sombras.
 */

import PropTypes from 'prop-types';

/**
 * Mapeo de variante → sufijo de clase CSS.
 */
const VARIANT_CLASS = new Map([
  ['primary',     'nl-btn--primary'],
  ['secondary',   'nl-btn--secondary'],
  ['ghost',       'nl-btn--ghost'],
  ['destructive', 'nl-btn--destructive'],
]);

const SIZE_CLASS = new Map([
  ['sm', 'nl-btn--sm'],
  ['md', 'nl-btn--md'],
  ['lg', 'nl-btn--lg'],
]);

function Button({ variant = 'primary', size = 'md', children, className = '', ...rest }) {
  const variantClass = VARIANT_CLASS.get(variant) ?? VARIANT_CLASS.get('primary');
  const sizeClass    = SIZE_CLASS.get(size)    ?? SIZE_CLASS.get('md');

  return (
    <button
      className={`nl-btn ${variantClass} ${sizeClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  variant:   PropTypes.oneOf(['primary', 'secondary', 'ghost', 'destructive']),
  size:      PropTypes.oneOf(['sm', 'md', 'lg']),
  children:  PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled:  PropTypes.bool,
  onClick:   PropTypes.func,
  type:      PropTypes.string,
};

export default Button;
