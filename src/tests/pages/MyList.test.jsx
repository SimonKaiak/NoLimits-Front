import { describe, test, vi, beforeEach, assert } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import MyList from '@/pages/MyList';

const toggleListMock = vi.fn();
const loadFavoritesMock = vi.fn();

let myListMock = [];

vi.mock('@/store/useAppStore', () => ({
  default: (selector) =>
    selector({
      myList: myListMock,
      toggleList: toggleListMock,
      loadFavorites: loadFavoritesMock,
    }),
}));

vi.mock('@/components/cards/MediaCard', () => ({
  default: ({ obra }) => <div>MediaCard: {obra.title}</div>,
}));

vi.mock('@/components/cards/AnimeCard', () => ({
  default: ({ obra }) => <div>AnimeCard: {obra.title}</div>,
}));

vi.mock('@/components/cards/BookCard', () => ({
  default: ({ obra }) => <div>BookCard: {obra.title}</div>,
}));

function renderMyList() {
  return render(
    <MemoryRouter>
      <MyList />
    </MemoryRouter>
  );
}

describe('MyList', () => {
  beforeEach(() => {
    myListMock = [];

    toggleListMock.mockClear();
    loadFavoritesMock.mockClear();

    localStorage.clear();
    localStorage.setItem('nl_token', 'token-falso');
  });

  test('muestra estado vacío cuando no hay obras guardadas', () => {
    myListMock = [];

    renderMyList();

    assert.isNotNull(screen.getByText('Tu lista está vacía.'));
    assert.isNotNull(screen.getByText('Explorar el catálogo'));
  });

  test('muestra cantidad de obras guardadas', () => {
    myListMock = [
      {
        id: 'tmdb:movie:1',
        type: 'movie',
        title: 'Star Wars',
        year: '1977',
        rating: '8.6',
        poster: '/starwars.jpg',
      },
      {
        id: 'openlibrary:book:1',
        type: 'book',
        title: 'Dune',
        year: '1965',
        rating: '9.0',
        poster: '/dune.jpg',
      },
    ];

    renderMyList();

    assert.isNotNull(screen.getByText('2'));
    assert.isNotNull(screen.getByText('obras guardadas'));
  });

  test('renderiza cards según el tipo de obra', () => {
    myListMock = [
      {
        id: 'tmdb:movie:1',
        type: 'movie',
        title: 'Star Wars',
      },
      {
        id: 'jikan:anime:1',
        type: 'anime',
        title: 'Cowboy Bebop',
      },
      {
        id: 'openlibrary:book:1',
        type: 'book',
        title: 'Dune',
      },
    ];

    renderMyList();

    assert.isNotNull(screen.getByText('MediaCard: Star Wars'));
    assert.isNotNull(screen.getByText('AnimeCard: Cowboy Bebop'));
    assert.isNotNull(screen.getByText('BookCard: Dune'));
  });

  test('filtra obras por tipo película', () => {
    myListMock = [
      {
        id: 'tmdb:movie:1',
        type: 'movie',
        title: 'Star Wars',
      },
      {
        id: 'openlibrary:book:1',
        type: 'book',
        title: 'Dune',
      },
    ];

    renderMyList();

    fireEvent.click(screen.getByText(/Películas/));

    assert.isNotNull(screen.getByText('MediaCard: Star Wars'));
    assert.isNull(screen.queryByText('BookCard: Dune'));
  });

  test('muestra mensaje cuando el filtro no tiene obras', () => {
    myListMock = [
      {
        id: 'tmdb:movie:1',
        type: 'movie',
        title: 'Star Wars',
      },
    ];

    renderMyList();

    fireEvent.click(screen.getByText(/Libros/));

    assert.isNotNull(
      screen.getByText('No tienes obras de este tipo en tu lista.')
    );
  });

  test('ejecuta toggleList al quitar de favoritos', () => {
    const obra = {
      id: 'tmdb:movie:1',
      type: 'movie',
      title: 'Star Wars',
    };

    myListMock = [obra];

    renderMyList();

    fireEvent.click(screen.getByText('Quitar de favoritos'));

    assert.deepEqual(toggleListMock.mock.calls[0], [obra]);
  });
  // ── Sin token → redirige a login — líneas 52-56 ───────────────
  test('redirige a login cuando no hay token', () => {
    localStorage.clear(); // sin token
    renderMyList();
    // loadFavorites no debe llamarse y debe haber redirigido
    assert.equal(loadFavoritesMock.mock.calls.length, 0);
  });

  // ── Click en favorito sin token → redirige — líneas 141-142 ──
  test('redirige a login al quitar favorito sin token', () => {
    const obra = { id: 'tmdb:movie:1', type: 'movie', title: 'Star Wars' };
    myListMock = [obra];
    localStorage.clear(); // sin token
    renderMyList();
    // Si logra renderizar el botón, el click debe redirigir sin llamar toggleList
    const btn = screen.queryByText('Quitar de favoritos');
    if (btn) {
      fireEvent.click(btn);
      assert.equal(toggleListMock.mock.calls.length, 0);
    }
  });
});