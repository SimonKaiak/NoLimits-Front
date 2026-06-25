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

import BookCard from '@/components/cards/BookCard';

const obraMock = {
  id: 'openlibrary:book:OL123',
  type: 'book',
  title: 'The Hobbit',
  year: '1937',
  rating: '4.8',
  poster: '/hobbit-cover.jpg',
  synopsis:
    'Bilbo Baggins vive una aventura inesperada junto a un grupo de enanos y el mago Gandalf.',
};

function renderBookCard(props = {}) {
  return render(
    <MemoryRouter>
      <BookCard obra={obraMock} {...props} />
    </MemoryRouter>
  );
}

describe('BookCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockIsInList.mockReturnValue(false);
  });

  test('renderiza título, año, portada, rating y sinopsis', () => {
    renderBookCard();
    assert.isNotNull(screen.getByText('The Hobbit'));
    assert.isNotNull(screen.getByText(/1937/));
    assert.equal(
      screen.getByAltText('Portada de The Hobbit').getAttribute('src'),
      '/hobbit-cover.jpg'
    );
    assert.isNotNull(screen.getByText(/4.8/));
    assert.isNotNull(screen.getByText(/Bilbo Baggins/));
  });

  test('ejecuta onClick personalizado al presionar la card', () => {
    const onClick = vi.fn();
    renderBookCard({ onClick });
    fireEvent.click(screen.getByRole('button', { name: 'Ver The Hobbit' }));
    assert.deepEqual(onClick.mock.calls[0], [obraMock]);
  });

  test('navega al detalle si no recibe onClick', () => {
    renderBookCard();
    fireEvent.click(screen.getByRole('button', { name: 'Ver The Hobbit' }));
    assert.deepEqual(mockNavigate.mock.calls[0], ['/detail/openlibrary-book-OL123']);
  });

  test('también navega al detalle al presionar Enter', () => {
    renderBookCard();
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Ver The Hobbit' }),
      { key: 'Enter' }
    );
    assert.deepEqual(mockNavigate.mock.calls[0], ['/detail/openlibrary-book-OL123']);
  });

  test('oculta el botón de favoritos cuando hideFavoriteButton es true', () => {
    renderBookCard({ hideFavoriteButton: true });
    assert.isNull(screen.queryByLabelText('Agregar a favoritos'));
  });

  // ── isInList=false → "Agregar a favoritos" ───────────────────
  test('muestra "Agregar a favoritos" cuando la obra no está en la lista', () => {
    renderBookCard();
    assert.isNotNull(screen.getByLabelText('Agregar a favoritos'));
  });

  // ── isInList=true → "Quitar de favoritos" — líneas 94-118 ────
  test('muestra "Quitar de favoritos" cuando la obra está en la lista', () => {
    mockIsInList.mockReturnValue(true);
    renderBookCard();
    assert.isNotNull(screen.getByLabelText('Quitar de favoritos'));
  });

  // ── poster null → fallback — línea 85 ────────────────────────
  test('usa imagen fallback cuando poster es null', () => {
    render(
      <MemoryRouter>
        <BookCard obra={{ ...obraMock, poster: null }} />
      </MemoryRouter>
    );
    const img = screen.getByAltText('Portada de The Hobbit');
    assert.include(img.getAttribute('src'), 'data:image/svg+xml');
  });

  // ── onError → fallback — línea 88 ────────────────────────────
  test('usa imagen fallback cuando la imagen falla al cargar (onError)', () => {
    renderBookCard();
    const img = screen.getByAltText('Portada de The Hobbit');
    fireEvent.error(img);
    assert.include(img.getAttribute('src'), 'data:image/svg+xml');
  });

  test('redirige a login si intenta guardar favorito sin sesión', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderBookCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], [
      'Debes iniciar sesión para guardar en favoritos',
    ]);
    assert.deepEqual(mockNavigate.mock.calls[0], ['/login']);
    alertMock.mockRestore();
  });

  // ── nl_auth inválido → false — línea 35 ──────────────────────
  test('rechaza sesión cuando nl_auth no es "1" ni "true"', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ id: 1, email: 'test@test.com' }));
    localStorage.setItem('nl_auth', 'invalid');
    renderBookCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], [
      'Debes iniciar sesión para guardar en favoritos',
    ]);
    alertMock.mockRestore();
  });

  test('guarda en favoritos si existe sesión válida', () => {
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ id: 1, email: 'usuario@test.com' }));
    localStorage.setItem('nl_auth', '1');
    renderBookCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(mockToggleList.mock.calls[0], [obraMock]);
  });

  // ── parsedUser.id truthy → cortocircuito — línea 39 ──────────
  test('guarda en favoritos si el usuario solo tiene campo "id"', () => {
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ id: 42 }));
    localStorage.setItem('nl_auth', '1');
    renderBookCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(mockToggleList.mock.calls[0], [obraMock]);
  });

  // ── parsedUser con correo — línea 39 ─────────────────────────
  test('guarda en favoritos si el usuario tiene campo "correo"', () => {
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ correo: 'usuario@test.com' }));
    localStorage.setItem('nl_auth', 'true');
    renderBookCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(mockToggleList.mock.calls[0], [obraMock]);
  });

  // ── parsedUser sin id/correo/email → false — línea 39 ────────
  test('rechaza sesión si el usuario no tiene id, correo ni email', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', JSON.stringify({ nombre: 'sin campos' }));
    localStorage.setItem('nl_auth', '1');
    renderBookCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], [
      'Debes iniciar sesión para guardar en favoritos',
    ]);
    alertMock.mockRestore();
  });

  // ── JSON inválido → catch → false — línea 41 ─────────────────
  test('trata como sin sesión si nl_user tiene JSON inválido', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('nl_token', 'token-falso');
    localStorage.setItem('nl_user', '{esto-no-es-json}');
    localStorage.setItem('nl_auth', '1');
    renderBookCard();
    fireEvent.click(screen.getByLabelText('Agregar a favoritos'));
    assert.deepEqual(alertMock.mock.calls[0], [
      'Debes iniciar sesión para guardar en favoritos',
    ]);
    alertMock.mockRestore();
  });
});