import { describe, test, vi, assert } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Button from '@/components/ui/Button';

describe('Button', () => {
  test('renderiza el texto correctamente', () => {
    render(
      <Button>
        Ver detalle
      </Button>
    );

    assert.isNotNull(
      screen.getByText('Ver detalle')
    );
  });

  test('aplica variante primary por defecto', () => {
    render(
      <Button>
        Botón
      </Button>
    );

    const button = screen.getByRole('button');

    assert.include(
      button.className,
      'nl-btn--primary'
    );
  });

  test('aplica variante secondary', () => {
    render(
      <Button variant="secondary">
        Secondary
      </Button>
    );

    const button = screen.getByRole('button');

    assert.include(
      button.className,
      'nl-btn--secondary'
    );
  });

  test('aplica tamaño lg', () => {
    render(
      <Button size="lg">
        Grande
      </Button>
    );

    const button = screen.getByRole('button');

    assert.include(
      button.className,
      'nl-btn--lg'
    );
  });

  test('ejecuta onClick al hacer click', () => {
    const handleClick = vi.fn();

    render(
      <Button onClick={handleClick}>
        Click
      </Button>
    );

    fireEvent.click(
      screen.getByRole('button')
    );

    assert.equal(
      handleClick.mock.calls.length,
      1
    );
  });

  test('puede estar deshabilitado', () => {
    render(
      <Button disabled>
        Disabled
      </Button>
    );

    assert.isTrue(
      screen.getByRole('button').disabled
    );
  });

  test('aplica variante ghost', () => {
    render(
      <Button variant="ghost">
        Ghost
      </Button>
    );

    const button = screen.getByRole('button');

    assert.include(
      button.className,
      'nl-btn--ghost'
    );
  });

  test('aplica variante destructive', () => {
    render(
      <Button variant="destructive">
        Delete
      </Button>
    );

    const button = screen.getByRole('button');

    assert.include(
      button.className,
      'nl-btn--destructive'
    );
  });

  test('aplica tamaño sm', () => {
    render(
      <Button size="sm">
        Small
      </Button>
    );

    const button = screen.getByRole('button');

    assert.include(
      button.className,
      'nl-btn--sm'
    );
  });

  test('aplica tamaño md por defecto', () => {
    render(
      <Button>
        Medium
      </Button>
    );

    const button = screen.getByRole('button');

    assert.include(
      button.className,
      'nl-btn--md'
    );
  });

  test('agrega className personalizada', () => {
    render(
      <Button className="custom-class">
        Custom
      </Button>
    );

    const button = screen.getByRole('button');

    assert.include(
      button.className,
      'custom-class'
    );
  });

  test('usa primary cuando recibe una variante inválida', () => {
    render(
      <Button variant={undefined}>
        Test
      </Button>
    );

    const button = screen.getByRole('button');

    assert.include(
      button.className,
      'nl-btn--primary'
    );
  });

  test('usa md cuando recibe un tamaño inválido', () => {
    render(
      <Button size={undefined}>
        Test
      </Button>
    );

    const button = screen.getByRole('button');

    assert.include(
      button.className,
      'nl-btn--md'
    );
  });

  test('usa primary cuando recibe una variante desconocida', () => {
    render(
      <Button variant={'cualquier-cosa'}>
        Test
      </Button>
    );

    const button = screen.getByRole('button');

    assert.include(
      button.className,
      'nl-btn--primary'
    );
  });

  test('usa md cuando recibe un tamaño desconocido', () => {
    render(
      <Button size={'gigante'}>
        Test
      </Button>
    );

    const button = screen.getByRole('button');

    assert.include(
      button.className,
      'nl-btn--md'
    );
  });

  test('permite pasar el atributo type', () => {
    render(
      <Button type="submit">
        Enviar
      </Button>
    );

    const button = screen.getByRole('button');

    assert.equal(
      button.getAttribute('type'),
      'submit'
    );
  });

  test('permite pasar props extra al botón', () => {
    render(
      <Button data-testid="custom-button">
        Test
      </Button>
    );

    assert.isNotNull(
      screen.getByTestId('custom-button')
    );
  });
});