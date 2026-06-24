import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useTopAnime,
  useSeasonAnime,
  useAnimeDetail,
} from '@/hooks/useJikan';

vi.mock('@/services/jikan', () => ({
  fetchTopAnime: vi.fn(),
  fetchSeasonNowAnime: vi.fn(),
  fetchAnimeDetail: vi.fn(),
}));

vi.mock('@/utils/normalizeMedia', () => ({
  normalizeJikanAnime: vi.fn((anime) => ({
    ...anime,
    normalized: true,
  })),
}));

import {
  fetchTopAnime,
  fetchSeasonNowAnime,
  fetchAnimeDetail,
} from '@/services/jikan';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useJikan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('useTopAnime obtiene animes correctamente', async () => {
    fetchTopAnime.mockResolvedValue({
      data: [
        { mal_id: 1 },
        { mal_id: 2 },
      ],
    });

    const { result } = renderHook(
      () => useTopAnime(),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(fetchTopAnime).toHaveBeenCalled();
    expect(result.current.data).toHaveLength(2);
  });

  test('useTopAnime falla cuando Jikan no devuelve datos', async () => {
    fetchTopAnime.mockResolvedValue({
        data: [],
    });

    const { result } = renderHook(
        () => useTopAnime(),
        {
        wrapper: createWrapper(),
        }
    );

    await waitFor(() => {
        expect(result.current.error).toBeDefined();
    });
  });

  test('useTopAnime falla cuando response es null', async () => {
    fetchTopAnime.mockResolvedValue(null);

    const { result } = renderHook(
        () => useTopAnime(),
        {
        wrapper: createWrapper(),
        }
    );

    await waitFor(() => {
        expect(result.current.error).toBeDefined();
    });
  });

  test('useTopAnime maneja error del servicio', async () => {
    fetchTopAnime.mockRejectedValue(
        new Error('error')
    );

    const { result } = renderHook(
        () => useTopAnime(),
        {
        wrapper: createWrapper(),
        }
    );

    await waitFor(() => {
        expect(result.current.error).toBeDefined();
    });
  });

  test('useSeasonAnime obtiene temporada actual', async () => {
    fetchSeasonNowAnime.mockResolvedValue({
      data: [
        { mal_id: 10 },
        { mal_id: 20 },
      ],
    });

    const { result } = renderHook(
      () => useSeasonAnime(),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(fetchSeasonNowAnime).toHaveBeenCalled();
    expect(result.current.data).toHaveLength(2);
  });

  test('useSeasonAnime maneja lista vacía', async () => {
    fetchSeasonNowAnime.mockResolvedValue({
      data: [],
    });

    const { result } = renderHook(
      () => useSeasonAnime(),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toEqual([]);
  });

  test('useSeasonAnime maneja error', async () => {
    fetchSeasonNowAnime.mockRejectedValue(
      new Error('error')
    );

    const { result } = renderHook(
      () => useSeasonAnime(),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isError).toBe(true)
    );
  });

  test('useAnimeDetail obtiene detalle correctamente', async () => {
    fetchAnimeDetail.mockResolvedValue({
      data: {
        mal_id: 5114,
      },
    });

    const { result } = renderHook(
      () => useAnimeDetail(5114),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(fetchAnimeDetail).toHaveBeenCalledWith(
      5114
    );

    expect(result.current.data.normalized).toBe(true);
  });

  test('useAnimeDetail no ejecuta query sin id', () => {
    const { result } = renderHook(
      () => useAnimeDetail(),
      {
        wrapper: createWrapper(),
      }
    );

    expect(fetchAnimeDetail).not.toHaveBeenCalled();

    expect(result.current.fetchStatus).toBe(
      'idle'
    );
  });

  test('useAnimeDetail no ejecuta query con string vacío', () => {
    const { result } = renderHook(
      () => useAnimeDetail(''),
      {
        wrapper: createWrapper(),
      }
    );

    expect(fetchAnimeDetail).not.toHaveBeenCalled();

    expect(result.current.fetchStatus).toBe(
      'idle'
    );
  });

  test('useAnimeDetail maneja error', async () => {
    fetchAnimeDetail.mockRejectedValue(
      new Error('error')
    );

    const { result } = renderHook(
      () => useAnimeDetail(9999),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isError).toBe(true)
    );
  });
});