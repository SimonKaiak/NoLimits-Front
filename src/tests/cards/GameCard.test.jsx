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

import GameCard from '@/components/cards/GameCard';

const obraMock = {
  id: 'rawg:game:3498',
  type: 'game',
  title: 'Grand Theft Auto V',
  year: '2013',
  rating: '4.7',
  poster: '/gta-v.jpg',
};

function renderGameCard(props = {}) {
  return render(
    <MemoryRouter>
      <GameCard obra={obraMock} {...props} />
    </MemoryRouter>
  );
}

describe('GameCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsInList.mockReturnValue(false);
  });

  test('renderiza título, año, poster y rating', () => {
    renderGameCard();
    assert.isNotNull(screen.getByText('Grand Theft Auto V'));
    assert.isNotNull(screen.getByText(/2013/));
    assert.equal(
      screen.getByAltText('Poster de Grand Theft Auto V').getAttribute('src'),
      '/gta-v.jpg'
    );
    assert.isNotNull(screen.getByText(/4.7/));
  });

  test('ejecuta onClick personalizado', () => {
    const onClick = vi.fn();
    renderGameCard({ onClick });
    fireEvent.click(screen.getByRole('button', { name: 'Ver Grand Theft Auto V' }));
    assert.deepEqual(onClick.mock.calls[0], [obraMock]);
  });

  test('navega al detalle si no recibe onClick', () => {
    renderGameCard();
    fireEvent.click(screen.getByRole('button', { name: 'Ver Grand Theft Auto V' }));
    assert.deepEqual(mockNavigate.mock.calls[0], ['/detail/rawg-game-3498']);
  });

  test('navega al detalle al presionar Enter', () => {
    renderGameCard();
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Ver Grand Theft Auto V' }),
      { key: 'Enter' }
    );
    assert.deepEqual(mockNavigate.mock.calls[0], ['/detail/rawg-game-3498']);
  });

  // ── Otras teclas no navegan ───────────────────────────────────
  test('no navega al presionar una tecla que no es Enter', () => {
    renderGameCard();
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Ver Grand Theft Auto V' }),
      { key: 'Space' }
    );
    assert.equal(mockNavigate.mock.calls.length, 0);
  });

  // ── isInList=false → "Guardar en mi lista" + BookmarkPlus ─────
  test('muestra "Guardar en mi lista" cuando no está en lista', () => {
    renderGameCard();
    assert.isNotNull(screen.getByLabelText('Guardar en mi lista'));
  });

  test('guarda en mi lista al hacer click en el botón', () => {
    renderGameCard();
    fireEvent.click(screen.getByLabelText('Guardar en mi lista'));
    assert.deepEqual(mockToggleList.mock.calls[0], [obraMock]);
  });

  // ── isInList=true → "Quitar de mi lista" + BookmarkCheck — líneas 86-89
  test('muestra "Quitar de mi lista" cuando ya está en lista', () => {
    mockIsInList.mockReturnValue(true);
    renderGameCard();
    assert.isNotNull(screen.getByLabelText('Quitar de mi lista'));
  });

  // ── poster null → fallback — línea 53 ────────────────────────
  test('usa imagen fallback cuando poster es null', () => {
    render(
      <MemoryRouter>
        <GameCard obra={{ ...obraMock, poster: null }} />
      </MemoryRouter>
    );
    const img = screen.getByAltText('Poster de Grand Theft Auto V');
    assert.include(img.getAttribute('src'), 'data:image/svg+xml');
  });

  // ── onError → fallback — línea 57 ────────────────────────────
  test('usa imagen fallback cuando la imagen falla al cargar (onError)', () => {
    renderGameCard();
    const img = screen.getByAltText('Poster de Grand Theft Auto V');
    fireEvent.error(img);
    assert.include(img.getAttribute('src'), 'data:image/svg+xml');
  });

  // ── rating "—" → oculta overlay — línea 59 ───────────────────
  test('no muestra rating cuando rating es "—"', () => {
    render(
      <MemoryRouter>
        <GameCard obra={{ ...obraMock, rating: '—' }} />
      </MemoryRouter>
    );
    assert.isNull(screen.queryByText(/★/));
  });

  // ── year "—" → no muestra año — línea 82 ─────────────────────
  test('no muestra el año cuando year es "—"', () => {
    render(
      <MemoryRouter>
        <GameCard obra={{ ...obraMock, year: '—' }} />
      </MemoryRouter>
    );
    assert.isNull(screen.queryByText(/2013/));
  });
});