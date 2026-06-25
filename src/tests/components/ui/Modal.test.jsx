import { describe, test, vi, assert } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Modal from '@/components/ui/Modal';

describe('Modal', () => {
  test('no renderiza cuando isOpen es false', () => {
    render(
      <Modal
        isOpen={false}
        onClose={vi.fn()}
      >
        Contenido
      </Modal>
    );

    assert.isNull(
      screen.queryByText('Contenido')
    );
  });

  test('renderiza contenido cuando isOpen es true', () => {
    render(
      <Modal
        isOpen
        onClose={vi.fn()}
      >
        Contenido Modal
      </Modal>
    );

    assert.isNotNull(
      screen.getByText('Contenido Modal')
    );
  });

  test('ejecuta onClose al hacer click en botón cerrar', () => {
    const onClose = vi.fn();

    render(
      <Modal isOpen onClose={onClose}>
        Modal
      </Modal>
    );

    fireEvent.click(
      screen.getByLabelText('Cerrar')
    );

    assert.equal(
      onClose.mock.calls.length,
      1
    );
  });

  test('ejecuta onClose al presionar Escape', () => {
    const onClose = vi.fn();

    render(
      <Modal isOpen onClose={onClose}>
        Modal
      </Modal>
    );

    fireEvent.keyDown(document, {
      key: 'Escape',
    });

    assert.equal(
      onClose.mock.calls.length,
      1
    );
  });

  test('aplica className personalizada', () => {
    render(
      <Modal
        isOpen
        onClose={vi.fn()}
        className="custom-modal"
      >
        Modal
      </Modal>
    );

    const modal =
      screen
        .getByText('Modal')
        .closest('.custom-modal');

    assert.isNotNull(modal);
  });

  test('bloquea scroll cuando está abierto', () => {
    render(
      <Modal
        isOpen
        onClose={vi.fn()}
      >
        Modal
      </Modal>
    );

    assert.equal(
      document.body.style.overflow,
      'hidden'
    );
  });

  test('restaura scroll al desmontarse', () => {
    const { unmount } = render(
      <Modal
        isOpen
        onClose={vi.fn()}
      >
        Modal
      </Modal>
    );

    unmount();

    assert.equal(
      document.body.style.overflow,
      ''
    );
  });

  test('click dentro del modal no ejecuta onClose', () => {
    const onClose = vi.fn();

    render(
        <Modal isOpen onClose={onClose}>
        <div>Contenido interno</div>
        </Modal>
    );

    fireEvent.click(
        screen.getByText('Contenido interno')
    );

    assert.equal(
        onClose.mock.calls.length,
        0
    );
  });

  test('click en overlay ejecuta onClose', () => {
    const onClose = vi.fn();

    render(
        <Modal isOpen onClose={onClose}>
        Modal
        </Modal>
    );

    const overlay =
        document.querySelector('.nl-modal-overlay');

    fireEvent.click(overlay);

    assert.equal(
        onClose.mock.calls.length,
        1
    );
  });

  test('no ejecuta onClose con otra tecla', () => {
    const onClose = vi.fn();

    render(
        <Modal isOpen onClose={onClose}>
        Modal
        </Modal>
    );

    fireEvent.keyDown(document, {
        key: 'Enter',
    });

    assert.equal(
        onClose.mock.calls.length,
        0
    );
  });

  test('no modifica overflow cuando está cerrado', () => {
    render(
        <Modal isOpen={false} onClose={vi.fn()}>
        Modal
        </Modal>
    );

    assert.notEqual(
        document.body.style.overflow,
        'hidden'
    );
  });

  test('restaura overflow al cambiar isOpen a false', () => {
    const { rerender } = render(
        <Modal isOpen onClose={vi.fn()}>
        Modal
        </Modal>
    );

    assert.equal(
        document.body.style.overflow,
        'hidden'
    );

    rerender(
        <Modal isOpen={false} onClose={vi.fn()}>
        Modal
        </Modal>
    );

    assert.equal(
        document.body.style.overflow,
        ''
    );
  });

  test('renderiza múltiples elementos hijos', () => {
    render(
        <Modal isOpen onClose={vi.fn()}>
        <h1>Título</h1>
        <p>Descripción</p>
        </Modal>
    );

    assert.isNotNull(
        screen.getByText('Título')
    );

    assert.isNotNull(
        screen.getByText('Descripción')
    );
  });
});