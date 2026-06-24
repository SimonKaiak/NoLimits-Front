import { describe, test, assert } from 'vitest';

import {
  normalizeTmdbMovie,
  normalizeTmdbSeries,
  normalizeJikanAnime,
  normalizeOpenLibraryBook,
  normalizeIgdbGame,
  normalizeRawgGame,
  normalizeMusicBrainzRelease,
  normalizeGoogleBook,
  normalizeOpenLibrarySubjectWork,
} from '@/utils/normalizeMedia';

describe('normalizeMedia', () => {
  test('normaliza una película de TMDB', () => {
    const movie = normalizeTmdbMovie({
      id: 1893,
      title: 'Star Wars',
      release_date: '1977-05-25',
      vote_average: 8.6,
      vote_count: 1000,
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      overview: 'Una película espacial.',
      genres: [{ name: 'Ciencia ficción' }, { name: 'Aventura' }],
      belongs_to_collection: { name: 'Star Wars Collection' },
    });

    assert.include(movie, {
      id: 'tmdb:movie:1893',
      type: 'movie',
      title: 'Star Wars',
      year: '1977',
      rating: '8.6',
      voteCount: 1000,
      synopsis: 'Una película espacial.',
      saga: 'Star Wars Collection',
      source: 'tmdb',
    });

    assert.deepEqual(movie.genres, ['Ciencia ficción', 'Aventura']);
    assert.include(movie.poster, '/poster.jpg');
    assert.include(movie.backdrop, '/backdrop.jpg');
  });

  test('normaliza una serie de TMDB', () => {
    const series = normalizeTmdbSeries({
      id: 1399,
      name: 'Game of Thrones',
      first_air_date: '2011-04-17',
      vote_average: 8.4,
      overview: 'Serie de fantasía.',
      genres: [{ name: 'Drama' }],
      networks: [{ name: 'HBO' }],
    });

    assert.include(series, {
      id: 'tmdb:series:1399',
      type: 'series',
      title: 'Game of Thrones',
      year: '2011',
      rating: '8.4',
      synopsis: 'Serie de fantasía.',
      source: 'tmdb',
    });

    assert.deepEqual(series.genres, ['Drama']);
    assert.deepEqual(series.platforms, ['HBO']);
  });

  test('normaliza un anime de Jikan', () => {
    const anime = normalizeJikanAnime({
      mal_id: 1,
      title_english: 'Cowboy Bebop',
      year: 1998,
      score: 8.75,
      images: {
        jpg: {
          large_image_url: 'https://cdn.example.com/cowboy.jpg',
        },
      },
      synopsis: 'Anime espacial.',
      genres: [{ name: 'Action' }, { name: 'Sci-Fi' }],
      studios: [{ name: 'Sunrise' }],
    });

    assert.include(anime, {
      id: 'jikan:anime:1',
      type: 'anime',
      title: 'Cowboy Bebop',
      year: '1998',
      rating: '8.8',
      poster: 'https://cdn.example.com/cowboy.jpg',
      synopsis: 'Anime espacial.',
      source: 'jikan',
    });

    assert.deepEqual(anime.genres, ['Action', 'Sci-Fi']);
    assert.deepEqual(anime.platforms, ['Sunrise']);
  });

  test('normaliza un libro de OpenLibrary', () => {
    const book = normalizeOpenLibraryBook({
      key: '/works/OL45804W',
      title: 'The Lord of the Rings',
      first_publish_year: 1954,
      ratings_average: 4.7,
      cover_i: 12345,
      description: { value: 'Novela de fantasía.' },
      subjects: ['Fantasy', 'Adventure', 'Classic'],
    });

    assert.include(book, {
      id: 'openlibrary:book:OL45804W',
      type: 'book',
      title: 'The Lord of the Rings',
      year: '1954',
      rating: '4.7',
      synopsis: 'Novela de fantasía.',
      source: 'openlibrary',
    });

    assert.deepEqual(book.genres, ['Fantasy', 'Adventure', 'Classic']);
    assert.include(book.poster, '12345-L.jpg');
  });

  test('normaliza un videojuego de IGDB', () => {
    const game = normalizeIgdbGame({
      id: 1020,
      name: 'The Legend of Zelda',
      first_release_date: 1488326400,
      rating: 95,
      cover: { url: '//images.igdb.com/igdb/image/upload/t_thumb/abc.jpg' },
      screenshots: [{ url: '//images.igdb.com/igdb/image/upload/t_thumb/bg.jpg' }],
      summary: 'Juego de aventura.',
      genres: [{ name: 'Adventure' }],
      collection: { name: 'Zelda' },
      platforms: [{ name: 'Nintendo Switch' }],
      websites: [
        { url: 'https://www.nintendo.com/store/products/zelda' },
      ],
    });

    assert.include(game, {
      id: 'igdb:game:1020',
      type: 'game',
      title: 'The Legend of Zelda',
      year: '2017',
      rating: '9.5',
      synopsis: 'Juego de aventura.',
      saga: 'Zelda',
      source: 'igdb',
    });

    assert.deepEqual(game.genres, ['Adventure']);
    assert.deepEqual(game.platforms, ['Nintendo Switch']);

    assert.include(game.gameStores[0], {
      label: 'Nintendo',
      accent: true,
    });
  });

  test('normaliza un lanzamiento musical de MusicBrainz', () => {
    const music = normalizeMusicBrainzRelease({
      id: 'mb-123',
      title: 'Animals',
      date: '2013-06-17',
      rating: { value: 4.5 },
      disambiguation: 'Single',
      tags: [{ name: 'edm' }, { name: 'progressive house' }],
    });

    assert.include(music, {
      id: 'musicbrainz:music:mb-123',
      type: 'music',
      title: 'Animals',
      year: '2013',
      rating: '9.0',
      synopsis: 'Single',
      poster: '/img/fallbacks/music-fallback.webp',
      backdrop: '/img/fallbacks/music-fallback.webp',
      source: 'musicbrainz',
    });

    assert.deepEqual(music.genres, ['edm', 'progressive house']);
  });

  test('normaliza un videojuego de RAWG', () => {
    const game = normalizeRawgGame({
      id: 123,
      name: 'Cyberpunk 2077',
      released: '2020-12-10',
      rating: 4.3,
      background_image: 'https://img.com/cyberpunk.jpg',
      background_image_additional: 'https://img.com/cyberpunk-bg.jpg',
      description_raw: 'RPG futurista',
      genres: [{ name: 'RPG' }],
      platforms: [{ platform: { name: 'PC' } }],
      stores: [{ url: 'https://store.steampowered.com/app/1091500' }],
    });

    assert.include(game, {
      id: 'rawg:game:123',
      type: 'game',
      title: 'Cyberpunk 2077',
      year: '2020',
      rating: '8.6',
      poster: 'https://img.com/cyberpunk.jpg',
      backdrop: 'https://img.com/cyberpunk-bg.jpg',
      synopsis: 'RPG futurista',
      source: 'rawg',
    });

    assert.deepEqual(game.genres, ['RPG']);
    assert.deepEqual(game.platforms, ['PC']);

    assert.include(game.gameStores[0], {
      label: 'Steam',
      accent: true,
    });
  });

  test('normaliza un libro de Google Books', () => {
    const book = normalizeGoogleBook({
      id: 'google-book-1',
      volumeInfo: {
        title: 'Harry Potter: La piedra filosofal',
        publishedDate: '1997-06-26',
        averageRating: 4.5,
        imageLinks: {
          thumbnail: 'http://books.google.com/cover.jpg',
        },
        description: 'Un joven mago descubre su destino.',
        categories: ['Fantasy'],
      },
    });

    assert.include(book, {
      id: 'openlibrary:book:google-book-1',
      type: 'book',
      title: 'Harry Potter',
      year: '1997',
      rating: '9.0',
      poster: 'https://books.google.com/cover.jpg',
      backdrop: 'https://books.google.com/cover.jpg',
      synopsis: 'Un joven mago descubre su destino.',
      source: 'openlibrary',
    });

    assert.deepEqual(book.genres, ['Fantasy']);
  });

  test('normalizadores usan valores fallback cuando faltan datos', () => {
    const igdb = normalizeIgdbGame({ id: 1 });
    const rawg = normalizeRawgGame({ id: 2 });
    const googleBook = normalizeGoogleBook({ id: 'book-1' });

    assert.equal(igdb.title, 'Sin título');
    assert.equal(igdb.year, '—');
    assert.equal(igdb.rating, '—');
    assert.equal(igdb.poster, '/img/fallbacks/videogame-fallback.webp');

    assert.equal(rawg.title, 'Sin título');
    assert.equal(rawg.year, '—');
    assert.equal(rawg.rating, '—');
    assert.isNull(rawg.poster);

    assert.equal(googleBook.title, 'Sin título');
    assert.equal(googleBook.year, '—');
    assert.equal(googleBook.rating, '—');
    assert.equal(googleBook.poster, '/img/fallbacks/book-fallback.webp');
  });

  test('normaliza un work de subject de OpenLibrary', () => {
    const book = normalizeOpenLibrarySubjectWork({
      key: '/works/OL999W',
      title: 'Libro subject',
      cover_id: 555,
      subject: ['Fantasy', 'Magic', 'Adventure'],
    });

    assert.include(book, {
      id: 'openlibrary:book:OL999W',
      type: 'book',
      title: 'Libro subject',
      year: '—',
      rating: '—',
      synopsis: '',
      saga: null,
      source: 'openlibrary',
    });

    assert.deepEqual(book.genres, ['Fantasy', 'Magic', 'Adventure']);
    assert.include(book.poster, '555-M.jpg');
    assert.include(book.backdrop, '555-L.jpg');
  });

  test('normaliza un work de subject de OpenLibrary con fallbacks', () => {
    const book = normalizeOpenLibrarySubjectWork({});

    assert.equal(book.type, 'book');
    assert.equal(book.title, 'Sin título');
    assert.equal(book.year, '—');
    assert.equal(book.rating, '—');
    assert.deepEqual(book.genres, []);
    assert.equal(book.poster, '/img/fallbacks/book-fallback.webp');
    assert.equal(book.backdrop, '/img/fallbacks/book-fallback.webp');
  });

});

