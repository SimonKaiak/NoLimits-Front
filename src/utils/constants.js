/**
 * utils/constants.js — Constantes globales de no/limits.
 */

/* ── APIs ─────────────────────────────────────────────────── */
export const TMDB_BASE_URL        = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE      = 'https://image.tmdb.org/t/p';
export const JIKAN_BASE_URL       = 'https://api.jikan.moe/v4';
export const OPENLIBRARY_BASE_URL = 'https://openlibrary.org';
export const OPENLIBRARY_COVERS   = 'https://covers.openlibrary.org';
export const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2';
/* IGDB se accede vía proxy /api/igdb/* — ver vite.config.js y services/igdb.js */

/* ── Fuentes de datos ─────────────────────────────────────── */
export const DATA_SOURCES = {
  TMDB:         'tmdb',
  JIKAN:        'jikan',
  OPENLIBRARY:  'openlibrary',
  IGDB:         'igdb',
  MUSICBRAINZ:  'musicbrainz',
  RAWG:        'rawg',
};

/* ── Tipos de obra ────────────────────────────────────────── */
export const MEDIA_TYPES = {
  MOVIE:  'movie',
  SERIES: 'series',
  ANIME:  'anime',
  BOOK:   'book',
  MUSIC:  'music',
  GAME:   'game',
};

export const MEDIA_TYPE_LABELS = new Map([
  [MEDIA_TYPES.MOVIE,  'Película'],
  [MEDIA_TYPES.SERIES, 'Serie'],
  [MEDIA_TYPES.ANIME,  'Anime'],
  [MEDIA_TYPES.BOOK,   'Libro'],
  [MEDIA_TYPES.MUSIC,  'Música'],
  [MEDIA_TYPES.GAME,   'Videojuego'],
]);

export const MEDIA_TYPE_BADGE_CLASS = new Map([
  [MEDIA_TYPES.MOVIE,  'nl-badge--movie'],
  [MEDIA_TYPES.SERIES, 'nl-badge--series'],
  [MEDIA_TYPES.ANIME,  'nl-badge--anime'],
  [MEDIA_TYPES.BOOK,   'nl-badge--book'],
  [MEDIA_TYPES.MUSIC,  'nl-badge--music'],
  [MEDIA_TYPES.GAME,   'nl-badge--game'],
]);

/* ── Tamaños de imagen TMDB ───────────────────────────────── */
export const TMDB_POSTER_SIZES = {
  SM: 'w185', MD: 'w342', LG: 'w500', XL: 'w780', ORIGINAL: 'original',
};
export const TMDB_BACKDROP_SIZES = {
  SM: 'w300', MD: 'w780', LG: 'w1280', ORIGINAL: 'original',
};

/* ── Tabs de búsqueda ─────────────────────────────────────── */
export const SEARCH_TABS = [
  { id: 'all',               label: 'Todo'       },
  { id: MEDIA_TYPES.MOVIE,   label: 'Películas'  },
  { id: MEDIA_TYPES.SERIES,  label: 'Series'     },
  { id: MEDIA_TYPES.ANIME,   label: 'Anime'      },
  { id: MEDIA_TYPES.BOOK,    label: 'Libros'     },
  { id: MEDIA_TYPES.GAME,    label: 'Juegos'     },
  { id: MEDIA_TYPES.MUSIC,   label: 'Música'     },
];

/* ── Secciones del home ───────────────────────────────────── */
export const HOME_SECTIONS = {
  TRENDING:  'EN TENDENCIA · ESTA SEMANA',
  TOP_RATED: 'MEJOR VALORADO',
  ANIME:     'ANIME DESTACADO',
  GAMES:     'VIDEOJUEGOS DESTACADOS',
  BOOKS:     'LIBROS RECOMENDADOS',
};

export const BOOK_SUBJECTS = {
  SCI_FI:   'science_fiction',
  THRILLER: 'thriller',
  FANTASY:  'fantasy',
};

/* ── Animación ────────────────────────────────────────────── */
export const CARD_STAGGER_DELAY = 0.06;

export const FADE_UP_VARIANTS = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0  },
};

/* ── Rutas ────────────────────────────────────────────────── */
export const ROUTES = {
  HOME:    '/',
  SEARCH:  '/search',
  DETAIL:  '/detail/:mediaId',
  MY_LIST: '/my-list',
  SAGA:    '/saga/:sagaName',
  LOGIN:   '/login',
};

/* ── Streaming providers ──────────────────────────────────── */
export const WATCH_PROVIDERS_COUNTRY = 'AR';
