import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MEDIA_TYPES } from '@/utils/constants';
import { useSearch, useSagaSearch} from '@/hooks/useSearch';
import * as tmdb from '@/services/tmdb';
import * as jikan from '@/services/jikan';
import * as openLibrary from '@/services/openLibrary';
import * as rawg from '@/services/rawg';
import * as musicbrainz from '@/services/musicbrainz';
import * as productos from '@/services/productos';

vi.mock('@/services/tmdb');
vi.mock('@/services/jikan');
vi.mock('@/services/openLibrary');
vi.mock('@/services/rawg');
vi.mock('@/services/musicbrainz');
vi.mock('@/services/productos');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useSearch', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('no ejecuta búsqueda con query vacía', () => {
    const { result } = renderHook(
      () => useSearch(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  test('llama searchMovies cuando type es MOVIE', async () => {
    tmdb.searchMovies.mockResolvedValue({
      results: []
    });

    renderHook(
      () => useSearch('Batman', MEDIA_TYPES.MOVIE),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(tmdb.searchMovies).toHaveBeenCalled();
    });
  });

  test('llama searchSeries cuando type es SERIES', async () => {
    tmdb.searchSeries.mockResolvedValue({
      results: []
    });

    renderHook(
      () => useSearch('Breaking Bad', MEDIA_TYPES.SERIES),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(tmdb.searchSeries).toHaveBeenCalled();
    });
  });

  test('llama searchAnime cuando type es ANIME', async () => {
    jikan.searchAnime.mockResolvedValue({
      data: []
    });

    renderHook(
      () => useSearch('Naruto', MEDIA_TYPES.ANIME),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(jikan.searchAnime).toHaveBeenCalled();
    });
  });

  test('llama searchBooks cuando type es BOOK', async () => {
    openLibrary.searchBooks.mockResolvedValue({
      items: []
    });

    renderHook(
      () => useSearch('Harry Potter', MEDIA_TYPES.BOOK),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(openLibrary.searchBooks).toHaveBeenCalled();
    });
  });

  test('llama searchGames cuando type es GAME', async () => {
    rawg.searchGames.mockResolvedValue({
      results: []
    });

    renderHook(
      () => useSearch('Zelda', MEDIA_TYPES.GAME),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(rawg.searchGames).toHaveBeenCalled();
    });
  });

  test('llama searchMusicReleaseGroups cuando type es MUSIC', async () => {
    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
      'release-groups': []
    });

    renderHook(
      () => useSearch('Halo', MEDIA_TYPES.MUSIC),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(
        musicbrainz.searchMusicReleaseGroups
      ).toHaveBeenCalled();
    });
  });

  test('ejecuta buscarProductosNoLimits cuando type es all', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });
    jikan.searchAnime.mockResolvedValue({ data: [] });
    openLibrary.searchBooks.mockResolvedValue({ items: [] });
    rawg.searchGames.mockResolvedValue({ results: [] });
    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
      'release-groups': []
    });

    productos.buscarProductosNoLimits.mockResolvedValue([]);

    renderHook(
      () => useSearch('Marvel'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(
        productos.buscarProductosNoLimits
      ).toHaveBeenCalled();
    });
  });

  test('retorna resultados vacíos si todas las APIs fallan', async () => {
    tmdb.searchMovies.mockRejectedValue(new Error());

    const { result } = renderHook(
      () => useSearch('Batman', MEDIA_TYPES.MOVIE),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });

  test('normaliza query eliminando acentos', async () => {
    tmdb.searchMovies.mockResolvedValue({
      results: []
    });

    renderHook(
      () => useSearch('Pokémon', MEDIA_TYPES.MOVIE),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(tmdb.searchMovies).toHaveBeenCalledWith(
        'Pokemon'
      );
    });
  });

  test('limita resultados de películas a 18 elementos', async () => {
    tmdb.searchMovies.mockResolvedValue({
        results: Array.from({ length: 25 }, (_, i) => ({
        id: i,
        poster_path: '/poster.jpg',
        vote_count: 100,
        title: `Movie ${i}`,
        })),
    });

    const { result } = renderHook(
        () => useSearch('Batman', MEDIA_TYPES.MOVIE),
        { wrapper: createWrapper() }
    );

    await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data.length).toBeLessThanOrEqual(18);
  });

  test('asigna poster fallback a películas sin poster', async () => {
    tmdb.searchMovies.mockResolvedValue({
        results: [
        {
            id: 1,
            poster_path: null,
            vote_count: 100,
            title: 'Batman',
        },
        ],
    });

    const { result } = renderHook(
        () => useSearch('Batman', MEDIA_TYPES.MOVIE),
        { wrapper: createWrapper() }
    );

    await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data[0].poster)
        .toContain('movie-tvshow-fallback');
  });

  test('asigna poster fallback a series sin poster', async () => {
    tmdb.searchSeries.mockResolvedValue({
        results: [
        {
            id: 1,
            poster_path: null,
            vote_count: 100,
            name: 'Breaking Bad',
        },
        ],
    });

    const { result } = renderHook(
        () => useSearch('Breaking', MEDIA_TYPES.SERIES),
        { wrapper: createWrapper() }
    );

    await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data[0].poster)
        .toContain('movie-tvshow-fallback');
  });

  test('filtra juegos con rating inválido', async () => {
    rawg.searchGames.mockResolvedValue({
        results: [
        {
            id: 1,
            rating: '—',
            background_image: '/img.jpg',
        },
        ],
    });

    const { result } = renderHook(
        () => useSearch('Zelda', MEDIA_TYPES.GAME),
        { wrapper: createWrapper() }
    );

    await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  test('filtra juegos con rating menor a 7', async () => {
    rawg.searchGames.mockResolvedValue({
        results: [
        {
            id: 1,
            rating: 5,
            background_image: '/img.jpg',
        },
        ],
    });

    const { result } = renderHook(
        () => useSearch('Mario', MEDIA_TYPES.GAME),
        { wrapper: createWrapper() }
    );

    await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  test('permite continuar cuando una API falla en búsqueda global', async () => {
    tmdb.searchMovies.mockRejectedValue(new Error('error'));

    tmdb.searchSeries.mockResolvedValue({
        results: [],
    });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    rawg.searchGames.mockResolvedValue({
        results: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    productos.buscarProductosNoLimits.mockResolvedValue([]);

    const { result } = renderHook(
        () => useSearch('Marvel'),
        { wrapper: createWrapper() }
    );

    await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
    });
  });

  test('maneja respuesta undefined de libros', async () => {
    openLibrary.searchBooks.mockResolvedValue({});

    const { result } = renderHook(
        () => useSearch('Harry Potter', MEDIA_TYPES.BOOK),
        { wrapper: createWrapper() }
    );

    await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  test('maneja response undefined de música', async () => {
    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({});

    const { result } = renderHook(
        () => useSearch('Halo', MEDIA_TYPES.MUSIC),
        { wrapper: createWrapper() }
    );

    await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  test('maneja response undefined de juegos', async () => {
    rawg.searchGames.mockResolvedValue({});

    const { result } = renderHook(
        () => useSearch('Zelda', MEDIA_TYPES.GAME),
        { wrapper: createWrapper() }
    );

    await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  test('maneja response undefined de películas', async () => {
    tmdb.searchMovies.mockResolvedValue({});

    const { result } = renderHook(
        () => useSearch('Batman', MEDIA_TYPES.MOVIE),
        { wrapper: createWrapper() }
    );

    await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  test('useSagaSearch no ejecuta query sin sagaName', () => {
    const { result } = renderHook(
        () => useSagaSearch(''),
        { wrapper: createWrapper() }
    );

    expect(result.current.grouped).toEqual({});
  });

  test('useSagaSearch retorna estructura vacía cuando todas las APIs responden vacío', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    rawg.searchGamesForSaga.mockResolvedValue({
        results: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped).toHaveProperty('movies');
    expect(result.current.grouped).toHaveProperty('series');
    expect(result.current.grouped).toHaveProperty('anime');
    expect(result.current.grouped).toHaveProperty('books');
    expect(result.current.grouped).toHaveProperty('games');
    expect(result.current.grouped).toHaveProperty('music');
  });

  test('useSagaSearch continúa funcionando cuando una API falla', async () => {
    tmdb.searchMovies.mockRejectedValue(new Error('error'));

    tmdb.searchSeries.mockResolvedValue({
        results: [],
    });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    rawg.searchGamesForSaga.mockResolvedValue({
        results: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped).toBeDefined();
  });

  test('useSagaSearch ejecuta búsqueda adicional de Hogwarts para Harry Potter', async () => {
    rawg.searchGamesForSaga.mockResolvedValue({
        results: [],
    });

    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    renderHook(
        () => useSagaSearch('Harry Potter'),
        { wrapper: createWrapper() }
    );

    await waitFor(() => {
        expect(rawg.searchGamesForSaga).toHaveBeenCalled();
    });

    expect(rawg.searchGamesForSaga)
        .toHaveBeenCalledWith('Harry Potter');
  });

  test('useSagaSearch usa searchAlias cuando existe', async () => {
    tmdb.searchMovies.mockResolvedValue({
        results: [],
    });

    tmdb.searchSeries.mockResolvedValue({
        results: [],
    });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    rawg.searchGamesForSaga.mockResolvedValue({
        results: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    renderHook(
        () =>
        useSagaSearch(
            'Spider-Man',
            'Spiderman',
            'Spider-Man'
        ),
        { wrapper: createWrapper() }
    );

    await waitFor(() => {
        expect(tmdb.searchMovies).toHaveBeenCalled();
    });
  });

  test('useSagaSearch filtra música por título', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });
    jikan.searchAnime.mockResolvedValue({ data: [] });
    openLibrary.searchBooks.mockResolvedValue({ items: [] });
    rawg.searchGamesForSaga.mockResolvedValue({ results: [] });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [
        { id: '1', title: 'Spider-Man OST' },
        { id: '2', title: 'Pokemon OST' },
        ],
    });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.grouped.music).toHaveLength(1);
  });

  test('useSagaSearch elimina juegos sin poster', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });
    jikan.searchAnime.mockResolvedValue({ data: [] });
    openLibrary.searchBooks.mockResolvedValue({ items: [] });

    rawg.searchGamesForSaga
        .mockResolvedValueOnce({
        results: [
            {
            id: 1,
            name: 'Spider-Man',
            background_image: null,
            rating: 8,
            },
        ],
        })
        .mockResolvedValueOnce({
        results: [],
        });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.grouped.games).toEqual([]);
  });

  test('useSearch asigna poster fallback a anime sin poster', async () => {
    jikan.searchAnime.mockResolvedValue({
        data: [
        {
            mal_id: 1,
            title: 'Naruto',
            images: {},
        },
        ],
    });

    const { result } = renderHook(
        () => useSearch('Naruto', MEDIA_TYPES.ANIME),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].poster).toContain('fallback');
  });
  test('useSearch filtra libros que no coinciden con la búsqueda', async () => {
    openLibrary.searchBooks.mockResolvedValue({
        items: [
        {
            id: '1',
            volumeInfo: {
            title: 'El Señor de los Anillos',
            },
        },
        ],
    });

    const { result } = renderHook(
        () => useSearch('Harry Potter', MEDIA_TYPES.BOOK),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toEqual([]);
  });

  test('useSearch acepta búsqueda de una sola palabra', async () => {
    rawg.searchGames.mockResolvedValue({
        results: [
        {
            id: 1,
            name: 'Zelda',
            background_image: '/img.jpg',
            rating: 8,
        },
        ],
    });

    const { result } = renderHook(
        () => useSearch('Zelda', MEDIA_TYPES.GAME),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toHaveLength(1);
  });

  test('useSagaSearch retorna juegos vacíos cuando RAWG falla', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });
    jikan.searchAnime.mockResolvedValue({ data: [] });
    openLibrary.searchBooks.mockResolvedValue({ items: [] });

    rawg.searchGamesForSaga.mockRejectedValue(new Error());

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.games).toEqual([]);
  });

  test('useSagaSearch retorna música vacía cuando MusicBrainz falla', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });
    jikan.searchAnime.mockResolvedValue({ data: [] });
    openLibrary.searchBooks.mockResolvedValue({ items: [] });
    rawg.searchGamesForSaga.mockResolvedValue({ results: [] });

    musicbrainz.searchMusicReleaseGroups.mockRejectedValue(new Error());

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.music).toEqual([]);
  });

  test('useSagaSearch encuentra películas usando displayName', async () => {
    tmdb.searchMovies
        .mockResolvedValueOnce({
        results: [
            {
            id: 1,
            title: 'Spider Man',
            poster_path: '/a.jpg',
            vote_count: 200,
            },
        ],
        })
        .mockResolvedValueOnce({ results: [] });

    tmdb.searchSeries.mockResolvedValue({ results: [] });

    jikan.searchAnime.mockResolvedValue({ data: [] });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    rawg.searchGamesForSaga.mockResolvedValue({
        results: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    const { result } = renderHook(
        () =>
        useSagaSearch(
            'spiderman',
            'spiderman',
            'Spider Man'
        ),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.movies).toBeDefined();
  });

  test('useSagaSearch elimina películas con menos de 50 votos', async () => {
    tmdb.searchMovies
        .mockResolvedValueOnce({
        results: [
            {
            id: 1,
            title: 'Spider-Man',
            poster_path: '/img.jpg',
            vote_count: 30,
            },
        ],
        })
        .mockResolvedValueOnce({
        results: [],
        });

    tmdb.searchSeries.mockResolvedValue({
        results: [],
    });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    rawg.searchGamesForSaga.mockResolvedValue({
        results: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.movies).toEqual([]);
  });

  test('useSagaSearch excluye juegos por título prohibido', async () => {
    rawg.searchGamesForSaga.mockResolvedValue({
        results: [
        {
            id: 1,
            name: 'Amazing Spider-Man 2 PC Port',
            background_image: '/img.jpg',
            rating: 8,
        },
        ],
    });

    tmdb.searchMovies.mockResolvedValue({
        results: [],
    });

    tmdb.searchSeries.mockResolvedValue({
        results: [],
    });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.games).toEqual([]);
  });

  test('useSagaSearch excluye juegos anteriores a 1970', async () => {
    rawg.searchGamesForSaga.mockResolvedValue({
        results: [
        {
            id: 1,
            name: 'Spider-Man',
            background_image: '/img.jpg',
            rating: 8,
            released: '1965-01-01',
        },
        ],
    });

    tmdb.searchMovies.mockResolvedValue({
        results: [],
    });

    tmdb.searchSeries.mockResolvedValue({
        results: [],
    });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.games).toEqual([]);
  });

  test('useSagaSearch excluye juegos con rating desconocido', async () => {
    rawg.searchGamesForSaga.mockResolvedValue({
        results: [
        {
            id: 1,
            name: 'Spider-Man',
            background_image: '/img.jpg',
            rating: null,
        },
        ],
    });

    tmdb.searchMovies.mockResolvedValue({
        results: [],
    });

    tmdb.searchSeries.mockResolvedValue({
        results: [],
    });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.games).toEqual([]);
  });

  test('useSagaSearch encuentra series usando displayName', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });

    tmdb.searchSeries
        .mockResolvedValueOnce({
        results: [
            {
            id: 1,
            name: 'The Wizarding World',
            poster_path: '/poster.jpg',
            backdrop_path: '/backdrop.jpg',
            vote_average: 8,
            vote_count: 100,
            first_air_date: '2023-01-01',
            overview: '',
            },
        ],
        })
        .mockResolvedValueOnce({
        results: [],
        });

    jikan.searchAnime.mockResolvedValue({ data: [] });
    openLibrary.searchBooks.mockResolvedValue({ items: [] });
    rawg.searchGamesForSaga.mockResolvedValue({ results: [] });
    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    const { result } = renderHook(
        () => useSagaSearch('Harry Potter', undefined, 'Wizarding'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.series).toHaveLength(1);
  });

  test('useSagaSearch encuentra libro por coincidencia de todas las palabras', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [
        {
            id: '1',
            volumeInfo: {
            title: 'Harry Potter y la piedra filosofal',
            },
        },
        ],
    });

    rawg.searchGamesForSaga.mockResolvedValue({
        results: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    const { result } = renderHook(
        () => useSagaSearch('Harry Potter'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.books).toHaveLength(1);
  });

  test('useSagaSearch no realiza búsqueda Hogwarts cuando la saga no es Harry Potter', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    rawg.searchGamesForSaga.mockResolvedValue({
        results: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(rawg.searchGamesForSaga).toHaveBeenCalledTimes(1)
    );

    expect(rawg.searchGamesForSaga)
        .toHaveBeenCalledWith('Spider-Man');
  });

  test('useSagaSearch elimina juegos duplicados provenientes de ambas búsquedas', async () => {
    tmdb.searchMovies.mockResolvedValue({
        results: [],
    });

    tmdb.searchSeries.mockResolvedValue({
        results: [],
    });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    rawg.searchGamesForSaga
        .mockResolvedValueOnce({
        results: [
            {
            id: 1,
            name: 'Hogwarts Legacy',
            background_image: '/game.jpg',
            released: '2023-02-10',
            rating: 4.5,
            },
        ],
        })
        .mockResolvedValueOnce({
        results: [
            {
            id: 1,
            name: 'Hogwarts Legacy',
            background_image: '/game.jpg',
            released: '2023-02-10',
            rating: 4.5,
            },
        ],
        });

    const { result } = renderHook(
        () => useSagaSearch('Harry Potter'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.games).toHaveLength(1);
  });

  test('useSagaSearch encuentra música usando searchAlias', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });

    jikan.searchAnime.mockResolvedValue({
        data: [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [],
    });

    rawg.searchGamesForSaga.mockResolvedValue({
        results: [],
    });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [
        {
            id: '1',
            title: 'Spider-Man Original Soundtrack',
        },
        ],
    });

    const { result } = renderHook(
        () =>
        useSagaSearch(
            'Marvel',
            'Spider-Man',
            'Spider-Man'
        ),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.music).toHaveLength(1);
  });

  test('useSagaSearch encuentra libro usando coincidencia de todas las palabras', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });
    jikan.searchAnime.mockResolvedValue({ data: [] });
    rawg.searchGamesForSaga.mockResolvedValue({ results: [] });
    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    openLibrary.searchBooks.mockResolvedValue({
        items: [
        {
            id: '1',
            volumeInfo: {
            title: 'Ultimate Guide Marvel Spider',
            publishedDate: '2021',
            imageLinks: {
                thumbnail: 'img.jpg',
            },
            },
        },
        ],
    });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man', 'Marvel Spider'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.books).toHaveLength(1);
  });
 
  test('useSagaSearch encuentra música usando searchAlias', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });
    jikan.searchAnime.mockResolvedValue({ data: [] });
    openLibrary.searchBooks.mockResolvedValue({ items: [] });
    rawg.searchGamesForSaga.mockResolvedValue({ results: [] });

    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [
        {
            id: '1',
            title: 'Marvel Spider Soundtrack',
        },
        ],
    });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man', 'Marvel Spider'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.music).toHaveLength(1);
  });

  test('useSagaSearch excluye anime por id prohibido', async () => {
    tmdb.searchMovies.mockResolvedValue({ results: [] });
    tmdb.searchSeries.mockResolvedValue({ results: [] });
    openLibrary.searchBooks.mockResolvedValue({ items: [] });
    rawg.searchGamesForSaga.mockResolvedValue({ results: [] });
    musicbrainz.searchMusicReleaseGroups.mockResolvedValue({
        'release-groups': [],
    });

    jikan.searchAnime.mockResolvedValue({
        data: [
        {
            mal_id: 49739, // será normalizado al id excluido
            title: 'Spider-Man',
            images: {
            jpg: {
                image_url: 'img.jpg',
            },
            },
        },
        ],
    });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.isLoading).toBe(false)
    );

    expect(result.current.grouped.anime).toEqual([]);
  });

  test('useSagaSearch ordena juegos por rating descendente', async () => {
    rawg.searchGamesForSaga
        .mockResolvedValueOnce({
        results: [
            {
            id: 1,
            name: 'Spider-Man',
            rating: 3.5,
            released: '2023-01-01',
            background_image: 'poster1.jpg',
            },
            {
            id: 2,
            name: 'Spider-Man 2',
            rating: 4.5,
            released: '2024-01-01',
            background_image: 'poster2.jpg',
            },
        ],
        })
        .mockResolvedValueOnce({
        results: [],
        });

    const { result } = renderHook(
        () => useSagaSearch('Spider-Man'),
        { wrapper: createWrapper() }
    );

    await waitFor(() =>
        expect(result.current.grouped.games).toHaveLength(2)
    );

    expect(result.current.grouped.games[0].title).toBe('Spider-Man 2');
    expect(result.current.grouped.games[1].title).toBe('Spider-Man');
  });
  
});