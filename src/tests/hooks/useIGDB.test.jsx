import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useTopGames,
  useGameDetail,
} from '@/hooks/useIGDB';

vi.mock('@/services/igdb', () => ({
  fetchTopGames: vi.fn(),
  fetchGameDetail: vi.fn(),
}));

vi.mock('@/utils/normalizeMedia', () => ({
  normalizeIgdbGame: vi.fn((game) => ({
    ...game,
    normalized: true,
  })),
}));

import {
  fetchTopGames,
  fetchGameDetail,
} from '@/services/igdb';

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

describe('useIGDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('useTopGames obtiene juegos correctamente', async () => {
    fetchTopGames.mockResolvedValue([
      { id: 1 },
      { id: 2 },
    ]);

    const { result } = renderHook(
      () => useTopGames(),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(fetchTopGames).toHaveBeenCalled();

    expect(result.current.data).toHaveLength(2);
  });

  test('useTopGames maneja lista vacía', async () => {
    fetchTopGames.mockResolvedValue([]);

    const { result } = renderHook(
      () => useTopGames(),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toEqual([]);
  });

  test('useTopGames maneja resultado null', async () => {
    fetchTopGames.mockResolvedValue(null);

    const { result } = renderHook(
      () => useTopGames(),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toEqual([]);
  });

  test('useTopGames maneja error', async () => {
    fetchTopGames.mockRejectedValue(
      new Error('error')
    );

    const { result } = renderHook(
      () => useTopGames(),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isError).toBe(true)
    );
  });

  test('useGameDetail obtiene detalle correctamente', async () => {
    fetchGameDetail.mockResolvedValue({
      id: 99,
    });

    const { result } = renderHook(
      () => useGameDetail(99),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(fetchGameDetail).toHaveBeenCalledWith(99);

    expect(result.current.data.normalized).toBe(true);
  });

  test('useGameDetail retorna null cuando API devuelve null', async () => {
    fetchGameDetail.mockResolvedValue(null);

    const { result } = renderHook(
      () => useGameDetail(99),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toBeNull();
  });

  test('useGameDetail no ejecuta query sin id', () => {
    const { result } = renderHook(
      () => useGameDetail(),
      {
        wrapper: createWrapper(),
      }
    );

    expect(fetchGameDetail).not.toHaveBeenCalled();

    expect(result.current.fetchStatus).toBe('idle');
  });

  test('useGameDetail no ejecuta query con string vacío', () => {
    const { result } = renderHook(
      () => useGameDetail(''),
      {
        wrapper: createWrapper(),
      }
    );

    expect(fetchGameDetail).not.toHaveBeenCalled();

    expect(result.current.fetchStatus).toBe('idle');
  });

  test('useGameDetail maneja error', async () => {
    fetchGameDetail.mockRejectedValue(
      new Error('error')
    );

    const { result } = renderHook(
      () => useGameDetail(999),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isError).toBe(true)
    );
  });
});