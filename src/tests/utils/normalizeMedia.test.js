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

  test('normaliza película TMDB con original_title, genre_ids y fallbacks', () => {
    const movie = normalizeTmdbMovie({
      id: 10,
      original_title: 'Original Movie',
      release_date: '',
      vote_average: 0,
      genre_ids: [28, 12],
    });

    assert.include(movie, {
      id: 'tmdb:movie:10',
      title: 'Original Movie',
      year: '—',
      rating: '—',
      voteCount: 0,
      synopsis: '',
      saga: null,
      poster: '/img/fallbacks/movie-tvshow-fallback.webp',
      backdrop: '/img/fallbacks/movie-tvshow-fallback.webp',
    });

    assert.deepEqual(movie.genres, ['28', '12']);
  });

  test('normaliza serie TMDB con original_name, genre_ids y sin networks', () => {
    const series = normalizeTmdbSeries({
      id: 20,
      original_name: 'Original Series',
      first_air_date: '',
      vote_average: 0,
      genre_ids: [18, 80],
    });

    assert.include(series, {
      id: 'tmdb:series:20',
      title: 'Original Series',
      year: '—',
      rating: '—',
      voteCount: 0,
      synopsis: '',
      poster: '/img/fallbacks/movie-tvshow-fallback.webp',
      backdrop: '/img/fallbacks/movie-tvshow-fallback.webp',
    });

    assert.deepEqual(series.genres, ['18', '80']);
    assert.deepEqual(series.platforms, []);
  });

  test('normaliza anime Jikan usando title, fecha aired, imagen normal y fallback de backdrop', () => {
    const anime = normalizeJikanAnime({
      mal_id: 2,
      title: 'Anime sin título inglés',
      aired: { from: '2001-04-01' },
      score: 0,
      images: {
        jpg: {
          image_url: 'https://cdn.example.com/anime.jpg',
        },
      },
    });

    assert.include(anime, {
      id: 'jikan:anime:2',
      title: 'Anime sin título inglés',
      year: '2001',
      rating: '—',
      poster: 'https://cdn.example.com/anime.jpg',
      backdrop: '/img/fallbacks/movie-tvshow-fallback.webp',
      synopsis: '',
    });

    assert.deepEqual(anime.genres, []);
    assert.deepEqual(anime.platforms, []);
  });

  test('normaliza OpenLibrary usando edition_key, first_sentence y subject', () => {
    const book = normalizeOpenLibraryBook({
      edition_key: ['OL123M'],
      title: '',
      first_publish_date: '2005',
      cover_edition_key: 'OLCOVER',
      first_sentence: { value: 'Primera frase.' },
      subject: ['Drama', 'Misterio', 'Aventura', 'Clásico', 'Ficción', 'Extra'],
    });

    assert.include(book, {
      id: 'openlibrary:book:OL123M',
      title: 'Sin título',
      year: '2005',
      synopsis: 'Primera frase.',
    });

    assert.deepEqual(book.genres, [
      'Drama',
      'Misterio',
      'Aventura',
      'Clásico',
      'Ficción',
    ]);
  });

  test('normaliza IGDB con tienda no reconocida y franchise como saga', () => {
    const game = normalizeIgdbGame({
      id: 30,
      name: '',
      first_release_date: null,
      rating: null,
      franchise: { name: 'Franquicia Test' },
      websites: [{ url: 'https://pagina-no-reconocida.com/game' }],
    });

    assert.include(game, {
      id: 'igdb:game:30',
      title: 'Sin título',
      year: '—',
      rating: '—',
      poster: '/img/fallbacks/videogame-fallback.webp',
      backdrop: '/img/fallbacks/videogame-fallback.webp',
      synopsis: '',
      saga: 'Franquicia Test',
    });

    assert.deepEqual(game.gameStores, []);
  });

  test('normaliza RAWG con description, fallback de backdrop y stores inválidos', () => {
    const game = normalizeRawgGame({
      id: 40,
      name: '',
      released: '',
      rating: 0,
      background_image: 'https://img.com/game.jpg',
      description: 'Descripción HTML',
      platforms: [{ name: 'PlayStation 5' }],
      stores: [
        { url: '' },
        { store: { domain: 'store.steampowered.com' } },
      ],
    });

    assert.include(game, {
      id: 'rawg:game:40',
      title: 'Sin título',
      year: '—',
      rating: '—',
      poster: 'https://img.com/game.jpg',
      backdrop: 'https://img.com/game.jpg',
      synopsis: 'Descripción HTML',
    });

    assert.deepEqual(game.platforms, ['PlayStation 5']);
    assert.deepEqual(game.gameStores, []);
  });

  test('normaliza MusicBrainz usando name, artist-credit y primary-type como fallbacks', () => {
    const musicByName = normalizeMusicBrainzRelease({
      id: 'mb-name',
      name: 'Nombre release',
      'first-release-date': '2020-01-01',
      'primary-type': 'Album',
    });

    const musicByArtist = normalizeMusicBrainzRelease({
      id: 'mb-artist',
      'artist-credit': [{ artist: { name: 'Artista Test' } }],
    });

    assert.include(musicByName, {
      title: 'Nombre release',
      year: '2020',
      rating: '—',
      synopsis: 'Album',
    });

    assert.include(musicByArtist, {
      title: 'Artista Test',
      year: '—',
      rating: '—',
      synopsis: '',
    });
  });

  test('normaliza película TMDB sin title ni original_title y sin géneros', () => {
    const movie = normalizeTmdbMovie({
      id: 50,
      vote_count: null,
      release_date: 'fecha-mala',
      vote_average: null,
    });

    assert.include(movie, {
      id: 'tmdb:movie:50',
      title: 'Sin título',
      year: '—',
      rating: '—',
      voteCount: 0,
      synopsis: '',
      saga: null,
      poster: '/img/fallbacks/movie-tvshow-fallback.webp',
      backdrop: '/img/fallbacks/movie-tvshow-fallback.webp',
    });

    assert.deepEqual(movie.genres, []);
  });

  test('normaliza serie TMDB sin name ni original_name y sin géneros', () => {
    const series = normalizeTmdbSeries({
      id: 60,
      vote_count: null,
      first_air_date: 'fecha-mala',
      vote_average: null,
    });

    assert.include(series, {
      id: 'tmdb:series:60',
      title: 'Sin título',
      year: '—',
      rating: '—',
      voteCount: 0,
      synopsis: '',
      poster: '/img/fallbacks/movie-tvshow-fallback.webp',
      backdrop: '/img/fallbacks/movie-tvshow-fallback.webp',
    });

    assert.deepEqual(series.genres, []);
    assert.deepEqual(series.platforms, []);
  });

  test('normaliza anime Jikan con title fallback y trailer como backdrop', () => {
    const anime = normalizeJikanAnime({
      mal_id: 70,
      score: null,
      title: '',
      trailer: {
        images: {
          maximum_image_url: 'https://cdn.example.com/trailer.jpg',
        },
      },
    });

    assert.include(anime, {
      id: 'jikan:anime:70',
      title: 'Sin título',
      year: '—',
      rating: '—',
      poster: '/img/fallbacks/movie-tvshow-fallback.webp',
      backdrop: 'https://cdn.example.com/trailer.jpg',
      synopsis: '',
    });

    assert.deepEqual(anime.genres, []);
    assert.deepEqual(anime.platforms, []);
  });

  test('normaliza OpenLibrary usando cover de covers y descripción string', () => {
    const book = normalizeOpenLibraryBook({
      id: 'book-test',
      covers: [777],
      title: 'Libro con covers',
      first_publish_date: '2010',
      description: 'Descripción simple',
    });

    assert.include(book, {
      title: 'Libro con covers',
      year: '2010',
      synopsis: 'Descripción simple',
    });

    assert.include(book.poster, '777-L.jpg');
    assert.include(book.backdrop, '777-L.jpg');
  });

  test('normaliza OpenLibrary sin key, edition_key ni cover usando fallback aleatorio', () => {
    const book = normalizeOpenLibraryBook({
      title: 'Libro fallback total',
      description: '',
      first_sentence: 'Primera frase string',
    });

    assert.equal(book.type, 'book');
    assert.equal(book.title, 'Libro fallback total');
    assert.equal(book.synopsis, 'Primera frase string');
    assert.equal(book.poster, '/img/fallbacks/book-fallback.webp');
    assert.equal(book.backdrop, '/img/fallbacks/book-fallback.webp');
  });

  test('normaliza IGDB con tiendas Steam y Epic reconocidas', () => {
    const game = normalizeIgdbGame({
      id: 80,
      name: 'Juego tiendas',
      websites: [
        { url: 'https://store.steampowered.com/app/123' },
        { url: 'https://www.epicgames.com/store/game' },
      ],
    });

    assert.lengthOf(game.gameStores, 2);
    assert.equal(game.gameStores[0].label, 'Steam');
    assert.equal(game.gameStores[1].label, 'Epic Games');
  });

  test('normaliza RAWG con stores sin url pero con domain no http', () => {
    const game = normalizeRawgGame({
      id: 90,
      stores: [
        {
          store: {
            domain: 'store.steampowered.com',
          },
        },
      ],
      platforms: [
        {
          name: null,
        },
      ],
    });

    assert.deepEqual(game.gameStores, []);
    assert.deepEqual(game.platforms, ['']);
  });

  test('normaliza GoogleBook sin volumeInfo ni imageLinks', () => {
    const book = normalizeGoogleBook({
      id: 'google-empty',
    });

    assert.include(book, {
      id: 'openlibrary:book:google-empty',
      title: 'Sin título',
      year: '—',
      rating: '—',
      poster: '/img/fallbacks/book-fallback.webp',
      backdrop: '/img/fallbacks/book-fallback.webp',
      synopsis: '',
    });

    assert.deepEqual(book.genres, []);
  });

  test('OpenLibrary usa first_sentence string', () => {
    const book = normalizeOpenLibraryBook({
      first_sentence: 'Primera frase simple',
    });

    assert.equal(book.synopsis, 'Primera frase simple');
  });

  test('RAWG usa url vacío cuando no existe store', () => {
    const game = normalizeRawgGame({
      id: 1,
      stores: [{}],
    });

    assert.deepEqual(game.gameStores, []);
  });

  test('RAWG ignora tiendas desconocidas', () => {
    const game = normalizeRawgGame({
      id: 2,
      stores: [
        {
          url: 'https://ejemplo.com/juego',
        },
      ],
    });

    assert.deepEqual(game.gameStores, []);
  });

  test('MusicBrainz usa Sin título cuando no hay nombre', () => {
    const music = normalizeMusicBrainzRelease({
      id: 'abc',
    });

    assert.equal(music.title, 'Sin título');
  });
});