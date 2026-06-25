import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useTopGames,
  useGameDetail,
} from '@/hooks/useRAWG';

vi.mock('@/services/rawg', () => ({
  fetchTopGames: vi.fn(),
  fetchGameDetail: vi.fn(),
  fetchGameStores: vi.fn(),
  rawgEnabled: vi.fn(),
}));

vi.mock('@/utils/normalizeMedia', () => ({
  normalizeRawgGame: vi.fn((game) => ({
    ...game,
    normalized: true,
  })),
}));

import {
  fetchTopGames,
  fetchGameDetail,
  fetchGameStores,
  rawgEnabled,
} from '@/services/rawg';

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

describe('useRAWG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('useTopGames obtiene juegos correctamente', async () => {
    rawgEnabled.mockReturnValue(true);

    fetchTopGames.mockResolvedValue({
      results: [
        { id: 1 },
        { id: 2 },
      ],
    });

    const { result } = renderHook(
      () => useTopGames(),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(fetchTopGames).toHaveBeenCalled();
    expect(result.current.data).toHaveLength(2);
  });

  test('useTopGames devuelve array vacío cuando RAWG está deshabilitado', async () => {
    rawgEnabled.mockReturnValue(false);

    const { result } = renderHook(
      () => useTopGames(),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(fetchTopGames).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([]);
  });

  test('useTopGames maneja lista vacía', async () => {
    rawgEnabled.mockReturnValue(true);

    fetchTopGames.mockResolvedValue({
      results: [],
    });

    const { result } = renderHook(
      () => useTopGames(),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toEqual([]);
  });

  test('useTopGames maneja error', async () => {
    rawgEnabled.mockReturnValue(true);

    fetchTopGames.mockRejectedValue(
      new Error('error')
    );

    const { result } = renderHook(
      () => useTopGames(),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isError).toBe(true)
    );
  });

  test('useGameDetail obtiene detalle correctamente', async () => {
    rawgEnabled.mockReturnValue(true);

    fetchGameDetail.mockResolvedValue({
      id: 10,
    });

    fetchGameStores.mockResolvedValue({
      results: [
        {
          id: 1,
          url: 'https://steam.com/game',
        },
      ],
    });

    const { result } = renderHook(
      () => useGameDetail(10),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(fetchGameDetail).toHaveBeenCalledWith(10);
    expect(fetchGameStores).toHaveBeenCalledWith(10);

    expect(result.current.data.normalized).toBe(true);
  });

  test('useGameDetail retorna null cuando no existe detalle', async () => {
    rawgEnabled.mockReturnValue(true);

    fetchGameDetail.mockResolvedValue(null);

    fetchGameStores.mockResolvedValue({
      results: [],
    });

    const { result } = renderHook(
      () => useGameDetail(10),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toBeNull();
  });

  test('useGameDetail sigue funcionando si fetchGameStores falla', async () => {
    rawgEnabled.mockReturnValue(true);

    fetchGameDetail.mockResolvedValue({
      id: 10,
    });

    fetchGameStores.mockRejectedValue(
      new Error('stores error')
    );

    const { result } = renderHook(
      () => useGameDetail(10),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data.normalized).toBe(true);
  });

  test('useGameDetail no ejecuta query sin id', () => {
    rawgEnabled.mockReturnValue(true);

    const { result } = renderHook(
      () => useGameDetail(),
      { wrapper: createWrapper() }
    );

    expect(fetchGameDetail).not.toHaveBeenCalled();

    expect(result.current.fetchStatus)
      .toBe('idle');
  });

  test('useGameDetail no ejecuta query cuando RAWG está deshabilitado', () => {
    rawgEnabled.mockReturnValue(false);

    const { result } = renderHook(
      () => useGameDetail(10),
      { wrapper: createWrapper() }
    );

    expect(fetchGameDetail).not.toHaveBeenCalled();

    expect(result.current.fetchStatus)
      .toBe('idle');
  });

  test('useGameDetail maneja error en detalle', async () => {
    rawgEnabled.mockReturnValue(true);

    fetchGameDetail.mockRejectedValue(
      new Error('error')
    );

    fetchGameStores.mockResolvedValue({
      results: [],
    });

    const { result } = renderHook(
      () => useGameDetail(10),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isError).toBe(true)
    );
  });
});