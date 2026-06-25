import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useBooksBySubject,
  useBookDetail,
} from '@/hooks/useOpenLibrary';

vi.mock('@/services/openLibrary', () => ({
  fetchBooksBySubject: vi.fn(),
  fetchBookDetail: vi.fn(),
}));

vi.mock('@/utils/normalizeMedia', () => ({
  normalizeGoogleBook: vi.fn((book) => ({
    ...book,
    normalized: true,
  })),
}));

import {
  fetchBooksBySubject,
  fetchBookDetail,
} from '@/services/openLibrary';

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

describe('useOpenLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('useBooksBySubject obtiene libros correctamente', async () => {
    fetchBooksBySubject.mockResolvedValue({
      items: [
        { id: 1 },
        { id: 2 },
      ],
    });

    const { result } = renderHook(
      () => useBooksBySubject('fantasy'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(fetchBooksBySubject).toHaveBeenCalledWith(
      'fantasy'
    );

    expect(result.current.data).toHaveLength(2);
  });

  test('useBooksBySubject usa science_fiction por defecto', async () => {
    fetchBooksBySubject.mockResolvedValue({
      items: [],
    });

    renderHook(
      () => useBooksBySubject(),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(fetchBooksBySubject)
        .toHaveBeenCalledWith('science_fiction');
    });
  });

  test('useBooksBySubject maneja items undefined', async () => {
    fetchBooksBySubject.mockResolvedValue({});

    const { result } = renderHook(
      () => useBooksBySubject(),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toEqual([]);
  });

  test('useBooksBySubject maneja error', async () => {
    fetchBooksBySubject.mockRejectedValue(
      new Error('error')
    );

    const { result } = renderHook(
      () => useBooksBySubject(),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isError).toBe(true)
    );
  });

  test('useBookDetail obtiene detalle correctamente', async () => {
    fetchBookDetail.mockResolvedValue({
      id: 'book-1',
    });

    const { result } = renderHook(
      () => useBookDetail('OL123'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(fetchBookDetail).toHaveBeenCalledWith(
      'OL123'
    );

    expect(result.current.data.normalized).toBe(true);
  });

  test('useBookDetail no ejecuta query sin workKey', () => {
    const { result } = renderHook(
      () => useBookDetail(),
      {
        wrapper: createWrapper(),
      }
    );

    expect(fetchBookDetail).not.toHaveBeenCalled();

    expect(result.current.fetchStatus).toBe('idle');
  });

  test('useBookDetail no ejecuta query con string vacío', () => {
    const { result } = renderHook(
      () => useBookDetail(''),
      {
        wrapper: createWrapper(),
      }
    );

    expect(fetchBookDetail).not.toHaveBeenCalled();

    expect(result.current.fetchStatus).toBe('idle');
  });

  test('useBookDetail maneja error', async () => {
    fetchBookDetail.mockRejectedValue(
      new Error('error')
    );

    const { result } = renderHook(
      () => useBookDetail('OL999'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.isError).toBe(true)
    );
  });
});