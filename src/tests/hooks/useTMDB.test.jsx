import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useQuery } from '@tanstack/react-query';

import {
  useTrendingMovies,
  useTrendingSeries,
  useTopRatedMovies,
  useMovieDetail,
  useSeriesDetail,
} from '@/hooks/useTMDB';

import {
  fetchTrendingMovies,
  fetchTrendingSeries,
  fetchTopRatedMovies,
  fetchMovieDetail,
  fetchSeriesDetail,
} from '@/services/tmdb';

import {
  normalizeTmdbMovie,
  normalizeTmdbSeries,
} from '@/utils/normalizeMedia';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/services/tmdb', () => ({
  fetchTrendingMovies: vi.fn(),
  fetchTrendingSeries: vi.fn(),
  fetchTopRatedMovies: vi.fn(),
  fetchMovieDetail: vi.fn(),
  fetchSeriesDetail: vi.fn(),
}));

vi.mock('@/utils/normalizeMedia', () => ({
  normalizeTmdbMovie: vi.fn(),
  normalizeTmdbSeries: vi.fn(),
}));

describe('useTMDB hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  describe('useTrendingMovies', () => {
    it('debe llamar useQuery con la configuración correcta', () => {
      useTrendingMovies();

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['tmdb', 'trending', 'movies'],
          staleTime: 300000,
        })
      );
    });

    it('debe normalizar y limitar a 18 resultados', async () => {
      const movies = Array.from({ length: 20 }, (_, i) => ({ id: i }));

      fetchTrendingMovies.mockResolvedValue({
        results: movies,
      });

      normalizeTmdbMovie.mockImplementation(movie => ({
        ...movie,
        normalized: true,
      }));

      useTrendingMovies();

      const config = useQuery.mock.calls[0][0];

      const result = await config.queryFn();

      expect(fetchTrendingMovies).toHaveBeenCalled();

      expect(normalizeTmdbMovie).toHaveBeenCalledTimes(20);

      expect(result).toHaveLength(18);
    });
  });

  describe('useTrendingSeries', () => {
    it('debe llamar useQuery con la configuración correcta', () => {
      useTrendingSeries();

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['tmdb', 'trending', 'series'],
          staleTime: 300000,
        })
      );
    });

    it('debe normalizar y limitar a 18 resultados', async () => {
      const series = Array.from({ length: 20 }, (_, i) => ({ id: i }));

      fetchTrendingSeries.mockResolvedValue({
        results: series,
      });

      normalizeTmdbSeries.mockImplementation(item => ({
        ...item,
        normalized: true,
      }));

      useTrendingSeries();

      const config = useQuery.mock.calls[0][0];

      const result = await config.queryFn();

      expect(fetchTrendingSeries).toHaveBeenCalled();
      expect(normalizeTmdbSeries).toHaveBeenCalledTimes(20);
      expect(result).toHaveLength(18);
    });
  });

  describe('useTopRatedMovies', () => {
    it('debe llamar useQuery con la configuración correcta', () => {
      useTopRatedMovies();

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['tmdb', 'top-rated', 'movies'],
          staleTime: 300000,
        })
      );
    });

    it('debe normalizar todas las películas', async () => {
      const movies = [{ id: 1 }, { id: 2 }];

      fetchTopRatedMovies.mockResolvedValue({
        results: movies,
      });

      normalizeTmdbMovie.mockImplementation(movie => ({
        ...movie,
        normalized: true,
      }));

      useTopRatedMovies();

      const config = useQuery.mock.calls[0][0];

      const result = await config.queryFn();

      expect(fetchTopRatedMovies).toHaveBeenCalled();
      expect(normalizeTmdbMovie).toHaveBeenCalledTimes(2);

      expect(result).toEqual([
        { id: 1, normalized: true },
        { id: 2, normalized: true },
      ]);
    });
  });

  describe('useMovieDetail', () => {
    it('debe habilitar la query cuando existe id', () => {
      useMovieDetail(10);

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['tmdb', 'movie', 10],
          enabled: true,
          staleTime: 900000,
        })
      );
    });

    it('debe deshabilitar la query cuando no existe id', () => {
      useMovieDetail(null);

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('debe obtener y normalizar el detalle', async () => {
      fetchMovieDetail.mockResolvedValue({
        id: 99,
      });

      normalizeTmdbMovie.mockReturnValue({
        id: 99,
        normalized: true,
      });

      useMovieDetail(99);

      const config = useQuery.mock.calls[0][0];

      const result = await config.queryFn();

      expect(fetchMovieDetail).toHaveBeenCalledWith(99);

      expect(result).toEqual({
        id: 99,
        normalized: true,
      });
    });
  });

  describe('useSeriesDetail', () => {
    it('debe habilitar la query cuando existe id', () => {
      useSeriesDetail(15);

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['tmdb', 'series', 15],
          enabled: true,
          staleTime: 900000,
        })
      );
    });

    it('debe deshabilitar la query cuando no existe id', () => {
      useSeriesDetail(undefined);

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('debe obtener y normalizar la serie', async () => {
      fetchSeriesDetail.mockResolvedValue({
        id: 7,
      });

      normalizeTmdbSeries.mockReturnValue({
        id: 7,
        normalized: true,
      });

      useSeriesDetail(7);

      const config = useQuery.mock.calls[0][0];

      const result = await config.queryFn();

      expect(fetchSeriesDetail).toHaveBeenCalledWith(7);

      expect(result).toEqual({
        id: 7,
        normalized: true,
      });
    });
  });
});