import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, test, vi, beforeEach, assert } from 'vitest';
import Detail from '@/pages/Detail';
import { parseMediaSlug } from '@/utils/formatters';
import { useMovieDetail } from '@/hooks/useTMDB';
import { obtenerProducto } from '@/services/productos';
import {
  guardarReview,
  obtenerReviewsPorObra,
  eliminarReview,
  reaccionarReview,
} from '@/services/reviewService';
import { useSagaSearch } from '@/hooks/useSearch';
import { fetchMovieProviders } from '@/services/whereToWatch';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    img: (props) => <img {...props} />,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
}));

vi.mock('@/components/ui/Badge', () => ({
  default: ({ type }) => <span>{type}</span>,
}));

vi.mock('@/components/ui/WhereToFind', () => ({
  default: () => <div data-testid="where-to-find">WhereToFind</div>,
}));

vi.mock('@/components/sections/ContentSection', () => ({
  default: () => <div data-testid="content-section">ContentSection</div>,
}));

vi.mock('@/utils/translateText', () => ({
  translateToSpanish: vi.fn(async (text) => text),
}));

vi.mock('@/utils/formatters', async () => {
  const actual = await vi.importActual('@/utils/formatters');
  return {
    ...actual,
    parseMediaSlug: vi.fn(() => ({
      source: 'tmdb',
      type: 'movie',
      nativeId: '123',
    })),
  };
});

vi.mock('@/hooks/useTMDB', () => ({
  useMovieDetail: vi.fn(() => ({
    data: {
      id: 'tmdb:movie:123',
      title: 'Interestelar',
      type: 'movie',
      poster: 'poster.jpg',
      backdrop: 'backdrop.jpg',
      rating: 9,
      year: 2014,
      genres: ['Ciencia ficción'],
      platforms: [],
      synopsis: 'Una película sobre viajes espaciales.',
      saga: null,
    },
    isLoading: false,
    error: null,
  })),
  useSeriesDetail: vi.fn(() => ({ data: null, isLoading: false, error: null })),
}));

vi.mock('@/hooks/useJikan', () => ({
  useAnimeDetail: vi.fn(() => ({ data: null, isLoading: false, error: null })),
}));

vi.mock('@/hooks/useRAWG', () => ({
  useGameDetail: vi.fn(() => ({ data: null, isLoading: false, error: null })),
}));

vi.mock('@/hooks/useOpenLibrary', () => ({
  useBookDetail: vi.fn(() => ({ data: null, isLoading: false, error: null })),
}));

vi.mock('@/hooks/useMusicBrainz', () => ({
  useMusicDetail: vi.fn(() => ({ data: null, isLoading: false, error: null })),
}));

vi.mock('@/services/whereToWatch', () => ({
  fetchMovieProviders: vi.fn(async () => null),
  fetchSeriesProviders: vi.fn(async () => null),
}));

vi.mock('@/hooks/useSearch', () => ({
  useSagaSearch: vi.fn(() => ({
    grouped: { movies: [], series: [], anime: [] },
    isLoading: false,
  })),
}));

vi.mock('@/services/productos', () => ({
  obtenerProducto: vi.fn(),
}));

vi.mock('@/services/reviewService', () => ({
  guardarReview: vi.fn(async () => ({})),
  obtenerReviewsPorObra: vi.fn(async () => []),
  eliminarReview: vi.fn(async () => ({})),
  reaccionarReview: vi.fn(async () => ({})),
}));

vi.mock('@/services/usuarios', () => ({
  agregarFavoritoUsuario: vi.fn(async () => ({})),
  eliminarFavoritoUsuario: vi.fn(async () => ({})),
}));

