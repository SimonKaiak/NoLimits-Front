import { describe, test, vi, beforeEach, assert } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/services/usuarios', () => ({
  agregarFavoritoUsuario: vi.fn(),
  eliminarFavoritoUsuario: vi.fn(),
}));

const mockNavigate = vi.fn();
const mockToggleList = vi.fn();
const mockIsInList = vi.fn(() => false);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/store/useAppStore', () => ({
  default: (selector) =>
    selector({
      isInList: mockIsInList,
      toggleList: mockToggleList,
    }),
}));

import MediaCard from '@/components/cards/MediaCard';

const obraMock = {
  id: 'tmdb:movie:1893',
  type: 'movie',
  title: 'Star Wars',
  year: '1977',
  rating: '8.6',
  poster: '/poster-star-wars.jpg',
};

function renderMediaCard(props = {}) {
  return render(
    <MemoryRouter>
      <MediaCard obra={obraMock} {...props} />
    </MemoryRouter>
  );
}

describe('MediaCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockIsInList.mockReturnValue(false);
  });

  test('renderiza título, año, poster y rating', () => {
    renderMediaCard();
    assert.isNotNull(screen.getByText('Star Wars'));
    assert.isNotNull(screen.getByText(/1977/));
    assert.equal(
      screen.getByAltText('Poster de Star Wars').getAttribute('src'),
      '/poster-star-wars.jpg'
    );
    assert.isNotNull(screen.getByText(/8.6/));
  });

  test('ejecuta onClick personalizado al presionar la card', () => {
    const onClick = vi.fn();
    renderMediaCard({ onClick });
    fireEvent.click(screen.getByRole('button', { name: 'Ver Star Wars' }));
    assert.deepEqual(onClick.mock.calls[0], [obraMock]);
  });

  test('navega al detalle si no recibe onClick', () => {
    renderMediaCard();
    fireEvent.click(screen.getByRole('button', { name: 'Ver Star Wars' }));
    assert.deepEqual(mockNavigate.mock.calls[0], ['/detail/tmdb-movie-1893']);
  });

  test('también navega al detalle al presionar Enter', () => {
    renderMediaCard();
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Ver Star Wars' }),
      { key: 'Enter' }
    );
    assert.deepEqual(mockNavigate.mock.calls[0], ['/detail/tmdb-movie-1893']);
  });

  // ── Otras teclas no navegan — línea 99 ───────────────────────
  test('no navega al presionar una tecla que no es Enter', () => {
    renderMediaCard();
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Ver Star Wars' }),
      { key: 'Space' }
    );
    assert.equal(mockNavigate.mock.calls.length, 0);
  });

  test('oculta el botón de favoritos cuando hideFavoriteButton es true', () => {
    renderMediaCard({ hideFavoriteButton: true });
    assert.isNull(screen.queryByLabelText('Agregar a favoritos'));
  });

  // ── isInList=false → "Agregar a favoritos" ───────────────────
  test('muestra "Agregar a favoritos" cuando la obra no está en la lista', () => {
    renderMediaCard();
    assert.isNotNull(screen.getByLabelText('Agregar a favoritos'));
  });

  // ── isInList=true → "Quitar de favoritos" — líneas 115-139 ───
  test('muestra "Quitar de favoritos" cuando la obra está en la lista', () => {
    mockIsInList.mockReturnValue(true);
    renderMediaCard();
    assert.isNotNull(screen.getByLabelText('Quitar de favoritos'));
  });

  // ── poster null → fallback — línea 105 ───────────────────────
  test('usa imagen fallback cuando poster es null', () => {
    render(
      <MemoryRouter>
        <MediaCard obra={{ ...obraMock, poster: null }} />
      </MemoryRouter>
    );
    const img = screen.getByAltText('Poster de Star Wars');
    assert.include(img.getAttribute('src'), 'data:image/svg+xml');
  });

  test('usa fallback cuando falla la imagen', () => {
    renderMediaCard();
    const img = screen.getByAltText('Poster de Star Wars');
    fireEvent.error(img);
    assert.include(img.getAttribute('src'), 'data:image/svg+xml');
  });

  test('redirige a login si intenta guardar favorito sin sesión', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderMediaCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], ['Debes iniciar sesión para guardar en favoritos']);
    assert.deepEqual(mockNavigate.mock.calls[0], ['/login']);
    alertMock.mockRestore();
  });

  // ── nl_auth inválido → false — línea 34 ──────────────────────
  test('rechaza sesión cuando nl_auth no es "1" ni "true"', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ id: 1, email: 'test@test.com' }));
    localStorage.setItem('nl_auth', 'invalid');
    renderMediaCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], ['Debes iniciar sesión para guardar en favoritos']);
    alertMock.mockRestore();
  });

  // ── JSON inválido → catch → false — línea 40 ─────────────────
  test('trata como sin sesión si nl_user tiene JSON inválido', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', '{esto-no-es-json}');
    localStorage.setItem('nl_auth', '1');
    renderMediaCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], ['Debes iniciar sesión para guardar en favoritos']);
    alertMock.mockRestore();
  });

  test('guarda en favoritos si existe sesión válida', () => {
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ id: 1, email: 'usuario@test.com' }));
    localStorage.setItem('nl_auth', '1');
    renderMediaCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(mockToggleList.mock.calls[0], [obraMock]);
  });

  // ── parsedUser.id truthy → cortocircuito — línea 38 ──────────
  test('guarda en favoritos si el usuario solo tiene campo "id"', () => {
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ id: 42 }));
    localStorage.setItem('nl_auth', '1');
    renderMediaCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(mockToggleList.mock.calls[0], [obraMock]);
  });

  // ── parsedUser sin id/correo/email → false — línea 38 ────────
  test('rechaza sesión si el usuario no tiene id, correo ni email', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ nombre: 'sin campos' }));
    localStorage.setItem('nl_auth', '1');
    renderMediaCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], ['Debes iniciar sesión para guardar en favoritos']);
    alertMock.mockRestore();
  });

  test('muestra alerta si no puede identificar usuario', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ email: 'usuario@test.com' }));
    localStorage.setItem('nl_auth', '1');
    renderMediaCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], [
      'No se pudo identificar tu usuario. Cierra sesión e inicia sesión otra vez.',
    ]);
    assert.equal(mockToggleList.mock.calls.length, 0);
    alertMock.mockRestore();
  });

  // ── nl_user null en handleSave → || "null" — línea 60 ───────
  test('usa "null" cuando nl_user no existe al momento de guardar', () => {
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ id: 1, email: 'test@test.com' }));
    localStorage.setItem('nl_auth', '1');
    localStorage.setItem('nl_userId', '99');
    renderMediaCard();

    // isLoggedIn() llama getItem("nl_user") 1 vez (línea 29)
    // handleSave línea 60 lo llama una 2da vez → esa debe retornar null
    let nlUserCallCount = 0;
    const originalGetItem = localStorage.getItem.bind(localStorage);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'nl_user') {
        nlUserCallCount++;
        if (nlUserCallCount === 2) return null; // 2da llamada → activa || "null"
      }
      return originalGetItem(key);
    });

    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));

    // user=null → usuarioId = nl_userId = '99' → toggleList se llama
    assert.deepEqual(mockToggleList.mock.calls[0], [obraMock]);

    vi.restoreAllMocks();
  });

  // ── toggleList lanza error → catch — líneas 82-83 ─────────────
  test('muestra alerta cuando toggleList lanza un error', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    mockToggleList.mockImplementation(() => { throw new Error('Store error'); });
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ id: 1, email: 'usuario@test.com' }));
    localStorage.setItem('nl_auth', '1');
    renderMediaCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], ['No se pudo actualizar favoritos']);
    alertMock.mockRestore();
  });

  test('no muestra rating cuando rating es guion', () => {
    renderMediaCard({ obra: { ...obraMock, rating: '—' } });
    assert.isNull(screen.queryByText(/8.6/));
  });

  test('renderiza sin año visible cuando year es guion', () => {
    renderMediaCard({ obra: { ...obraMock, year: '—' } });
    assert.isNull(screen.queryByText(/1977/));
  });

  test('aplica estilo especial cuando el tipo es game', () => {
    renderMediaCard({ obra: { ...obraMock, type: 'game' } });
    const img = screen.getByAltText('Poster de Star Wars');
    assert.include(img.getAttribute('style'), 'aspect-ratio: 4/3');
  });
});