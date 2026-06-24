import { describe, test, vi, beforeEach, assert } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import MyListSection from '@/components/sections/MyListSection';

const mockUseAppStore = vi.fn();

vi.mock('@/store/useAppStore', () => ({
  default: (selector) =>
    selector(
      mockUseAppStore()
    ),
}));

vi.mock('@/components/sections/ContentSection', () => ({
  default: ({ title, obras, cardType }) => (
    <div data-testid="content-section">
      <span>{title}</span>
      <span>{cardType}</span>
      <span>{obras.length}</span>
    </div>
  ),
}));

describe('MyListSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('muestra mensaje vacío cuando no hay elementos guardados', () => {
    mockUseAppStore.mockReturnValue({
      myList: [],
    });

    render(
      <MemoryRouter>
        <MyListSection />
      </MemoryRouter>
    );

    assert.isNotNull(screen.getByText('MI BIBLIOTECA'));

    assert.isNotNull(
      screen.getByText(/Aún no has guardado nada/i)
    );

    assert.isNotNull(
      screen.getByRole('link', {
        name: /Explora el catálogo/i,
      })
    );
  });

  test('renderiza ContentSection con los primeros 5 elementos', () => {
    mockUseAppStore.mockReturnValue({
      myList: [
        { id: '1', type: 'movie' },
        { id: '2', type: 'movie' },
        { id: '3', type: 'movie' },
        { id: '4', type: 'movie' },
        { id: '5', type: 'movie' },
        { id: '6', type: 'movie' },
      ],
    });

    render(
      <MemoryRouter>
        <MyListSection />
      </MemoryRouter>
    );

    assert.isNotNull(
      screen.getByTestId('content-section')
    );

    assert.isNotNull(
      screen.getByText(
        'MI BIBLIOTECA · GUARDADOS RECIENTES'
      )
    );

    assert.isNotNull(
      screen.getByText('media')
    );

    assert.isNotNull(
      screen.getByText('5')
    );
  });

  test('usa cardType anime cuando el primer elemento es anime', () => {
        mockUseAppStore.mockReturnValue({
            myList: [
            {
                id: '1',
                type: 'anime',
            },
            ],
        });

        render(
            <MemoryRouter>
            <MyListSection />
            </MemoryRouter>
        );

        assert.isNotNull(screen.getByText('anime'));
   });

    test('usa cardType book cuando el primer elemento es libro', () => {
        mockUseAppStore.mockReturnValue({
            myList: [
            {
                id: '1',
                type: 'book',
            },
            ],
        });

        render(
            <MemoryRouter>
            <MyListSection />
            </MemoryRouter>
        );

        assert.isNotNull(screen.getByText('book'));
    });
});