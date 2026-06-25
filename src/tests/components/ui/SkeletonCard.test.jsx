import { describe, test, assert } from 'vitest';
import { render } from '@testing-library/react';

import SkeletonCard from '@/components/ui/SkeletonCard';

describe('SkeletonCard', () => {
  test('renderiza 5 skeletons por defecto', () => {
    const { container } = render(<SkeletonCard />);
    assert.equal(container.querySelectorAll('.nl-skeleton-card').length, 5);
  });

  test('renderiza el número de skeletons indicado por count', () => {
    const { container } = render(<SkeletonCard count={3} />);
    assert.equal(container.querySelectorAll('.nl-skeleton-card').length, 3);
  });

  test('cada skeleton tiene poster y líneas de texto', () => {
    const { container } = render(<SkeletonCard count={1} />);
    assert.isNotNull(container.querySelector('.nl-skeleton-card__poster'));
    assert.isNotNull(container.querySelector('.nl-skeleton-card__body'));
    assert.isNotNull(container.querySelector('.nl-skeleton-card__line'));
  });

  test('renderiza 1 skeleton cuando count es 1', () => {
    const { container } = render(<SkeletonCard count={1} />);
    assert.equal(container.querySelectorAll('.nl-skeleton-card').length, 1);
  });
});