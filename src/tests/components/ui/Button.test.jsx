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
  test('usa variante primary cuando variant no está en el map', () => {
    render(<Button variant="unknown">Botón</Button>);
    assert.include(screen.getByRole('button').className, 'nl-btn--primary');
  });

  test('usa tamaño md cuando size no está en el map', () => {
    render(<Button size="unknown">Botón</Button>);
    assert.include(screen.getByRole('button').className, 'nl-btn--md');
  });
});