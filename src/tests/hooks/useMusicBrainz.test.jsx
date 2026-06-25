import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useMusicSearch,
  useFranchiseSoundtracks,
  useMusicDetail,
} from '@/hooks/useMusicBrainz';

vi.mock('@/services/musicbrainz', () => ({
  searchMusicReleaseGroups: vi.fn(),
  searchSoundtrack: vi.fn(),
  getMusicReleaseGroupDetail: vi.fn(),
}));

vi.mock('@/utils/normalizeMedia', () => ({
  normalizeMusicBrainzRelease: vi.fn((item) => ({
    ...item,
    normalized: true,
  })),
}));

import {
  searchMusicReleaseGroups,
  searchSoundtrack,
  getMusicReleaseGroupDetail,
} from '@/services/musicbrainz';

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

describe('useMusicBrainz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('useMusicSearch obtiene resultados correctamente', async () => {
    searchMusicReleaseGroups.mockResolvedValue({
      'release-groups': [
        { id: '1' },
        { id: '2' },
      ],
    });

    const { result } = renderHook(
      () => useMusicSearch('zelda'),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(searchMusicReleaseGroups)
      .toHaveBeenCalledWith('zelda');

    expect(result.current.data).toHaveLength(2);
  });

  test('useMusicSearch devuelve array vacío', async () => {
    searchMusicReleaseGroups.mockResolvedValue({
      'release-groups': [],
    });

    const { result } = renderHook(
      () => useMusicSearch('zelda'),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toEqual([]);
  });

  test('useMusicSearch limita resultados a 18', async () => {
    searchMusicReleaseGroups.mockResolvedValue({
      'release-groups': Array.from(
        { length: 25 },
        (_, i) => ({ id: i })
      ),
    });

    const { result } = renderHook(
      () => useMusicSearch('zelda'),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toHaveLength(18);
  });

  test('useMusicSearch no ejecuta query sin texto', () => {
    const { result } = renderHook(
      () => useMusicSearch(''),
      { wrapper: createWrapper() }
    );

    expect(searchMusicReleaseGroups)
      .not.toHaveBeenCalled();

    expect(result.current.fetchStatus)
      .toBe('idle');
  });

  test('useMusicSearch no ejecuta query con espacios', () => {
    const { result } = renderHook(
      () => useMusicSearch('   '),
      { wrapper: createWrapper() }
    );

    expect(searchMusicReleaseGroups)
      .not.toHaveBeenCalled();

    expect(result.current.fetchStatus)
      .toBe('idle');
  });

  test('useMusicSearch maneja error', async () => {
    searchMusicReleaseGroups.mockRejectedValue(
      new Error('error')
    );

    const { result } = renderHook(
      () => useMusicSearch('zelda'),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isError).toBe(true)
    );
  });

  test('useFranchiseSoundtracks obtiene resultados', async () => {
    searchSoundtrack.mockResolvedValue({
      'release-groups': [
        { id: '1' },
      ],
    });

    const { result } = renderHook(
      () => useFranchiseSoundtracks('Mario'),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(searchSoundtrack)
      .toHaveBeenCalledWith('Mario');

    expect(result.current.data).toHaveLength(1);
  });

  test('useFranchiseSoundtracks devuelve array vacío', async () => {
    searchSoundtrack.mockResolvedValue({
      'release-groups': [],
    });

    const { result } = renderHook(
      () => useFranchiseSoundtracks('Mario'),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(result.current.data).toEqual([]);
  });

  test('useFranchiseSoundtracks no ejecuta query sin franquicia', () => {
    const { result } = renderHook(
      () => useFranchiseSoundtracks(''),
      { wrapper: createWrapper() }
    );

    expect(searchSoundtrack)
      .not.toHaveBeenCalled();

    expect(result.current.fetchStatus)
      .toBe('idle');
  });

  test('useFranchiseSoundtracks maneja error', async () => {
    searchSoundtrack.mockRejectedValue(
      new Error('error')
    );

    const { result } = renderHook(
      () => useFranchiseSoundtracks('Mario'),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isError).toBe(true)
    );
  });

  test('useMusicDetail obtiene detalle correctamente', async () => {
    getMusicReleaseGroupDetail.mockResolvedValue({
      id: 'abc123',
    });

    const { result } = renderHook(
      () => useMusicDetail('abc123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isSuccess).toBe(true)
    );

    expect(getMusicReleaseGroupDetail)
      .toHaveBeenCalledWith('abc123');

    expect(result.current.data.normalized)
      .toBe(true);
  });

  test('useMusicDetail no ejecuta query sin id', () => {
    const { result } = renderHook(
      () => useMusicDetail(null),
      { wrapper: createWrapper() }
    );

    expect(getMusicReleaseGroupDetail)
      .not.toHaveBeenCalled();

    expect(result.current.fetchStatus)
      .toBe('idle');
  });

  test('useMusicDetail maneja error', async () => {
    getMusicReleaseGroupDetail.mockRejectedValue(
      new Error('error')
    );

    const { result } = renderHook(
      () => useMusicDetail('abc123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.isError).toBe(true)
    );
  });

  test('useMusicSearch no ejecuta query con null', () => {
    const { result } = renderHook(
        () => useMusicSearch(null),
        { wrapper: createWrapper() }
    );

    expect(searchMusicReleaseGroups).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
  });

  test('useFranchiseSoundtracks no ejecuta query con null', () => {
    const { result } = renderHook(
        () => useFranchiseSoundtracks(null),
        { wrapper: createWrapper() }
    );

    expect(searchSoundtrack).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
  });
});