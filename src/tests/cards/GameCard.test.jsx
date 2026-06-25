import { describe, test, vi, beforeEach, assert } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import GameCard from '@/components/cards/GameCard';

const mockNavigate = vi.fn();
const mockToggleList = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/store/useAppStore', () => ({
  default: (selector) =>
    selector({
      isInList: () => false,
      toggleList: mockToggleList,
    }),
}));

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

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ver Grand Theft Auto V',
      })
    );

    assert.deepEqual(onClick.mock.calls[0], [obraMock]);
  });

  test('navega al detalle si no recibe onClick', () => {
    renderGameCard();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ver Grand Theft Auto V',
      })
    );

    assert.deepEqual(mockNavigate.mock.calls[0], ['/detail/rawg-game-3498']);
  });

  test('navega al detalle al presionar Enter', () => {
    renderGameCard();

    fireEvent.keyDown(
      screen.getByRole('button', {
        name: 'Ver Grand Theft Auto V',
      }),
      {
        key: 'Enter',
      }
    );

    assert.deepEqual(mockNavigate.mock.calls[0], ['/detail/rawg-game-3498']);
  });

  test('guarda en mi lista al hacer click en el botón', () => {
    renderGameCard();

    fireEvent.click(screen.getByLabelText('Guardar en mi lista'));

    assert.deepEqual(mockToggleList.mock.calls[0], [obraMock]);
  });

    test('usa imagen fallback cuando poster es null', () => {
    renderGameCard({
      obra: {
        ...obraMock,
        poster: null,
      },
    });

    const img = screen.getByAltText(
      'Poster de Grand Theft Auto V'
    );

    assert.include(
      img.getAttribute('src'),
      'data:image/svg+xml'
    );
  });

  test('reemplaza imagen por fallback cuando ocurre error', () => {
    renderGameCard();

    const img = screen.getByAltText(
      'Poster de Grand Theft Auto V'
    );

    fireEvent.error(img);

    assert.include(
      img.getAttribute('src'),
      'data:image/svg+xml'
    );
  });

  test('no muestra rating cuando rating es guion', () => {
    renderGameCard({
      obra: {
        ...obraMock,
        rating: '—',
      },
    });

    assert.isNull(
      screen.queryByText(/★/)
    );
  });

  test('no muestra año cuando year es guion', () => {
    renderGameCard({
      obra: {
        ...obraMock,
        year: '—',
      },
    });

    assert.isNull(
      screen.queryByText('2013')
    );
  });

  test('no navega cuando se presiona una tecla distinta de Enter', () => {
    renderGameCard();

    fireEvent.keyDown(
      screen.getByRole('button', {
        name: 'Ver Grand Theft Auto V',
      }),
      {
        key: 'Escape',
      }
    );

    assert.equal(
      mockNavigate.mock.calls.length,
      0
    );
  });
});