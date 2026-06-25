import { describe, test, vi, beforeEach, assert } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/components/sections/ContentSection', () => ({
  default: ({ title, obras, cardType }) => (
    <div data-testid="content-section">
      <span>{title}</span>
      <span data-testid="card-type">{cardType}</span>
      <span data-testid="obras-count">{obras?.length}</span>
    </div>
  ),
}));

vi.mock('@/store/useAppStore', () => ({
  default: vi.fn(),
}));

import useAppStore from '@/store/useAppStore';
import MyListSection from '@/components/sections/MyListSection';

function renderMyList() {
  return render(
    <MemoryRouter>
      <MyListSection />
    </MemoryRouter>
  );
}

describe('MyListSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Lista vacía ───────────────────────────────────────────────
  test('muestra mensaje vacío cuando no hay obras guardadas', () => {
    useAppStore.mockImplementation((selector) =>
      selector({ myList: [] })
    );
    renderMyList();
    assert.isNotNull(screen.getByText('MI BIBLIOTECA'));
    assert.isNotNull(screen.getByText('Explora el catálogo'));
  });

  // ── Con obras ─────────────────────────────────────────────────
  test('renderiza ContentSection cuando hay obras en la lista', () => {
    useAppStore.mockImplementation((selector) =>
      selector({
        myList: [
          { id: '1', title: 'Movie 1', type: 'movie' },
          { id: '2', title: 'Movie 2', type: 'movie' },
        ],
      })
    );
    renderMyList();
    assert.isNotNull(screen.getByTestId('content-section'));
    assert.isNotNull(screen.getByText('MI BIBLIOTECA · GUARDADOS RECIENTES'));
  });

  // ── cardType según tipo de la primera obra ────────────────────
  test('usa cardType "anime" cuando la primera obra es anime', () => {
    useAppStore.mockImplementation((selector) =>
      selector({
        myList: [{ id: '1', title: 'Naruto', type: 'anime' }],
      })
    );
    renderMyList();
    assert.equal(screen.getByTestId('card-type').textContent, 'anime');
  });

  test('usa cardType "book" cuando la primera obra es book', () => {
    useAppStore.mockImplementation((selector) =>
      selector({
        myList: [{ id: '1', title: 'Dune', type: 'book' }],
      })
    );
    renderMyList();
    assert.equal(screen.getByTestId('card-type').textContent, 'book');
  });

  test('usa cardType "media" para tipos distintos de anime y book', () => {
    useAppStore.mockImplementation((selector) =>
      selector({
        myList: [{ id: '1', title: 'Star Wars', type: 'movie' }],
      })
    );
    renderMyList();
    assert.equal(screen.getByTestId('card-type').textContent, 'media');
  });

  // ── Preview máximo 5 ─────────────────────────────────────────
  test('muestra máximo 5 obras aunque haya más', () => {
    useAppStore.mockImplementation((selector) =>
      selector({
        myList: Array.from({ length: 10 }, (_, i) => ({
          id: String(i), title: `Obra ${i}`, type: 'movie',
        })),
      })
    );
    renderMyList();
    assert.equal(screen.getByTestId('obras-count').textContent, '5');
  });
});