import { describe, test, assert } from 'vitest';
import { render, screen } from '@testing-library/react';

import Badge from '@/components/ui/Badge';

describe('Badge', () => {
  test('renderiza badge de tipo película', () => {
    render(
      <Badge type="movie" />
    );

    assert.isNotNull(
      screen.getByText('Película')
    );
  });

  test('renderiza label personalizada', () => {
    render(
      <Badge
        type="movie"
        label="Custom Label"
      />
    );

    assert.isNotNull(
      screen.getByText('Custom Label')
    );
  });

  test('renderiza badge de rating', () => {
    render(
      <Badge
        variant="rating"
        label="8.7"
      />
    );

    assert.isNotNull(
      screen.getByText(/8.7/)
    );
  });

  test('aplica clase de rating correctamente', () => {
    render(
      <Badge
        variant="rating"
        label="9.1"
      />
    );

    const badge = screen.getByText(/9.1/);

    assert.include(
      badge.className,
      'nl-badge--rating'
    );
  });

  test('aplica clase correspondiente al tipo', () => {
    render(
      <Badge type="game" />
    );

    const badge = screen.getByText('Videojuego');

    assert.include(
      badge.className,
      'nl-badge'
    );
  });
  test('usa clase y label vacíos cuando type no está en los maps', () => {
    render(<Badge type="unknown_type" />);
    const badge = screen.getByText('unknown_type');
    assert.isNotNull(badge);
  });
});