import { describe, test, vi, beforeEach, assert } from 'vitest';

import {
  igdbImageUrl,
  fetchTopGames,
  searchGames,
  searchGameSeries,
  fetchGameDetail,
} from '@/services/igdb';

import { apiFetch } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiFetch: vi.fn(),
}));

describe('igdbImageUrl', () => {
  test('retorna null si no recibe url', () => {
    assert.isNull(igdbImageUrl());
    assert.isNull(igdbImageUrl(null));
  });

  test('convierte imagen t_thumb a t_cover_big por defecto', () => {
    const url =
      '//images.igdb.com/igdb/image/upload/t_thumb/co1wyy.jpg';

    assert.equal(
      igdbImageUrl(url),
      'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg'
    );
  });

  test('convierte imagen al tamaño indicado', () => {
    const url =
      '//images.igdb.com/igdb/image/upload/t_thumb/co1wyy.jpg';

    assert.equal(
      igdbImageUrl(url, 't_1080p'),
      'https://images.igdb.com/igdb/image/upload/t_1080p/co1wyy.jpg'
    );
  });

  test('mantiene url https aunque no contenga t_thumb', () => {
    const url = '//images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg';

    assert.equal(
      igdbImageUrl(url, 't_720p'),
      'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg'
    );
  });
});

describe('IGDB services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetchTopGames llama a apiFetch con endpoint /games', async () => {
    const gamesMock = [
      {
        id: 1,
        name: 'The Witcher 3',
      },
    ];

    apiFetch.mockResolvedValue(gamesMock);

    const result = await fetchTopGames();

    assert.deepEqual(result, gamesMock);

    assert.equal(apiFetch.mock.calls[0][0], '/api/igdb/games');
    assert.equal(apiFetch.mock.calls[0][1].method, 'POST');

    assert.deepEqual(apiFetch.mock.calls[0][1].headers, {
      'Content-Type': 'text/plain',
    });

    assert.include(apiFetch.mock.calls[0][1].body, 'fields name');
    assert.include(apiFetch.mock.calls[0][1].body, 'limit 18');
  });

  test('searchGames busca juegos y limpia comillas dobles', async () => {
    const gamesMock = [
      {
        id: 2,
        name: 'Zelda',
      },
    ];

    apiFetch.mockResolvedValue(gamesMock);

    const result = await searchGames('The "Legend" of Zelda');

    assert.deepEqual(result, gamesMock);

    assert.equal(apiFetch.mock.calls[0][0], '/api/igdb/games');
    assert.equal(apiFetch.mock.calls[0][1].method, 'POST');

    assert.deepEqual(apiFetch.mock.calls[0][1].headers, {
      'Content-Type': 'text/plain',
    });

    assert.include(
      apiFetch.mock.calls[0][1].body,
      'search "The Legend of Zelda"'
    );

    assert.include(apiFetch.mock.calls[0][1].body, 'limit 20');
  });

  test('searchGameSeries busca colecciones y limpia comillas dobles', async () => {
    const seriesMock = [
      {
        id: 3,
        name: 'Final Fantasy',
      },
    ];

    apiFetch.mockResolvedValue(seriesMock);

    const result = await searchGameSeries('Final "Fantasy"');

    assert.deepEqual(result, seriesMock);

    assert.equal(apiFetch.mock.calls[0][0], '/api/igdb/collections');
    assert.equal(apiFetch.mock.calls[0][1].method, 'POST');

    assert.deepEqual(apiFetch.mock.calls[0][1].headers, {
      'Content-Type': 'text/plain',
    });

    assert.include(
      apiFetch.mock.calls[0][1].body,
      'search "Final Fantasy"'
    );

    assert.include(apiFetch.mock.calls[0][1].body, 'limit 5');
  });

  test('fetchGameDetail retorna el primer resultado', async () => {
    const detailMock = [
      {
        id: 3498,
        name: 'Grand Theft Auto V',
      },
    ];

    apiFetch.mockResolvedValue(detailMock);

    const result = await fetchGameDetail(3498);

    assert.deepEqual(result, detailMock[0]);

    assert.equal(apiFetch.mock.calls[0][0], '/api/igdb/games');
    assert.equal(apiFetch.mock.calls[0][1].method, 'POST');

    assert.deepEqual(apiFetch.mock.calls[0][1].headers, {
      'Content-Type': 'text/plain',
    });

    assert.include(apiFetch.mock.calls[0][1].body, 'where id = 3498');
    assert.include(apiFetch.mock.calls[0][1].body, 'limit 1');
  });

  test('fetchGameDetail retorna null si no encuentra resultados', async () => {
    apiFetch.mockResolvedValue([]);

    const result = await fetchGameDetail(9999);

    assert.isNull(result);
  });

  test('fetchGameDetail retorna null si apiFetch retorna undefined', async () => {
    apiFetch.mockResolvedValue(undefined);

    const result = await fetchGameDetail(9999);

    assert.isNull(result);
  });

  test('searchGames permite query normal sin comillas', async () => {
    apiFetch.mockResolvedValue([]);

    await searchGames('Mario');

    assert.include(apiFetch.mock.calls[0][1].body, 'search "Mario"');
  });

  test('searchGameSeries permite saga normal sin comillas', async () => {
    apiFetch.mockResolvedValue([]);

    await searchGameSeries('Metroid');

    assert.include(apiFetch.mock.calls[0][1].body, 'search "Metroid"');
  });
});