/**
 * utils/sagaData.js
 * Datos curados de sagas conocidas.
 * Cada entrada define descripción, color representativo y query de TMDB para el hero.
 *
 * Las sagas aquí tienen su propia vista enriquecida en /saga/:name.
 * Sagas no listadas caen al buscador genérico.
 */

export const CURATED_SAGAS = new Map([
  ['spider-man', {
    displayName: 'Spider-Man',
    tagline:     'Con un gran poder, viene una gran responsabilidad.',
    description: 'Desde el cómic hasta el metaverso cinematográfico, Spider-Man es la franquicia más adaptada de Marvel. Películas live-action, series animadas, videojuegos icónicos y anime japonés —todos forman el universo del trepamuros más famoso del mundo.',
    heroQuery:   'Spider-Man No Way Home',
    accent:      '#60A5FA',
    types:       ['movies', 'series', 'anime', 'games', 'books', 'music'],
  }],
  ['star wars', {
    displayName: 'Star Wars',
    tagline:     'Que la Fuerza te acompañe.',
    description: 'Una galaxia muy, muy lejana. Más de cuatro décadas de películas, series, novelas, cómics y videojuegos construyen el universo de ciencia ficción más expansivo de la historia.',
    heroQuery:   'Star Wars Return Jedi',
    accent:      '#FBBF24',
    types:       ['movies', 'series', 'games', 'books', 'music'],
  }],
  ['batman', {
    displayName: 'Batman',
    tagline:     'Soy la noche.',
    description: 'El Caballero Oscuro de Gotham. Desde los cómics de 1939 hasta blockbusters globales y videojuegos premiados, Batman es el superhéroe más versátil de DC Comics.',
    heroQuery:   'The Dark Knight',
    accent:      '#A78BFA',
    types:       ['movies', 'series', 'games', 'books', 'music'],
  }],
  ['dragon ball', {
    displayName: 'Dragon Ball',
    tagline:     'El poder no tiene límite.',
    description: 'La saga shonen más influyente de todos los tiempos. Cuatro series de anime, más de veinte películas, decenas de videojuegos y un manga que redefinió la cultura pop global.',
    heroQuery:   'Dragon Ball Super Broly',
    accent:      '#FB923C',
    types:       ['anime', 'games', 'movies', 'books', 'music'],
  }],
  ['harry potter', {
    displayName: 'Harry Potter',
    tagline:     'Siempre.',
    description: 'El universo mágico de J.K. Rowling que conquistó generaciones. Ocho películas, una saga paralela, libros que marcaron una era, parques temáticos y videojuegos como Hogwarts Legacy.',
    heroQuery:   'Harry Potter Sorcerer Stone',
    accent:      '#FBBF24',
    types:       ['movies', 'series', 'games', 'books', 'music'],
  }],
  ['the witcher', {
    displayName: 'The Witcher',
    tagline:     'El mal está en todas partes.',
    description: 'Nacida en la literatura polaca de Andrzej Sapkowski, la saga del brujo Geralt se expandió a videojuegos premiados de CD Projekt RED y una serie de Netflix con alcance global.',
    heroQuery:   'The Witcher',
    accent:      '#34D399',
    types:       ['series', 'games', 'books'],
  }],
  ['attack on titan', {
    displayName: 'Attack on Titan',
    tagline:     'La humanidad luchará.',
    description: 'La obra maestra del manga y anime de Hajime Isayama. La humanidad sobrevive dentro de enormes murallas mientras los titanes acechan. Una historia épica de supervivencia, libertad y secretos que redefinió el anime moderno.',
    heroQuery:   'Attack on Titan',
    accent:      '#B91C1C',
    types:       ['anime', 'movies', 'games', 'books', 'music'],
  }],
  ['the last of us', {
    displayName: 'The Last of Us',
    tagline:     'No importa lo que hayas perdido.',
    description: 'De PlayStation a HBO. La historia de Joel y Ellie en un mundo post-apocalíptico redefinió los videojuegos narrativos y produjo una de las mejores series de televisión recientes.',
    heroQuery:   'The Last of Us',
    accent:      '#34D399',
    types:       ['series', 'games', 'books', 'music'],
  }],
  ['one piece', {
    displayName: 'One Piece',
    tagline:     'El pirata más libre del océano.',
    description: 'El manga más vendido de la historia con más de 1,000 capítulos. La aventura de Monkey D. Luffy en busca del One Piece abarca anime, películas, videojuegos y recientemente una aclamada serie en Netflix.',
    heroQuery:   'One Piece Film Red',
    accent:      '#FB923C',
    types:       ['anime', 'series', 'games', 'movies'],
  }],
  ['zelda', {
    displayName: 'The Legend of Zelda',
    tagline:     'El valor para enfrentar el mal.',
    description: 'La franquicia de Nintendo que definió el género de aventura. Desde el NES hasta Nintendo Switch con Breath of the Wild y Tears of the Kingdom, Link y Zelda llevan 40 años conquistando corazones.',
    heroQuery:   'The Legend of Zelda',
    accent:      '#34D399',
    types:       ['games'],
  }],
  ['naruto', {
    displayName: 'Naruto',
    tagline:     'Dattebayo!',
    description: 'El ninja de Konoha que prometió ser Hokage. Una de las grandes trilogías del anime junto a Dragon Ball y One Piece, con cientos de episodios, películas, videojuegos y el spin-off Boruto.',
    heroQuery:   'Naruto Shippuden Movie',
    accent:      '#FB923C',
    types:       ['anime', 'games'],
  }],
  ['lord of the rings', {
    displayName: 'El Señor de los Anillos',
    tagline:     'Un Anillo para gobernarlos a todos.',
    description: 'La obra maestra de Tolkien adaptada al cine por Peter Jackson con tres películas que ganaron 17 Oscars. El universo de la Tierra Media se expande con El Hobbit y la serie Los Anillos de Poder en Prime Video.',
    heroQuery:   'Lord of the Rings Fellowship',
    accent:      '#FBBF24',
    types:       ['movies', 'series', 'books', 'games', 'music'],
    searchAlias: 'Lord of the Rings',
  }],
]);
CURATED_SAGAS.set('el señor de los anillos', CURATED_SAGAS.get('lord of the rings'));
/**
 * Normaliza un nombre de saga a la clave del diccionario.
 * "Spider-Man" → "spider-man", "STAR WARS" → "star wars"
 */
export function normalizeSagaKey(name) {
  return name.toLowerCase().trim();
}

/**
 * Obtiene los datos curados de una saga por nombre.
 * @param {string} name
 * @returns {Object|null}
 */
export function getCuratedSaga(name) {
  const key = normalizeSagaKey(name);
  return CURATED_SAGAS.get(key) ?? null;
}

/* Lista de sagas para el mosaico del hero (12 sagas) */
export const MOSAIC_SAGA_QUERIES = [
  'Spider-Man No Way Home',
  'Star Wars Return Jedi',
  'The Dark Knight',
  'Dragon Ball Super Broly',
  'Harry Potter Sorcerer Stone',
  'Avengers Endgame',
  'The Last of Us',
  'One Piece Film Red',
  'Naruto Shippuden Movie',
  'Lord of the Rings Fellowship',
  'The Witcher',
  'Interstellar',
];