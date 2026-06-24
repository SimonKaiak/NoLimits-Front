import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, vi, assert } from 'vitest';
import SearchResults from '@/pages/SearchResults';
import { MEDIA_TYPES } from '@/utils/constants';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
  },
}));

vi.mock('@/components/ui/SearchBar', () => ({
  default: () => <div data-testid="search-bar">SearchBar</div>,
}));

vi.mock('@/components/ui/SkeletonCard', () => ({
  default: () => <div data-testid="skeleton-card">SkeletonCard</div>,
}));

vi.mock('@/components/cards/MediaCard', () => ({
  default: ({ obra }) => <article>{obra.title}</article>,
}));

vi.mock('@/components/cards/AnimeCard', () => ({
  default: ({ obra }) => <article>{obra.title}</article>,
}));

vi.mock('@/components/cards/BookCard', () => ({
  default: ({ obra }) => <article>{obra.title}</article>,
}));

vi.mock('@/components/cards/GameCard', () => ({
  default: ({ obra }) => <article>{obra.title}</article>,
}));

vi.mock('@/hooks/useSearch', () => ({
  useSearch: vi.fn(),
}));

vi.mock('@/hooks/useTMDB', () => ({
  useTrendingMovies: vi.fn(() => ({ data: [], isLoading: false })),
  useTrendingSeries: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/hooks/useJikan', () => ({
  useTopAnime: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/hooks/useOpenLibrary', () => ({
  useBooksBySubject: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/hooks/useRAWG', () => ({
  useTopGames: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/hooks/useMusicBrainz', () => ({
  useMusicSearch: vi.fn(() => ({ data: [], isLoading: false })),
}));

import { useSearch } from '@/hooks/useSearch';

describe('SearchResults - tests de regresión', () => {
  test('agrupa y muestra resultados por tipo de contenido', () => {
    useSearch.mockReturnValue({
      data: [
        { id: 'movie-1', title: 'Interestelar', type: MEDIA_TYPES.MOVIE },
        { id: 'series-1', title: 'Breaking Bad', type: MEDIA_TYPES.SERIES },
        { id: 'anime-1', title: 'Naruto', type: MEDIA_TYPES.ANIME },
        { id: 'game-1', title: 'Cyberpunk 2077', type: MEDIA_TYPES.GAME },
        { id: 'book-1', title: 'Dune', type: MEDIA_TYPES.BOOK },
        { id: 'music-1', title: 'Random Access Memories', type: MEDIA_TYPES.MUSIC },
      ],
      isLoading: false,
      isFetching: false,
    });

    render(
      <MemoryRouter initialEntries={['/search?q=test&type=all']}>
        <SearchResults />
      </MemoryRouter>
    );

    assert.isNotNull(screen.getByText('6'));
    assert.isNotNull(screen.getByText(/test/i));

    assert.isNotNull(screen.getByText('Películas'));
    assert.isNotNull(screen.getByText('Series'));
    assert.isNotNull(screen.getByText('Anime'));
    assert.isNotNull(screen.getByText('Videojuegos'));
    assert.isNotNull(screen.getByText('Libros'));
    assert.isNotNull(screen.getByText('Música'));

    assert.isNotNull(screen.getByText('Interestelar'));
    assert.isNotNull(screen.getByText('Breaking Bad'));
    assert.isNotNull(screen.getByText('Naruto'));
    assert.isNotNull(screen.getByText('Cyberpunk 2077'));
    assert.isNotNull(screen.getByText('Dune'));
    assert.isNotNull(screen.getByText('Random Access Memories'));
  });

  test('muestra estado vacío cuando no hay resultados para una búsqueda', () => {
    useSearch.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
    });

    render(
      <MemoryRouter initialEntries={['/search?q=noexiste&type=all']}>
        <SearchResults />
      </MemoryRouter>
    );

    assert.isNotNull(screen.getByText('Sin resultados'));
    assert.isNotNull(screen.getByText(/No se encontraron resultados para/i));
    assert.isNotNull(screen.getByRole('button', { name: /explorar saga/i }));
  });

  test('muestra skeleton mientras carga la búsqueda', () => {
    useSearch.mockReturnValue({
      data: [],
      isLoading: true,
      isFetching: false,
    });

    render(
      <MemoryRouter initialEntries={['/search?q=matrix&type=all']}>
        <SearchResults />
      </MemoryRouter>
    );

    assert.isNotNull(screen.getByTestId('skeleton-card'));
    assert.isNotNull(screen.getByText(/Buscando/i));
  });

  test('muestra texto singular cuando existe un resultado', () => {
    useSearch.mockReturnValue({
      data: [
        {
          id: '1',
          title: 'Matrix',
          type: MEDIA_TYPES.MOVIE,
        },
      ],
      isLoading: false,
      isFetching: false,
    });

    render(
      <MemoryRouter initialEntries={['/search?q=matrix&type=all']}>
        <SearchResults />
      </MemoryRouter>
    );

    expect(screen.getByText('Matrix')).toBeInTheDocument();

    expect(screen.getByText(/resultado para/i)).toBeInTheDocument();
  });

  test('muestra indicador cargando más', () => {
    useSearch.mockReturnValue({
      data: [
        {
          id: '1',
          title: 'Matrix',
          type: MEDIA_TYPES.MOVIE,
        },
      ],
      isLoading: false,
      isFetching: true,
    });

    render(
      <MemoryRouter initialEntries={['/search?q=matrix&type=all']}>
        <SearchResults />
      </MemoryRouter>
    );

    expect(screen.getByText('Matrix')).toBeInTheDocument();
  });

  test('muestra mensaje vacío para películas', () => {
    useSearch.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
    });

    render(
      <MemoryRouter initialEntries={['/search?q=matrix&type=movie']}>
        <SearchResults />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/No se encontraron/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /explorar saga/i })
    ).toBeInTheDocument();
  });

  test('no muestra grupos sin resultados', () => {
    useSearch.mockReturnValue({
      data: [
        {
          id: '1',
          title: 'Matrix',
          type: MEDIA_TYPES.MOVIE,
        },
      ],
      isLoading: false,
      isFetching: false,
    });

    render(
      <MemoryRouter initialEntries={['/search?q=matrix&type=all']}>
        <SearchResults />
      </MemoryRouter>
    );

    expect(screen.getByText('Películas')).toBeInTheDocument();
    expect(screen.queryByText('Anime')).not.toBeInTheDocument();
  });

  test('elimina resultados duplicados por id', () => {
    useSearch.mockReturnValue({
      data: [
        {
          id: '1',
          title: 'Matrix',
          type: MEDIA_TYPES.MOVIE,
        },
        {
          id: '1',
          title: 'Matrix',
          type: MEDIA_TYPES.MOVIE,
        },
      ],
      isLoading: false,
      isFetching: false,
    });

    render(
      <MemoryRouter initialEntries={['/search?q=matrix&type=all']}>
        <SearchResults />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Matrix').length).toBeGreaterThan(0);
  });
});