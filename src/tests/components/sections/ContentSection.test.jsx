import { describe, test, vi, assert } from 'vitest';
import { render, screen } from '@testing-library/react';

import ContentSection from '@/components/sections/ContentSection';

vi.mock('@/components/cards/MediaCard', () => ({
  default: ({ obra }) => <div>MEDIA-{obra.title}</div>,
}));

vi.mock('@/components/cards/AnimeCard', () => ({
  default: ({ obra }) => <div>ANIME-{obra.title}</div>,
}));

vi.mock('@/components/cards/BookCard', () => ({
  default: ({ obra }) => <div>BOOK-{obra.title}</div>,
}));

vi.mock('@/components/ui/SkeletonCard', () => ({
  default: ({ count }) => (
    <div data-testid="skeleton-card">
      Skeleton {count}
    </div>
  ),
}));

describe('ContentSection', () => {
  const obras = [
    {
      id: '1',
      title: 'Matrix',
      type: 'movie',
    },
    {
      id: '2',
      title: 'Dune',
      type: 'movie',
    },
  ];

  test('renderiza el título de la sección', () => {
    render(
      <ContentSection
        title="EN TENDENCIA"
        obras={obras}
      />
    );

    assert.isNotNull(
      screen.getByText('EN TENDENCIA')
    );
  });

  test('muestra contador cuando existen elementos', () => {
    render(
      <ContentSection
        title="TEST"
        obras={obras}
        limit={10}
      />
    );

    assert.isNotNull(
      screen.getByText('2')
    );
  });

  test('muestra contador como limit+ cuando alcanza el límite', () => {
    render(
      <ContentSection
        title="TEST"
        obras={obras}
        limit={2}
      />
    );

    assert.isNotNull(
      screen.getByText('2+')
    );
  });

  test('renderiza MediaCard por defecto', () => {
    render(
      <ContentSection
        obras={obras}
      />
    );

    assert.isNotNull(
      screen.getByText('MEDIA-Matrix')
    );
  });

  test('renderiza AnimeCard cuando cardType es anime', () => {
    render(
      <ContentSection
        obras={obras}
        cardType="anime"
      />
    );

    assert.isNotNull(
      screen.getByText('ANIME-Matrix')
    );
  });

  test('renderiza BookCard cuando cardType es book', () => {
    render(
      <ContentSection
        obras={obras}
        cardType="book"
      />
    );

    assert.isNotNull(
      screen.getByText('BOOK-Matrix')
    );
  });

  test('muestra skeleton cuando está cargando', () => {
    render(
      <ContentSection
        isLoading
        obras={[]}
      />
    );

    assert.isNotNull(
      screen.getByTestId('skeleton-card')
    );
  });

  test('muestra error cuando falla la carga y no hay datos', () => {
    render(
      <ContentSection
        error={new Error('error')}
        obras={[]}
      />
    );

    assert.isNotNull(
      screen.getByText(
        'No se pudo cargar esta sección.'
      )
    );
  });

  test('muestra mensaje vacío cuando no hay contenido', () => {
    render(
      <ContentSection
        obras={[]}
      />
    );

    assert.isNotNull(
      screen.getByText(
        'Sin contenido en esta sección.'
      )
    );
  });

  test('respeta el límite de elementos visibles', () => {
    render(
      <ContentSection
        obras={[
          { id: '1', title: 'A' },
          { id: '2', title: 'B' },
          { id: '3', title: 'C' },
        ]}
        limit={2}
      />
    );

    assert.isNotNull(screen.getByText('MEDIA-A'));
    assert.isNotNull(screen.getByText('MEDIA-B'));
    assert.isNull(screen.queryByText('MEDIA-C'));
  });

  test('usa gridClass personalizado', () => {
    const { container } = render(
      <ContentSection
        obras={obras}
        gridClass="mi-grid-personalizado"
      />
    );

    assert.isTrue(
      container.innerHTML.includes(
        'mi-grid-personalizado'
      )
    );
  });
});