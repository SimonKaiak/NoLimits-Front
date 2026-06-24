import { describe, test, assert } from 'vitest';
import { render } from '@testing-library/react';

import SkeletonCard from '@/components/ui/SkeletonCard';

describe('SkeletonCard', () => {
  test('renderiza 5 skeletons por defecto', () => {
    const { container } = render(
      <SkeletonCard />
    );

    const cards =
      container.querySelectorAll('.nl-skeleton-card');

    assert.equal(cards.length, 5);
  });

  test('renderiza la cantidad indicada por count', () => {
    const { container } = render(
      <SkeletonCard count={3} />
    );

    const cards =
      container.querySelectorAll('.nl-skeleton-card');

    assert.equal(cards.length, 3);
  });

  test('renderiza cero skeletons cuando count es 0', () => {
    const { container } = render(
      <SkeletonCard count={0} />
    );

    const cards =
      container.querySelectorAll('.nl-skeleton-card');

    assert.equal(cards.length, 0);
  });

  test('cada skeleton contiene poster', () => {
    const { container } = render(
      <SkeletonCard count={1} />
    );

    const poster =
      container.querySelector('.nl-skeleton-card__poster');

    assert.isNotNull(poster);
  });

  test('cada skeleton contiene líneas de texto', () => {
    const { container } = render(
      <SkeletonCard count={1} />
    );

    const lines =
      container.querySelectorAll('.nl-skeleton-card__line');

    assert.equal(lines.length, 2);
  });

  test('renderiza múltiples skeletons correctamente', () => {
    const { container } = render(
      <SkeletonCard count={10} />
    );

    const cards =
      container.querySelectorAll('.nl-skeleton-card');

    assert.equal(cards.length, 10);
  });
});