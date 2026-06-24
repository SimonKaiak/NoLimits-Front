import { describe, test, vi, assert } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import HeroSection from '@/components/sections/HeroSection';

vi.mock('@/components/ui/SearchBar', () => ({
  default: () => <div data-testid="search-bar">SearchBar</div>,
}));

vi.mock('@/services/tmdb', () => ({
  searchMovies: vi.fn(() =>
    Promise.resolve({
      results: [
        {
          id: 1,
          title: 'Mock Movie',
          release_date: '2024-01-01',
          vote_average: 8,
          backdrop_path: '/backdrop.jpg',
        },
      ],
    })
  ),
}));

function renderHeroSection() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <HeroSection />
    </QueryClientProvider>
  );
}

describe('HeroSection', () => {
  test('renderiza el hero principal', () => {
    renderHeroSection();

    assert.isNotNull(
      screen.getByRole('region', { name: 'Hero principal' })
    );
  });

  test('renderiza el headline principal', () => {
    renderHeroSection();

    assert.isNotNull(screen.getByText('Una'));
    assert.isNotNull(screen.getByText('plataforma.'));
    assert.isNotNull(screen.getByText('Todas'));
    assert.isNotNull(screen.getByText('las'));
    assert.isNotNull(screen.getByText('sagas.'));
  });

  test('renderiza el subtítulo', () => {
    renderHeroSection();

    assert.isNotNull(
      screen.getByText(/Películas, series, videojuegos/i)
    );
  });

  test('renderiza SearchBar', () => {
    renderHeroSection();

    assert.isNotNull(screen.getByTestId('search-bar'));
  });

  test('renderiza estadísticas', () => {
    renderHeroSection();

    assert.isNotNull(screen.getByText('12+'));
    assert.isNotNull(screen.getByText('5'));
    assert.isNotNull(screen.getByText('∞'));

    assert.isNotNull(screen.getByText('sagas curadas'));
    assert.isNotNull(screen.getByText('fuentes de datos'));
    assert.isNotNull(screen.getByText('contenido'));
  });

  test('renderiza el texto de marca', () => {
    renderHeroSection();

    assert.isNotNull(
      screen.getByText(/no\/limits · hub cultural/i)
    );
  });
});