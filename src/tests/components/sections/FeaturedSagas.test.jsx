import { describe, test, vi, beforeEach, assert } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import FeaturedSagas from '@/components/sections/FeaturedSagas';

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
  test('no renderiza imagen cuando backdropUrl es null', async () => {
    const { searchMovies } = await import('@/services/tmdb');
    searchMovies.mockResolvedValue({ results: [] });

    renderFeaturedSagas();

    assert.equal(screen.queryByAltText('Spider-Man'), null);
  });

  test('renderiza imagen cuando backdropUrl tiene valor', async () => {
    const { waitFor } = await import('@testing-library/react');
    const { searchMovies } = await import('@/services/tmdb');

    searchMovies.mockResolvedValue({
      results: [{
        id: 1,
        title: 'Mock',
        backdrop_path: '/backdrop.jpg',
        release_date: '2024-01-01',
        vote_average: 8,
      }]
    });

    renderFeaturedSagas();

    await waitFor(() => {
      const imgs = document.querySelectorAll('img');
      assert.isTrue(imgs.length > 0);
    });
  });
});