describe('normalizeMedia - branch coverage', () => {

  it('RAWG ignora store sin URL', () => {
    const result = normalizeRawgGame({
      id: 1,
      stores: [{ url: '' }],
      genres: [],
    });

    expect(result.gameStores).toEqual([]);
  });

  it('RAWG ignora dominio desconocido', () => {
    const result = normalizeRawgGame({
      id: 1,
      stores: [{ url: 'https://google.com' }],
      genres: [],
    });

    expect(result.gameStores).toEqual([]);
  });

  it('RAWG detecta Steam', () => {
    const result = normalizeRawgGame({
      id: 1,
      stores: [
        {
          url: 'https://store.steampowered.com/app/123',
        },
      ],
      genres: [],
    });

    expect(result.gameStores.length).toBe(1);
    expect(result.gameStores[0].label).toBe('Steam');
  });

  it('IGDB ignora website desconocido', () => {
    const result = normalizeIgdbGame({
      id: 1,
      websites: [
        {
          url: 'https://google.com',
        },
      ],
    });

    expect(result.gameStores).toEqual([]);
  });

  it('IGDB detecta Steam', () => {
    const result = normalizeIgdbGame({
      id: 1,
      websites: [
        {
          url: 'https://store.steampowered.com/app/123',
        },
      ],
    });

    expect(result.gameStores.length).toBe(1);
  });

  it('OpenLibrary usa subjects', () => {
    const result = normalizeOpenLibraryBook({
      key: '/works/OL1',
      title: 'Libro',
      subjects: ['A', 'B'],
    });

    expect(result.genres).toEqual(['A', 'B']);
  });

  it('OpenLibrary usa subject', () => {
    const result = normalizeOpenLibraryBook({
      key: '/works/OL1',
      title: 'Libro',
      subject: ['Drama'],
    });

    expect(result.genres).toEqual(['Drama']);
  });

  it('OpenLibrary sin subjects devuelve array vacío', () => {
    const result = normalizeOpenLibraryBook({
      key: '/works/OL1',
      title: 'Libro',
    });

    expect(result.genres).toEqual([]);
  });

  it('Anime usa title_english', () => {
    const result = normalizeJikanAnime({
      mal_id: 1,
      title_english: 'Naruto',
    });

    expect(result.title).toBe('Naruto');
  });

  it('Anime usa fallback Sin título', () => {
    const result = normalizeJikanAnime({
      mal_id: 1,
    });

    expect(result.title).toBe('Sin título');
  });

});