import { render, screen } from '@testing-library/react';
import { describe, test, assert } from 'vitest';
import WhereToFind from '@/components/ui/WhereToFind';
import { MEDIA_TYPES } from '@/utils/constants';

describe('WhereToFind - tests de regresión', () => {
  test('muestra links de compra cuando la obra tiene productos scrapeados', () => {
    const obra = {
      title: 'Producto prueba',
      type: MEDIA_TYPES.GAME,
      linksCompra: [
        {
          url: 'https://www.mercadolibre.cl/producto-prueba',
          label: 'Mercado Libre',
        },
      ],
    };

    render(<WhereToFind obra={obra} />);

    const link = screen.getByRole('link', { name: /mercado libre/i });

    assert.isNotNull(link);
    assert.equal(
      link.getAttribute('href'),
      'https://www.mercadolibre.cl/producto-prueba'
    );
  });

  test('muestra Steam cuando un videojuego tiene plataforma PC', () => {
    const obra = {
      title: 'Cyberpunk 2077',
      type: MEDIA_TYPES.GAME,
      platforms: ['PC'],
    };

    render(<WhereToFind obra={obra} />);

    assert.isNotNull(screen.getByText('PC'));

    const steamLink = screen.getByRole('link', { name: /steam/i });

    assert.isNotNull(steamLink);
    assert.equal(
      steamLink.getAttribute('href'),
      'https://store.steampowered.com/search/?term=Cyberpunk%202077'
    );
  });

  test('muestra Google Books para una obra de tipo libro', () => {
    const obra = {
      id: 'openlibrary:book:abc123',
      title: 'Libro prueba',
      type: MEDIA_TYPES.BOOK,
    };

    render(<WhereToFind obra={obra} />);

    const link = screen.getByRole('link', { name: /ver en google books/i });

    assert.isNotNull(link);
    assert.equal(
      link.getAttribute('href'),
      'https://books.google.com/books?id=abc123'
    );
  });

  test('muestra Crunchyroll y Netflix para anime', () => {
    const obra = {
      title: 'Anime prueba',
      type: MEDIA_TYPES.ANIME,
    };

    render(<WhereToFind obra={obra} />);

    assert.isNotNull(screen.getByRole('link', { name: /crunchyroll/i }));
    assert.isNotNull(screen.getByRole('link', { name: /netflix/i }));
  });

  test('muestra JustWatch y Buscar online para película en modo compact', () => {
    const obra = {
      title: 'Interestelar',
      type: MEDIA_TYPES.MOVIE,
    };

    render(<WhereToFind obra={obra} compact />);

    assert.isNotNull(screen.getByRole('link', { name: /justwatch/i }));
    assert.isNotNull(screen.getByRole('link', { name: /buscar online/i }));
  });

  test('muestra proveedores de streaming y excluye Google Play Movies', () => {
    const obra = {
      title: 'Breaking Bad',
      type: MEDIA_TYPES.SERIES,
    };

    const providers = {
      link: 'https://www.justwatch.com/mx/serie/breaking-bad',
      flatrate: [
        {
          provider_id: 8,
          provider_name: 'Netflix',
          logo_path: '/netflix.png',
        },
        {
          provider_id: 3,
          provider_name: 'Google Play Movies',
          logo_path: '/google.png',
        },
      ],
    };

    render(<WhereToFind obra={obra} providers={providers} />);

    assert.isNotNull(screen.getByRole('link', { name: /netflix/i }));
    assert.isNull(screen.queryByText(/google play movies/i));
    assert.isNotNull(screen.getByRole('link', { name: /buscar online/i }));
  });

  test('muestra MusicBrainz para una obra de tipo música', () => {
    const obra = {
      id: 'musicbrainz:music:mbid123',
      title: 'Canción prueba',
      type: MEDIA_TYPES.MUSIC,
    };

    render(<WhereToFind obra={obra} />);

    const link = screen.getByRole('link', { name: /ver en musicbrainz/i });

    assert.isNotNull(link);
    assert.equal(
      link.getAttribute('href'),
      'https://musicbrainz.org/release-group/mbid123'
    );
  });
  
  test('retorna null cuando no recibe obra', () => {
    const { container } = render(<WhereToFind obra={null} />);

    assert.equal(container.textContent, '');
  });

  test('muestra tiendas directas cuando videojuego tiene gameStores', () => {
    const obra = {
      title: 'Zelda',
      type: MEDIA_TYPES.GAME,
      platforms: ['Nintendo Switch', 'PC'],
      gameStores: [
        {
          url: 'https://www.nintendo.com/zelda',
          label: 'Nintendo',
          accent: true,
        },
      ],
    };

    render(<WhereToFind obra={obra} />);

    assert.isNotNull(screen.getByText('NSW'));
    assert.isNotNull(screen.getByText('PC'));
    assert.isNotNull(screen.getByRole('link', { name: /nintendo/i }));
  });

  test('muestra fallback de búsqueda si videojuego no tiene plataformas conocidas', () => {
    const obra = {
      title: 'Juego raro',
      type: MEDIA_TYPES.GAME,
      platforms: ['Plataforma inventada'],
    };

    render(<WhereToFind obra={obra} />);

    assert.isNotNull(screen.getByText('Plataf'));
    assert.isNotNull(
      screen.getByRole('link', { name: /buscar dónde comprar/i })
    );
  });

  test('muestra JustWatch cuando providers no trae servicios', () => {
    const obra = {
      title: 'Película sin providers',
      type: MEDIA_TYPES.MOVIE,
    };

    render(
      <WhereToFind
        obra={obra}
        providers={{
          link: 'https://www.justwatch.com/mx/movie/test',
          flatrate: [],
        }}
      />
    );

    assert.isNotNull(screen.getByRole('link', { name: /justwatch/i }));
    assert.isNotNull(screen.getByRole('link', { name: /buscar online/i }));
  });

  test('muestra fallback dónde verlo cuando película no está en modo compact ni providers', () => {
    const obra = {
      title: 'Película fallback',
      type: MEDIA_TYPES.MOVIE,
    };

    render(<WhereToFind obra={obra} />);

    assert.isNotNull(screen.getByRole('link', { name: /dónde verlo/i }));
  });

  test('retorna null para tipo no soportado', () => {
    const { container } = render(
      <WhereToFind
        obra={{
          title: 'Tipo raro',
          type: 'unknown',
        }}
      />
    );

    assert.equal(container.textContent, '');
  });

  test('muestra linksCompra usando urlCompra y plataformaNombre como fallback', () => {
    const obra = {
      title: 'Producto con urlCompra',
      type: MEDIA_TYPES.MOVIE,
      linksCompra: [
        {
          urlCompra: 'https://tienda.cl/producto',
          plataformaNombre: 'Tienda NoLimits',
        },
      ],
    };

    render(<WhereToFind obra={obra} />);

    const link = screen.getByRole('link', { name: /tienda nolimits/i });

    assert.isNotNull(link);
    assert.equal(link.getAttribute('href'), 'https://tienda.cl/producto');
  });

  test('muestra linksCompra usando plataforma.nombre como fallback', () => {
    const obra = {
      title: 'Producto plataforma objeto',
      type: MEDIA_TYPES.GAME,
      linksCompra: [
        {
          url: 'https://otra-tienda.cl/producto',
          plataforma: {
            nombre: 'Otra Tienda',
          },
        },
      ],
    };

    render(<WhereToFind obra={obra} />);

    const link = screen.getByRole('link', { name: /otra tienda/i });

    assert.isNotNull(link);
    assert.equal(link.getAttribute('href'), 'https://otra-tienda.cl/producto');
  });

  test('muestra providers de compra cuando no hay flatrate', () => {
    const obra = {
      title: 'Película compra',
      type: MEDIA_TYPES.MOVIE,
    };

    const providers = {
      link: 'https://www.justwatch.com/mx/movie/compra',
      buy: [
        {
          provider_id: 10,
          provider_name: 'Apple TV',
          logo_path: null,
        },
      ],
    };

    render(<WhereToFind obra={obra} providers={providers} />);

    assert.isNotNull(screen.getByRole('link', { name: /apple tv/i }));
    assert.isNotNull(screen.getByRole('link', { name: /buscar online/i }));
  });

  test('muestra JustWatch fallback cuando provider solo era Google Play Movies', () => {
    const obra = {
      title: 'Película solo Google',
      type: MEDIA_TYPES.MOVIE,
    };

    const providers = {
      link: '',
      flatrate: [
        {
          provider_id: 3,
          provider_name: 'Google Play Movies',
          logo_path: '/google.png',
        },
      ],
    };

    render(<WhereToFind obra={obra} providers={providers} />);

    const justWatch = screen.getByRole('link', { name: /justwatch/i });

    assert.isNotNull(justWatch);
    assert.include(
      justWatch.getAttribute('href'),
      'https://www.justwatch.com/mx/buscar'
    );
  });

  test('muestra búsqueda de Xbox cuando plataforma incluye Xbox One', () => {
    const obra = {
      title: 'Halo Infinite',
      type: MEDIA_TYPES.GAME,
      platforms: ['Xbox One'],
    };

    render(<WhereToFind obra={obra} />);

    assert.isNotNull(screen.getByText('XB1'));

    const link = screen.getByRole('link', { name: /xbox store/i });

    assert.isNotNull(link);
    assert.include(link.getAttribute('href'), 'xbox.com');
  });
});