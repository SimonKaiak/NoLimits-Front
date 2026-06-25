import { describe, test, vi, beforeEach, assert } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

import AnimeCard from '@/components/cards/AnimeCard';

const obraMock = {
  id: 'jikan:anime:5114',
  type: 'anime',
  title: 'Fullmetal Alchemist',
  year: '2009',
  rating: '9.1',
  poster: '/poster-fma.jpg',
};

function renderAnimeCard(props = {}) {
  return render(
    <MemoryRouter>
      <AnimeCard obra={obraMock} {...props} />
    </MemoryRouter>
  );
}

describe('AnimeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockIsInList.mockReturnValue(false);
  });

  // ── Render básico ─────────────────────────────────────────────
  test('renderiza título, año, poster y rating', () => {
    renderAnimeCard();
    assert.isNotNull(screen.getByText('Fullmetal Alchemist'));
    assert.isNotNull(screen.getByText(/2009/));
    assert.equal(
      screen.getByAltText('Poster de Fullmetal Alchemist').getAttribute('src'),
      '/poster-fma.jpg'
    );
    assert.isNotNull(screen.getByText(/9.1/));
  });

  // ── Poster fallback (src null) ────────────────────────────────
  test('usa imagen fallback cuando poster es null', () => {
    render(
      <MemoryRouter>
        <AnimeCard obra={{ ...obraMock, poster: null }} />
      </MemoryRouter>
    );
    const img = screen.getByAltText('Poster de Fullmetal Alchemist');
    assert.include(img.getAttribute('src'), 'data:image/svg+xml');
  });

  // ── Poster fallback (onError) — línea 77 ─────────────────────
  test('usa imagen fallback cuando la imagen falla al cargar (onError)', () => {
    renderAnimeCard();
    const img = screen.getByAltText('Poster de Fullmetal Alchemist');
    fireEvent.error(img);
    assert.include(img.getAttribute('src'), 'data:image/svg+xml');
  });

  // ── Rating "—" oculta el overlay ──────────────────────────────
  test('no muestra el overlay de rating cuando rating es "—"', () => {
    render(
      <MemoryRouter>
        <AnimeCard obra={{ ...obraMock, rating: '—' }} />
      </MemoryRouter>
    );
    assert.isNull(screen.queryByText(/★/));
  });

  // ── Year "—" no muestra el año ────────────────────────────────
  test('no muestra el año cuando year es "—"', () => {
    render(
      <MemoryRouter>
        <AnimeCard obra={{ ...obraMock, year: '—' }} />
      </MemoryRouter>
    );
    assert.isNull(screen.queryByText(/2009/));
  });

  // ── onClick personalizado ─────────────────────────────────────
  test('ejecuta onClick personalizado al presionar la card', () => {
    const onClick = vi.fn();
    renderAnimeCard({ onClick });
    fireEvent.click(screen.getByRole('button', { name: 'Ver Fullmetal Alchemist' }));
    assert.deepEqual(onClick.mock.calls[0], [obraMock]);
  });

  // ── Navega al detalle por defecto ─────────────────────────────
  test('navega al detalle si no recibe onClick', () => {
    renderAnimeCard();
    fireEvent.click(screen.getByRole('button', { name: 'Ver Fullmetal Alchemist' }));
    assert.deepEqual(mockNavigate.mock.calls[0], ['/detail/jikan-anime-5114']);
  });

  // ── Enter navega ──────────────────────────────────────────────
  test('también navega al detalle al presionar Enter', () => {
    renderAnimeCard();
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Ver Fullmetal Alchemist' }),
      { key: 'Enter' }
    );
    assert.deepEqual(mockNavigate.mock.calls[0], ['/detail/jikan-anime-5114']);
  });

  // ── Otras teclas no navegan ───────────────────────────────────
  test('no navega al presionar una tecla que no es Enter', () => {
    renderAnimeCard();
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Ver Fullmetal Alchemist' }),
      { key: 'Space' }
    );
    assert.equal(mockNavigate.mock.calls.length, 0);
  });

  // ── hideFavoriteButton ────────────────────────────────────────
  test('oculta el botón de favoritos cuando hideFavoriteButton es true', () => {
    renderAnimeCard({ hideFavoriteButton: true });
    assert.isNull(screen.queryByLabelText('Agregar a favoritos'));
  });

  // ── isInList=false → "Agregar a favoritos" ───────────────────
  test('muestra "Agregar a favoritos" cuando la obra no está en la lista', () => {
    renderAnimeCard();
    assert.isNotNull(screen.getByLabelText('Agregar a favoritos'));
  });

  // ── isInList=true → "Quitar de favoritos" — cubre líneas 83-107
  test('muestra "Quitar de favoritos" cuando la obra está en la lista', () => {
    mockIsInList.mockReturnValue(true);
    renderAnimeCard();
    assert.isNotNull(screen.getByLabelText('Quitar de favoritos'));
  });

  // ── Sin sesión → alerta y redirige a login ────────────────────
  test('redirige a login si intenta guardar favorito sin sesión', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderAnimeCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], [
      'Debes iniciar sesión para guardar en favoritos',
    ]);
    assert.deepEqual(mockNavigate.mock.calls[0], ['/login']);
    alertMock.mockRestore();
  });

  // ── nl_auth inválido → false — línea 28 ──────────────────────
  test('rechaza sesión cuando nl_auth no es "1" ni "true"', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ id: 1, email: 'test@test.com' }));
    localStorage.setItem('nl_auth', 'invalid');
    renderAnimeCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], [
      'Debes iniciar sesión para guardar en favoritos',
    ]);
    alertMock.mockRestore();
  });

  // ── Con sesión válida (email) ─────────────────────────────────
  test('guarda en favoritos si existe sesión válida con email', () => {
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ id: 1, email: 'usuario@test.com' }));
    localStorage.setItem('nl_auth', '1');
    renderAnimeCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(mockToggleList.mock.calls[0], [obraMock]);
  });

  // ── Con sesión válida (correo) ────────────────────────────────
  test('guarda en favoritos si el usuario tiene campo "correo" en vez de "email"', () => {
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ correo: 'usuario@test.com' }));
    localStorage.setItem('nl_auth', 'true');
    renderAnimeCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(mockToggleList.mock.calls[0], [obraMock]);
  });

  // ── parsedUser sin id/correo/email → false — línea 32 ────────
  test('rechaza sesión si el usuario no tiene id, correo ni email', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ nombre: 'sin campos' }));
    localStorage.setItem('nl_auth', '1');
    renderAnimeCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], [
      'Debes iniciar sesión para guardar en favoritos',
    ]);
    alertMock.mockRestore();
  });

  // ── parsedUser.id truthy → true por cortocircuito — línea 32 ─
  test('guarda en favoritos si el usuario solo tiene campo "id"', () => {
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ id: 42 }));
    localStorage.setItem('nl_auth', '1');
    renderAnimeCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(mockToggleList.mock.calls[0], [obraMock]);
  });

  // ── nl_user JSON inválido → catch → false — línea 34 ─────────
  test('trata como sin sesión si nl_user tiene JSON inválido', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', '{esto-no-es-json}');
    localStorage.setItem('nl_auth', '1');
    renderAnimeCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], [
      'Debes iniciar sesión para guardar en favoritos',
    ]);
    alertMock.mockRestore();
  });
});