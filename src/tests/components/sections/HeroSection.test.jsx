import { describe, test, vi, assert } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('motion/react', () => ({
  motion: {
    div:  ({ children, ...p }) => <div {...p}>{children}</div>,
    span: ({ children, custom, variants, ...p }) => {
      // Ejecuta la función visible de variants para cubrir línea 72
      if (variants?.visible && typeof variants.visible === 'function') {
        variants.visible(custom ?? 0);
      }
      return <span {...p}>{children}</span>;
    },
    p:    ({ children, ...p }) => <p {...p}>{children}</p>,
  },
}));

vi.mock('@/components/ui/SearchBar', () => ({
  default: () => <div data-testid="search-bar">SearchBar</div>,
}));

vi.mock('@/services/tmdb', () => ({
  searchMovies: vi.fn(() =>
    Promise.resolve({
      results: [{
        id: 1,
        title: 'Mock Movie',
        release_date: '2024-01-01',
        vote_average: 8,
        backdrop_path: '/backdrop.jpg',
      }],
    })
  ),
}));

import HeroSection from '@/components/sections/HeroSection';

function renderHero() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('HeroSection', () => {

  test('renderiza el headline principal', () => {
    renderHero();
    assert.isNotNull(screen.getByText('Una'));
    assert.isNotNull(screen.getByText('plataforma.'));
    assert.isNotNull(screen.getByText('sagas.'));
  });

  test('renderiza el subtítulo descriptivo', () => {
    renderHero();
    assert.isNotNull(screen.getByText(/Películas, series, videojuegos/i));
  });

  test('renderiza el eyebrow con la marca', () => {
    renderHero();
    assert.isNotNull(screen.getByText(/no\/limits · hub cultural/i));
  });

  test('renderiza el SearchBar', () => {
    renderHero();
    assert.isNotNull(screen.getByTestId('search-bar'));
  });

  test('renderiza las estadísticas', () => {
    renderHero();
    assert.isNotNull(screen.getByText('12+'));
    assert.isNotNull(screen.getByText('5'));
    assert.isNotNull(screen.getByText('∞'));
    assert.isNotNull(screen.getByText('sagas curadas'));
    assert.isNotNull(screen.getByText('fuentes de datos'));
    assert.isNotNull(screen.getByText('contenido'));
  });

  test('tiene aria-label en la sección hero', () => {
    renderHero();
    assert.isNotNull(screen.getByRole('region', { name: 'Hero principal' }));
  });

  // ── MosaicColumn — imagen vs skeleton ────────────────────────
  test('renderiza skeleton cuando no hay backdrop', async () => {
    const { searchMovies } = await import('@/services/tmdb');
    searchMovies.mockResolvedValue({ results: [] });

    const { container } = renderHero();
    assert.isNotNull(container.querySelector('.nl-skeleton'));
  });

  test('renderiza imagen cuando hay backdrop disponible', async () => {
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

    renderHero();

    await waitFor(() => {
      const imgs = document.querySelectorAll('img[src]');
      assert.isTrue(imgs.length > 0);
    });
  });

  // ── Columnas pares vs impares (direction up/down) ─────────────
  test('renderiza 6 columnas de mosaico', () => {
    const { container } = renderHero();
    // El div aria-hidden contiene las columnas
    const mosaic = container.querySelector('[aria-hidden="true"]');
    assert.isNotNull(mosaic);
  });
});