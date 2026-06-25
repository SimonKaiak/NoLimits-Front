import { describe, test, vi, assert } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('motion/react', () => ({
  motion: {
    div:  ({ children, ...p }) => <div {...p}>{children}</div>,
    span: ({ children, ...p }) => <span {...p}>{children}</span>,
  },
}));

vi.mock('@/components/cards/MediaCard', () => ({
  default: ({ obra }) => <article data-testid="media-card">{obra.title}</article>,
}));

vi.mock('@/components/cards/AnimeCard', () => ({
  default: ({ obra }) => <article data-testid="anime-card">{obra.title}</article>,
}));

vi.mock('@/components/cards/BookCard', () => ({
  default: ({ obra }) => <article data-testid="book-card">{obra.title}</article>,
}));

vi.mock('@/components/ui/SkeletonCard', () => ({
  default: () => <div data-testid="skeleton-card">Skeleton</div>,
}));

import ContentSection from '@/components/sections/ContentSection';

const obrasMock = [
  { id: '1', title: 'Obra 1', type: 'movie' },
  { id: '2', title: 'Obra 2', type: 'movie' },
];

function renderSection(props = {}) {
  return render(
    <MemoryRouter>
      <ContentSection {...props} />
    </MemoryRouter>
  );
}

describe('ContentSection', () => {

  // ── Título ────────────────────────────────────────────────────
  test('renderiza el título cuando se proporciona', () => {
    renderSection({ title: 'EN TENDENCIA', obras: obrasMock });
    assert.isNotNull(screen.getByText('EN TENDENCIA'));
  });

  test('no renderiza encabezado cuando no hay título', () => {
    renderSection({ obras: obrasMock });
    assert.isNull(screen.queryByText('EN TENDENCIA'));
  });

  // ── Contador ──────────────────────────────────────────────────
  test('muestra contador cuando hay obras y no está cargando', () => {
    renderSection({ title: 'SECCIÓN', obras: obrasMock, limit: 10 });
    assert.isNotNull(screen.getByText('2'));
  });

  test('muestra "limit+" cuando obras alcanza el límite', () => {
    const muchasObras = Array.from({ length: 5 }, (_, i) => ({
      id: String(i), title: `Obra ${i}`, type: 'movie',
    }));
    renderSection({ title: 'SECCIÓN', obras: muchasObras, limit: 5 });
    assert.isNotNull(screen.getByText('5+'));
  });

  test('no muestra contador cuando isLoading es true', () => {
    renderSection({ title: 'SECCIÓN', obras: obrasMock, isLoading: true });
    assert.isNull(screen.queryByText('2'));
  });

  // ── Loading / Error / Vacío ───────────────────────────────────
  test('muestra skeleton cuando isLoading es true', () => {
    renderSection({ title: 'SECCIÓN', obras: [], isLoading: true });
    assert.isNotNull(screen.getByTestId('skeleton-card'));
  });

  test('muestra skeleton cuando hay error y no hay obras', () => {
    renderSection({ title: 'SECCIÓN', obras: [], error: new Error('fallo') });
    assert.isNotNull(screen.getByTestId('skeleton-card'));
  });

  test('muestra mensaje de error cuando hay error, no carga y no hay obras', () => {
    renderSection({ obras: [], error: new Error('fallo'), isLoading: false });
    assert.isNotNull(screen.getByText('No se pudo cargar esta sección.'));
  });

  test('muestra mensaje vacío cuando no hay obras ni error ni carga', () => {
    renderSection({ obras: [], isLoading: false });
    assert.isNotNull(screen.getByText('Sin contenido en esta sección.'));
  });

  test('muestra mensaje vacío cuando obras es undefined', () => {
    renderSection({ isLoading: false });
    assert.isNotNull(screen.getByText('Sin contenido en esta sección.'));
  });

  // ── Cards por tipo ────────────────────────────────────────────
  test('renderiza MediaCard por defecto (cardType=media)', () => {
    renderSection({ obras: obrasMock, cardType: 'media' });
    assert.isNotNull(screen.getAllByTestId('media-card')[0]);
  });

  test('renderiza AnimeCard cuando cardType=anime', () => {
    renderSection({ obras: obrasMock, cardType: 'anime' });
    assert.isNotNull(screen.getAllByTestId('anime-card')[0]);
  });

  test('renderiza BookCard cuando cardType=book', () => {
    renderSection({ obras: obrasMock, cardType: 'book' });
    assert.isNotNull(screen.getAllByTestId('book-card')[0]);
  });

  test('usa MediaCard cuando cardType no está en el map', () => {
    renderSection({ obras: obrasMock, cardType: 'unknown' });
    assert.isNotNull(screen.getAllByTestId('media-card')[0]);
  });

  // ── Grid class ────────────────────────────────────────────────
  test('usa nl-grid--books cuando cardType=book', () => {
    const { container } = renderSection({ obras: obrasMock, cardType: 'book' });
    assert.isNotNull(container.querySelector('.nl-grid--books'));
  });

  test('usa gridClass personalizado cuando se proporciona', () => {
    const { container } = renderSection({ obras: obrasMock, gridClass: 'nl-grid--search' });
    assert.isNotNull(container.querySelector('.nl-grid--search'));
  });

  // ── Limit ─────────────────────────────────────────────────────
  test('respeta el límite de obras a mostrar', () => {
    const muchasObras = Array.from({ length: 10 }, (_, i) => ({
      id: String(i), title: `Obra ${i}`, type: 'movie',
    }));
    renderSection({ obras: muchasObras, limit: 3 });
    assert.equal(screen.getAllByTestId('media-card').length, 3);
  });
});