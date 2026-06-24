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

  test('usa el valor type cuando no existe label ni traducción', () => {
    render(
      <Badge type="tipo-raro" />
    );

    assert.isNotNull(
      screen.getByText('tipo-raro')
    );
  });

  test('usa clase vacía cuando el tipo no existe en MEDIA_TYPE_BADGE_CLASS', () => {
    render(
      <Badge type="tipo-raro" />
    );

    const badge =
      screen.getByText('tipo-raro');

    assert.equal(
      badge.className,
      'nl-badge '
    );
  });

  test('renderiza correctamente un badge de anime', () => {
    render(
      <Badge type="anime" />
    );

    assert.isNotNull(
      screen.getByText('Anime')
    );
  });
});