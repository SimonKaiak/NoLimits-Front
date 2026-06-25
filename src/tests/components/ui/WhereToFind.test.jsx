import { render, screen, fireEvent } from '@testing-library/react';
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
  test('dispara onMouseEnter y onMouseLeave en links de compra', () => {
    const obra = {
      title: 'Juego hover',
      type: MEDIA_TYPES.GAME,
      linksCompra: [{ url: 'https://example.com', label: 'Tienda' }],
    };
    render(<WhereToFind obra={obra} />);
    const link = screen.getByRole('link', { name: /tienda/i });
    fireEvent.mouseEnter(link);
    fireEvent.mouseLeave(link);
    assert.isNotNull(link);
  });

  test('muestra linksCompra para película', () => {
    const obra = {
      title: 'Película con links',
      type: MEDIA_TYPES.MOVIE,
      linksCompra: [{ url: 'https://example.com/pelicula', label: 'Tienda Película' }],
    };
    render(<WhereToFind obra={obra} />);
    assert.isNotNull(screen.getByRole('link', { name: /tienda película/i }));
  });
  test('dispara onMouseEnter y onMouseLeave en LinkButton (anime)', () => {
    const obra = {
      title: 'Naruto hover',
      type: MEDIA_TYPES.ANIME,
    };
    render(<WhereToFind obra={obra} />);
    const link = screen.getByRole('link', { name: /crunchyroll/i });
    fireEvent.mouseEnter(link);
    fireEvent.mouseLeave(link);
    assert.isNotNull(link);
  });

  test('muestra linksCompra para serie', () => {
    const obra = {
      title: 'Serie con links',
      type: MEDIA_TYPES.SERIES,
      linksCompra: [{ url: 'https://example.com/serie', label: 'Tienda Serie' }],
    };
    render(<WhereToFind obra={obra} />);
    assert.isNotNull(screen.getByRole('link', { name: /tienda serie/i }));
  });
  test('dispara onMouseEnter y onMouseLeave en link de linksCompra de película', () => {
    const obra = {
      title: 'Película hover',
      type: MEDIA_TYPES.MOVIE,
      linksCompra: [{ url: 'https://example.com', label: 'Tienda Hover' }],
    };
    render(<WhereToFind obra={obra} />);
    const link = screen.getByRole('link', { name: /tienda hover/i });
    fireEvent.mouseEnter(link);
    fireEvent.mouseLeave(link);
    assert.isNotNull(link);
  });
  test('muestra plataformaNombre cuando label es null en linksCompra de película', () => {
    const obra = {
      title: 'Película plataforma',
      type: MEDIA_TYPES.MOVIE,
      linksCompra: [{ url: 'https://example.com', plataformaNombre: 'MiTienda' }],
    };
    render(<WhereToFind obra={obra} />);
    assert.isNotNull(screen.getByText('MiTienda'));
  });
  test('retorna linksCompra directamente para serie sin pasar por movie', () => {
    const obra = {
      title: 'Serie directa',
      type: MEDIA_TYPES.SERIES,
      linksCompra: [
        { url: 'https://example.com/s1', label: 'Link1Serie' },
        { url: 'https://example.com/s2', plataformaNombre: 'Link2Serie' },
      ],
    };
    render(<WhereToFind obra={obra} />);
    assert.isNotNull(screen.getByText('Link1Serie'));
    assert.isNotNull(screen.getByText('Link2Serie'));
  });
});