vi.mock('@/store/useAppStore', () => ({
  default: (selector) =>
    selector({
      isInList: () => false,
      toggleList: vi.fn(),
    }),
}));

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/detail/tmdb-movie-123']}>
      <Routes>
        <Route path="/detail/:mediaId" element={<Detail />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Detail - tests de regresión', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.alert = vi.fn();

    parseMediaSlug.mockReturnValue({
      source: 'tmdb',
      type: 'movie',
      nativeId: '123',
    });

    useMovieDetail.mockReturnValue({
      data: {
        id: 'tmdb:movie:123',
        title: 'Interestelar',
        type: 'movie',
        poster: 'poster.jpg',
        backdrop: 'backdrop.jpg',
        rating: 9,
        year: 2014,
        genres: ['Ciencia ficción'],
        platforms: [],
        synopsis: 'Una película sobre viajes espaciales.',
        saga: null,
      },
      isLoading: false,
      error: null,
    });

    obtenerReviewsPorObra.mockResolvedValue([]);
  });

  test('renderiza la información principal de la obra', async () => {
    renderDetail();

    assert.isNotNull(await screen.findByText('Interestelar'));
    assert.isNotNull(screen.getByText('Ciencia ficción'));
    assert.isNotNull(screen.getByText('2014'));
    assert.isNotNull(screen.getByText(/Una película sobre viajes espaciales/i));
    assert.isNotNull(screen.getByTestId('where-to-find'));
  });

  test('muestra mensaje cuando no existen reseñas', async () => {
    renderDetail();

    assert.isNotNull(
      await screen.findByText(/Todavía no hay reseñas para esta obra/i)
    );
  });

  test('redirige a login al intentar guardar favorito sin sesión', async () => {
    renderDetail();

    const button = await screen.findByRole('button', {
      name: /guardar en mi lista/i,
    });

    fireEvent.click(button);

    assert.deepEqual(window.alert.mock.calls[0], [
      'Debes iniciar sesión para guardar en favoritos',
    ]);

    await waitFor(() => {
      assert.isNotNull(screen.getByText('Login Page'));
    });
  });

  test('muestra skeleton mientras carga la obra', () => {
    useMovieDetail.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { container } = renderDetail();

    assert.isNotNull(container.querySelector('.nl-skeleton'));
  });

  test('muestra error cuando no se puede cargar la obra', () => {
    useMovieDetail.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Error detalle'),
    });

    renderDetail();

    assert.isNotNull(screen.getByText(/No se pudo cargar esta obra/i));
  });

  test('carga producto propio de NoLimits', async () => {
    parseMediaSlug.mockReturnValue({
      source: 'nolimits',
      type: 'producto',
      nativeId: '10',
    });

    obtenerProducto.mockResolvedValue({
      id: 10,
      nombre: 'Producto NoLimits',
      tipoProductoNombre: 'Videojuego',
      imagenes: ['poster-nl.jpg'],
      anio: 2024,
      generos: [{ nombre: 'Acción' }],
      plataformas: [{ nombre: 'PC' }],
      sinopsis: 'Sinopsis NoLimits',
      saga: 'Saga NoLimits',
      linksCompra: [],
    });

    renderDetail();

    assert.isNotNull(await screen.findByText('Producto NoLimits'));
    assert.isNotNull(screen.getByText('Acción'));
    assert.isNotNull(screen.getByText('PC'));
    assert.isNotNull(screen.getByText('2024'));
  });

  test('guarda reseña con sesión válida', async () => {
    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        id: 1,
        email: 'user@test.com',
      })
    );

    obtenerReviewsPorObra
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 1,
          contenido: 'Nueva reseña',
          nombreUsuario: 'Usuario',
          usuarioId: 1,
          fechaCreacion: '2024-01-01',
        },
      ]);

    renderDetail();

    const textarea = await screen.findByPlaceholderText(
      'Escribe tu opinión sobre esta obra…'
    );

    fireEvent.change(textarea, {
      target: { value: 'Nueva reseña' },
    });

    fireEvent.click(screen.getByText('Guardar reseña'));

    await waitFor(() => {
      assert.equal(guardarReview.mock.calls.length, 1);
    });

    assert.equal(guardarReview.mock.calls[0][0], 1);
    assert.include(guardarReview.mock.calls[0][1], {
      obraId: 'tmdb:movie:123',
      contenido: 'Nueva reseña',
      rating: 10,
    });
  });

  test('muestra reseñas existentes y permite reaccionar', async () => {
    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        id: 1,
        email: 'user@test.com',
      })
    );

    obtenerReviewsPorObra.mockResolvedValue([
      {
        id: 10,
        contenido: 'Muy buena película',
        nombreUsuario: 'Usuario Google',
        usuarioId: 2,
        fechaCreacion: '2024-01-01',
        likes: 2,
        dislikes: 1,
      },
    ]);

    renderDetail();

    assert.isNotNull(await screen.findByText('Muy buena película'));

    fireEvent.click(screen.getByText(/👍 2/));

    await waitFor(() => {
      assert.deepEqual(reaccionarReview.mock.calls[0], [10, 1, 'LIKE']);
    });
  });

  test('permite responder una reseña', async () => {
    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        id: 1,
        email: 'user@test.com',
      })
    );

    obtenerReviewsPorObra.mockResolvedValue([
      {
        id: 10,
        contenido: 'Comentario principal',
        nombreUsuario: 'Usuario',
        usuarioId: 2,
        fechaCreacion: '2024-01-01',
      },
    ]);

    renderDetail();

    assert.isNotNull(await screen.findByText('Comentario principal'));

    fireEvent.click(screen.getByText('Responder'));

    fireEvent.change(screen.getByPlaceholderText('Escribe una respuesta…'), {
      target: { value: 'Mi respuesta' },
    });

    fireEvent.click(screen.getByText('Publicar respuesta'));

    await waitFor(() => {
      assert.equal(guardarReview.mock.calls.length, 1);
    });

    assert.include(guardarReview.mock.calls[0][1], {
      obraId: 'tmdb:movie:123',
      contenido: 'Mi respuesta',
      parentReviewId: 10,
    });
  });

  test('permite editar y eliminar reseña propia', async () => {
    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        id: 1,
        email: 'user@test.com',
      })
    );

    obtenerReviewsPorObra.mockResolvedValue([
      {
        id: 20,
        contenido: 'Reseña propia',
        nombreUsuario: 'Usuario',
        usuarioId: 1,
        fechaCreacion: '2024-01-01',
      },
    ]);

    renderDetail();

    assert.isNotNull(await screen.findByText('Reseña propia'));

    fireEvent.click(screen.getByText('Editar reseña'));

    fireEvent.change(screen.getByDisplayValue('Reseña propia'), {
      target: { value: 'Reseña editada' },
    });

    fireEvent.click(screen.getByText('Guardar'));

    await waitFor(() => {
      assert.equal(guardarReview.mock.calls.length, 1);
    });

    assert.include(guardarReview.mock.calls[0][1], {
      reviewId: 20,
      contenido: 'Reseña editada',
    });

    fireEvent.click(screen.getByText('Eliminar reseña'));

    await waitFor(() => {
      assert.deepEqual(eliminarReview.mock.calls[0], [1, 20]);
    });
  });

  test('redirige a login al intentar guardar reseña sin sesión', async () => {
    renderDetail();

    const textarea = await screen.findByPlaceholderText(
      'Escribe tu opinión sobre esta obra…'
    );

    fireEvent.change(textarea, {
      target: { value: 'Reseña sin sesión' },
    });

    fireEvent.click(screen.getByText('Guardar reseña'));

    assert.deepEqual(window.alert.mock.calls[0], [
      'Debes iniciar sesión para guardar reseñas',
    ]);

    await waitFor(() => {
      assert.isNotNull(screen.getByText('Login Page'));
    });
  });

  test('muestra alerta si intenta guardar reseña sin usuario identificable', async () => {
    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        email: 'usuario@test.com',
      })
    );

    renderDetail();

    const textarea = await screen.findByPlaceholderText(
      'Escribe tu opinión sobre esta obra…'
    );

    fireEvent.change(textarea, {
      target: { value: 'Reseña sin id' },
    });

    fireEvent.click(screen.getByText('Guardar reseña'));

    assert.deepEqual(window.alert.mock.calls[0], [
      'No se pudo identificar tu usuario.',
    ]);
  });

  test('redirige a login al intentar responder sin sesión', async () => {
    obtenerReviewsPorObra.mockResolvedValue([
      {
        id: 30,
        contenido: 'Comentario para responder',
        nombreUsuario: 'Usuario',
        usuarioId: 2,
        fechaCreacion: '2024-01-01',
      },
    ]);

    renderDetail();

    assert.isNotNull(await screen.findByText('Comentario para responder'));

    fireEvent.click(screen.getByText('Responder'));

    fireEvent.change(screen.getByPlaceholderText('Escribe una respuesta…'), {
      target: { value: 'Respuesta sin sesión' },
    });

    fireEvent.click(screen.getByText('Publicar respuesta'));

    assert.deepEqual(window.alert.mock.calls[0], [
      'Debes iniciar sesión para responder comentarios',
    ]);

    await waitFor(() => {
      assert.isNotNull(screen.getByText('Login Page'));
    });
  });

  test('muestra y oculta respuestas de una reseña', async () => {
    obtenerReviewsPorObra.mockResolvedValue([
      {
        id: 40,
        contenido: 'Comentario con respuesta',
        nombreUsuario: 'Usuario Principal',
        usuarioId: 2,
        fechaCreacion: '2024-01-01',
      },
      {
        id: 41,
        rootReviewId: 40,
        parentReviewId: 40,
        contenido: 'Respuesta visible',
        nombreUsuario: 'Usuario Respuesta',
        usuarioId: 3,
        fechaCreacion: '2024-01-02',
      },
    ]);

    renderDetail();

    assert.isNotNull(await screen.findByText('Comentario con respuesta'));

    fireEvent.click(screen.getByText('1 respuesta ▼'));

    assert.isNotNull(screen.getByText('Respuesta visible'));

    fireEvent.click(screen.getByText('Ocultar respuestas ▲'));

    await waitFor(() => {
      assert.isNull(screen.queryByText('Respuesta visible'));
    });
  });

  test('permite editar y eliminar una respuesta propia', async () => {
    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        id: 1,
        email: 'user@test.com',
      })
    );

    obtenerReviewsPorObra.mockResolvedValue([
      {
        id: 50,
        contenido: 'Comentario padre',
        nombreUsuario: 'Usuario Padre',
        usuarioId: 2,
        fechaCreacion: '2024-01-01',
      },
      {
        id: 51,
        rootReviewId: 50,
        parentReviewId: 50,
        contenido: 'Respuesta propia',
        nombreUsuario: 'Usuario Propio',
        usuarioId: 1,
        fechaCreacion: '2024-01-02',
      },
    ]);

    renderDetail();

    assert.isNotNull(await screen.findByText('Comentario padre'));

    fireEvent.click(screen.getByText('1 respuesta ▼'));

    assert.isNotNull(screen.getByText('Respuesta propia'));

    fireEvent.click(screen.getByText('Editar'));

    fireEvent.change(screen.getByDisplayValue('Respuesta propia'), {
      target: { value: 'Respuesta editada' },
    });

    fireEvent.click(screen.getByText('Guardar cambios'));

    await waitFor(() => {
      assert.equal(guardarReview.mock.calls.length, 1);
    });

    assert.include(guardarReview.mock.calls[0][1], {
      reviewId: 51,
      contenido: 'Respuesta editada',
      parentReviewId: null,
    });

    fireEvent.click(screen.getByText('Eliminar'));

    await waitFor(() => {
      assert.deepEqual(eliminarReview.mock.calls[0], [1, 51]);
    });
  });

  test('muestra alerta si intenta reaccionar sin sesión', async () => {
    obtenerReviewsPorObra.mockResolvedValue([
      {
        id: 60,
        contenido: 'Comentario sin login',
        nombreUsuario: 'Usuario',
        usuarioId: 2,
        fechaCreacion: '2024-01-01',
        likes: 0,
        dislikes: 0,
      },
    ]);

    renderDetail();

    assert.isNotNull(await screen.findByText('Comentario sin login'));

    fireEvent.click(screen.getByText(/👍 0/));

    assert.deepEqual(window.alert.mock.calls[0], [
      'Debes iniciar sesión para reaccionar a una reseña',
    ]);

    await waitFor(() => {
      assert.isNotNull(screen.getByText('Login Page'));
    });
  });

  test('guarda favorito con sesión válida', async () => {
    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        id: 1,
        email: 'user@test.com',
      })
    );

    renderDetail();

    const button = await screen.findByRole('button', {
      name: /guardar en mi lista/i,
    });

    fireEvent.click(button);

    await waitFor(() => {
      assert.isTrue(window.alert.mock.calls.length === 0);
    });
  });

  test('muestra alerta si intenta guardar favorito sin usuario identificable', async () => {
    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        email: 'user@test.com',
      })
    );

    renderDetail();

    const button = await screen.findByRole('button', {
      name: /guardar en mi lista/i,
    });

    fireEvent.click(button);

    assert.deepEqual(window.alert.mock.calls[0], [
      'No se pudo identificar tu usuario. Cierra sesión e inicia sesión otra vez.',
    ]);
  });

  test('muestra alerta si falla guardar una nueva reseña', async () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        id: 1,
        email: 'user@test.com',
      })
    );

    guardarReview.mockRejectedValueOnce(new Error('Error review'));

    renderDetail();

    const textarea = await screen.findByPlaceholderText(
      'Escribe tu opinión sobre esta obra…'
    );

    fireEvent.change(textarea, {
      target: { value: 'Reseña con error' },
    });

    fireEvent.click(screen.getByText('Guardar reseña'));

    await waitFor(() => {
      assert.deepEqual(window.alert.mock.calls[0], [
        'No se pudo guardar la reseña',
      ]);
    });

    errorMock.mockRestore();
  });

  test('muestra alerta si falla responder comentario', async () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        id: 1,
        email: 'user@test.com',
      })
    );

    obtenerReviewsPorObra.mockResolvedValue([
      {
        id: 70,
        contenido: 'Comentario con error',
        nombreUsuario: 'Usuario',
        usuarioId: 2,
        fechaCreacion: '2024-01-01',
      },
    ]);

    guardarReview.mockRejectedValueOnce(new Error('Error respuesta'));

    renderDetail();

    assert.isNotNull(await screen.findByText('Comentario con error'));

    fireEvent.click(screen.getByText('Responder'));

    fireEvent.change(screen.getByPlaceholderText('Escribe una respuesta…'), {
      target: { value: 'Respuesta con error' },
    });

    fireEvent.click(screen.getByText('Publicar respuesta'));

    await waitFor(() => {
      assert.deepEqual(window.alert.mock.calls[0], [
        'No se pudo responder el comentario',
      ]);
    });

    errorMock.mockRestore();
  });

  test('muestra alerta si falla eliminar reseña', async () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        id: 1,
        email: 'user@test.com',
      })
    );

    obtenerReviewsPorObra.mockResolvedValue([
      {
        id: 80,
        contenido: 'Reseña con error al eliminar',
        nombreUsuario: 'Usuario',
        usuarioId: 1,
        fechaCreacion: '2024-01-01',
      },
    ]);

    eliminarReview.mockRejectedValueOnce(new Error('Error eliminar'));

    renderDetail();

    assert.isNotNull(await screen.findByText('Reseña con error al eliminar'));

    fireEvent.click(screen.getByText('Eliminar reseña'));

    await waitFor(() => {
      assert.deepEqual(window.alert.mock.calls[0], [
        'No se pudo eliminar la reseña',
      ]);
    });

    errorMock.mockRestore();
  });

  test('muestra alerta si falla reaccionar reseña', async () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        id: 1,
        email: 'user@test.com',
      })
    );

    obtenerReviewsPorObra.mockResolvedValue([
      {
        id: 90,
        contenido: 'Reseña con error al reaccionar',
        nombreUsuario: 'Usuario',
        usuarioId: 2,
        fechaCreacion: '2024-01-01',
        likes: 0,
        dislikes: 0,
      },
    ]);

    reaccionarReview.mockRejectedValueOnce(new Error('Error reaccion'));

    renderDetail();

    assert.isNotNull(await screen.findByText('Reseña con error al reaccionar'));

    fireEvent.click(screen.getByText(/👎 0/));

    await waitFor(() => {
      assert.deepEqual(window.alert.mock.calls[0], [
        'No se pudo registrar la reacción',
      ]);
    });

    errorMock.mockRestore();
  });

  test('muestra error si falla cargar producto propio de NoLimits', async () => {
    parseMediaSlug.mockReturnValue({
      source: 'nolimits',
      type: 'producto',
      nativeId: '99',
    });

    obtenerProducto.mockRejectedValue(new Error('Producto no encontrado'));

    renderDetail();

    assert.isNotNull(
      await screen.findByText(/No se pudo cargar esta obra/i)
    );
  });

  test('renderiza saga relacionada y permite navegar a la saga', async () => {
    useMovieDetail.mockReturnValue({
      data: {
        id: 'tmdb:movie:123',
        title: 'Star Wars',
        type: 'movie',
        poster: 'poster.jpg',
        backdrop: 'backdrop.jpg',
        rating: 9,
        year: 1977,
        genres: ['Ciencia ficción'],
        platforms: [],
        synopsis: 'Una película espacial.',
        saga: 'Star Wars',
      },
      isLoading: false,
      error: null,
    });

    useSagaSearch.mockReturnValue({
      grouped: {
        movies: [
          {
            id: 'tmdb:movie:1',
            title: 'Star Wars Episodio IV',
            type: 'movie',
          },
        ],
        series: [],
        anime: [],
      },
      isLoading: false,
    });

    renderDetail();

    assert.isAtLeast((await screen.findAllByText('Star Wars')).length, 2);
    assert.isNotNull(screen.getByText('Más de la saga'));
    assert.isNotNull(screen.getByTestId('content-section'));

    fireEvent.click(screen.getAllByText('Star Wars')[1]);
  });

  test('muestra alerta si las reseñas no se pueden cargar', async () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    obtenerReviewsPorObra.mockRejectedValueOnce(new Error('Error cargando'));

    renderDetail();

    await waitFor(() => {
      assert.deepEqual(console.error.mock.calls[0], [
        'Error cargando reseñas:',
        new Error('Error cargando'),
      ]);
    });

    errorMock.mockRestore();
  });

  test('muestra alerta si intenta eliminar review sin usuario identificable', async () => {
    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        email: 'user@test.com',
      })
    );

    obtenerReviewsPorObra.mockResolvedValue([
      {
        id: 110,
        contenido: 'Review propia sin usuario',
        nombreUsuario: 'Usuario',
        usuarioId: undefined,
        fechaCreacion: '2024-01-01',
      },
    ]);

    renderDetail();

    assert.isNotNull(await screen.findByText('Review propia sin usuario'));

    fireEvent.click(screen.getByText('Eliminar reseña'));

    assert.deepEqual(window.alert.mock.calls[0], [
      'No se pudo identificar el usuario',
    ]);
  });

  test('muestra alerta si intenta reaccionar con sesión sin usuario identificable', async () => {
    localStorage.setItem('nl_token', 'token');
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem(
      'nl_user',
      JSON.stringify({
        email: 'user@test.com',
      })
    );

    obtenerReviewsPorObra.mockResolvedValue([
      {
        id: 120,
        contenido: 'Review para reacción sin usuario',
        nombreUsuario: 'Usuario',
        usuarioId: 2,
        fechaCreacion: '2024-01-01',
        likes: 0,
        dislikes: 0,
      },
    ]);

    renderDetail();

    assert.isNotNull(await screen.findByText('Review para reacción sin usuario'));

    fireEvent.click(screen.getByText(/👍 0/));

    assert.deepEqual(window.alert.mock.calls[0], [
      'Debes iniciar sesión',
    ]);
  });

  test('muestra error cuando el tipo de media no es soportado', () => {
    parseMediaSlug.mockReturnValue({
      source: 'desconocido',
      type: 'otro',
      nativeId: '999',
    });

    renderDetail();

    assert.isNotNull(screen.getByText(/No se pudo cargar esta obra/i));
    assert.isNotNull(screen.getByText(/desconocido\/otro\/999/i));
  });

  test('renderiza providers de streaming cuando existen opciones', async () => {
    parseMediaSlug.mockReturnValue({
      source: 'tmdb',
      type: 'movie',
      nativeId: '123',
    });

    fetchMovieProviders.mockResolvedValueOnce({
      flatrate: [
        {
          provider_id: 8,
          provider_name: 'Netflix',
          logo_path: '/netflix.png',
        },
      ],
      link: 'https://www.justwatch.com',
    });

    renderDetail();

    assert.isNotNull(await screen.findByText('Netflix'));
    assert.isNotNull(screen.getByText('Streaming'));
  });

  test('carga producto NoLimits usando imagen simple, géneros string y sinopsis por defecto', async () => {
    parseMediaSlug.mockReturnValue({
      source: 'nolimits',
      type: 'producto',
      nativeId: '11',
    });

    obtenerProducto.mockResolvedValue({
      id: 11,
      nombre: 'Producto Simple',
      tipoProductoNombre: null,
      imagen: 'producto.jpg',
      anio: null,
      generos: ['Drama'],
      plataformas: ['Web'],
      sinopsis: '',
      saga: null,
      linksCompra: [],
    });

    renderDetail();

    assert.isNotNull(await screen.findByText('Producto Simple'));
    assert.isNotNull(screen.getByText('Drama'));
    assert.isNotNull(screen.getByText('Web'));
    assert.isNotNull(screen.getByText('—'));
    assert.isNotNull(screen.getByText(/Sin sinopsis disponible/i));
  });
});