import { describe, test, vi, assert } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import SearchBar from '@/components/ui/SearchBar';

function renderSearchBar(props = {}) {
  return render(
    <MemoryRouter>
      <SearchBar {...props} />
    </MemoryRouter>
  );
}

describe('SearchBar', () => {
  test('renderiza el input de búsqueda', () => {
    renderSearchBar();

    assert.isNotNull(screen.getByLabelText('Buscar obras'));
  });

  test('muestra la búsqueda inicial', () => {
    renderSearchBar({
      initialQuery: 'Star Wars',
    });

    assert.equal(
      screen.getByLabelText('Buscar obras').value,
      'Star Wars'
    );
  });

  test('permite escribir en el input', () => {
    renderSearchBar();

    const input = screen.getByLabelText('Buscar obras');

    fireEvent.change(input, {
      target: { value: 'Matrix' },
    });

    assert.equal(input.value, 'Matrix');
  });

  test('ejecuta onSearch al enviar una búsqueda válida', () => {
    const onSearch = vi.fn();

    renderSearchBar({
      onSearch,
    });

    const input = screen.getByLabelText('Buscar obras');

    fireEvent.change(input, {
      target: { value: 'Harry Potter' },
    });

    fireEvent.submit(screen.getByRole('search'));

    assert.deepEqual(onSearch.mock.calls[0], ['Harry Potter', 'all']);
  });

  test('no ejecuta onSearch si la búsqueda está vacía', () => {
    const onSearch = vi.fn();

    renderSearchBar({
      onSearch,
    });

    fireEvent.submit(screen.getByRole('search'));

    assert.equal(onSearch.mock.calls.length, 0);
  });

  test('no muestra tabs cuando compact es true', () => {
    renderSearchBar({
      compact: true,
    });

    assert.isNull(screen.queryByRole('tablist'));
  });

  test('ejecuta onSearch al cambiar de tab con texto escrito', () => {
    const onSearch = vi.fn();

    renderSearchBar({
      onSearch,
    });

    const input = screen.getByLabelText('Buscar obras');

    fireEvent.change(input, {
      target: { value: 'Naruto' },
    });

    fireEvent.click(screen.getByRole('tab', { name: /Anime/i }));

    assert.deepEqual(onSearch.mock.calls[0], ['Naruto', 'anime']);
  });

  test('ejecuta onSearch al cambiar de tab sin texto escrito', () => {
    const onSearch = vi.fn();

    renderSearchBar({
      onSearch,
    });

    fireEvent.click(screen.getByRole('tab', { name: /Películas/i }));

    assert.deepEqual(onSearch.mock.calls[0], ['', 'movie']);
  });

  test('actualiza el input si cambia initialQuery', () => {
    const { rerender } = render(
      <MemoryRouter>
        <SearchBar initialQuery="Star Wars" />
      </MemoryRouter>
    );

    assert.equal(
      screen.getByLabelText('Buscar obras').value,
      'Star Wars'
    );

    rerender(
      <MemoryRouter>
        <SearchBar initialQuery="Matrix" initialType="movie" />
      </MemoryRouter>
    );

    assert.equal(
      screen.getByLabelText('Buscar obras').value,
      'Matrix'
    );
  });
  test('navega sin llamar onSearch cuando onSearch no se proporciona', () => {
    renderSearchBar(); // sin onSearch
    const input = screen.getByLabelText('Buscar obras');
    fireEvent.change(input, { target: { value: 'Matrix' } });
    fireEvent.submit(screen.getByRole('search'));
    // No debe lanzar error y debe funcionar sin onSearch
    assert.isNotNull(input);
  });

  test('cambia de tab sin onSearch no lanza error', () => {
    renderSearchBar(); // sin onSearch
    fireEvent.click(screen.getByRole('tab', { name: /Anime/i }));
    assert.isNotNull(screen.getByRole('tab', { name: /Anime/i }));
  });
});