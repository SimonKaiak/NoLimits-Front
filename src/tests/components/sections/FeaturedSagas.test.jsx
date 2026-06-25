import { describe, test, vi, beforeEach, assert } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import FeaturedSagas from '@/components/sections/FeaturedSagas';
import { searchMovies } from '@/services/tmdb';

vi.mock('@/services/tmdb', () => ({
  searchMovies: vi.fn(() =>
    Promise.resolve({
      results: [
        {
          id: 1,
          title: 'Mock Movie',
          release_date: '2024-01-01',
          vote_average: 8,
          backdrop_path: '/mock-backdrop.jpg',
        },
      ],
    })
  ),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderFeaturedSagas() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FeaturedSagas />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('FeaturedSagas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza el título de la sección', () => {
    renderFeaturedSagas();

    assert.isNotNull(
      screen.getByText('Sagas destacadas · Explora el universo completo')
    );
  });

  test('renderiza sagas destacadas principales', () => {
    renderFeaturedSagas();

    assert.isNotNull(screen.getByText('Spider-Man'));
    assert.isNotNull(screen.getByText('Star Wars'));
    assert.isNotNull(screen.getByText('Batman'));
    assert.isNotNull(screen.getByText('Dragon Ball'));
  });

  test('renderiza nombre personalizado de El Señor de los Anillos', () => {
    renderFeaturedSagas();

    assert.isNotNull(screen.getByText('El Señor de los Anillos'));
  });

  test('navega al hacer click en una saga', () => {
    renderFeaturedSagas();

    fireEvent.click(
      screen.getByRole('button', { name: 'Explorar saga Star Wars' })
    );

    assert.deepEqual(mockNavigate.mock.calls[0], ['/saga/Star%20Wars']);
  });

  test('navega al presionar Enter en una saga', () => {
    renderFeaturedSagas();

    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Explorar saga Batman' }),
      { key: 'Enter' }
    );

    assert.deepEqual(mockNavigate.mock.calls[0], ['/saga/Batman']);
  });

  test('muestra skeleton cuando no existe backdrop', () => {
    renderFeaturedSagas();

    const skeletons = document.querySelectorAll('.nl-skeleton');

    assert.isAbove(skeletons.length, 0);
  });

  test('renderiza iconos de tipos de contenido', () => {
    renderFeaturedSagas();

    assert.isAbove(screen.getAllByText('Películas').length, 0);
    assert.isAbove(screen.getAllByText('Series').length, 0);
    assert.isAbove(screen.getAllByText('Anime').length, 0);
    assert.isAbove(screen.getAllByText('Juegos').length, 0);
    assert.isAbove(screen.getAllByText('Libros').length, 0);
    assert.isAbove(screen.getAllByText('Música').length, 0);
  });

  test('renderiza numeración de sagas', () => {
    renderFeaturedSagas();

    assert.isNotNull(screen.getByText('01'));
    assert.isNotNull(screen.getByText('02'));
    assert.isNotNull(screen.getByText('03'));
  });

  test('renderiza todas las sagas configuradas', () => {
    renderFeaturedSagas();

    assert.isNotNull(screen.getByText('Harry Potter'));
    assert.isNotNull(screen.getByText('The Last of Us'));
    assert.isNotNull(screen.getByText('Attack on Titan'));
  });

  test('navega correctamente una saga con espacios', () => {
    renderFeaturedSagas();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Explorar saga Harry Potter',
      })
    );

    assert.deepEqual(
      mockNavigate.mock.calls[0],
      ['/saga/Harry%20Potter']
    );
  });

  test('las sagas tienen tabindex para accesibilidad', () => {
    renderFeaturedSagas();

    const saga = screen.getByRole('button', {
      name: 'Explorar saga Spider-Man',
    });

    assert.equal(saga.getAttribute('tabindex'), '0');
  });

  test('soporta respuesta vacía de TMDB', () => {
    searchMovies.mockImplementationOnce(() =>
      Promise.resolve({
        results: [],
      })
    );

    renderFeaturedSagas();

    assert.isNotNull(
      screen.getByText('Sagas destacadas · Explora el universo completo')
    );
  });
});