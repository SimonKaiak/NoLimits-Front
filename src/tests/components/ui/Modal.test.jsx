import { describe, test, vi, beforeEach, assert } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...p }) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import Modal from '@/components/ui/Modal';

const onCloseMock = vi.fn();

function renderModal(props = {}) {
  return render(
    <Modal isOpen={true} onClose={onCloseMock} {...props}>
      <p>Contenido del modal</p>
    </Modal>
  );
}

describe('Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Renderizado ───────────────────────────────────────────────
  test('renderiza el contenido cuando isOpen es true', () => {
    renderModal();
    assert.isNotNull(screen.getByText('Contenido del modal'));
  });

  test('no renderiza contenido cuando isOpen es false', () => {
    render(
      <Modal isOpen={false} onClose={onCloseMock}>
        <p>Contenido oculto</p>
      </Modal>
    );
    assert.isNull(screen.queryByText('Contenido oculto'));
  });

  test('renderiza el botón de cerrar', () => {
    renderModal();
    assert.isNotNull(screen.getByLabelText('Cerrar'));
  });

  // ── Cierre con botón ──────────────────────────────────────────
  test('llama a onClose al presionar el botón cerrar', () => {
    renderModal();
    fireEvent.click(screen.getByLabelText('Cerrar'));
    assert.equal(onCloseMock.mock.calls.length, 1);
  });

  // ── Cierre con overlay — usa document.body porque es portal ──
  test('llama a onClose al hacer click en el overlay', () => {
    renderModal();
    const overlay = document.body.querySelector('.nl-modal-overlay');
    assert.isNotNull(overlay);
    fireEvent.click(overlay);
    assert.equal(onCloseMock.mock.calls.length, 1);
  });

  // ── Click interno no cierra ───────────────────────────────────
  test('no llama a onClose al hacer click dentro del modal', () => {
    renderModal();
    const modal = document.body.querySelector('.nl-modal');
    assert.isNotNull(modal);
    fireEvent.click(modal);
    assert.equal(onCloseMock.mock.calls.length, 0);
  });

  // ── Escape cierra ─────────────────────────────────────────────
  test('llama a onClose al presionar Escape', () => {
    renderModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    assert.equal(onCloseMock.mock.calls.length, 1);
  });

  // ── Escape no cierra cuando isOpen es false ───────────────────
  test('no llama a onClose con Escape cuando isOpen es false', () => {
    render(
      <Modal isOpen={false} onClose={onCloseMock}>
        <p>Oculto</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    assert.equal(onCloseMock.mock.calls.length, 0);
  });

  // ── className adicional — también en document.body ────────────
  test('aplica className adicional al contenedor del modal', () => {
    renderModal({ className: 'mi-clase' });
    const modal = document.body.querySelector('.nl-modal.mi-clase');
    assert.isNotNull(modal);
  });

  // ── Scroll bloqueado ──────────────────────────────────────────
  test('bloquea el scroll del body cuando isOpen es true', () => {
    renderModal();
    assert.equal(document.body.style.overflow, 'hidden');
  });
  test('no llama a onClose al presionar una tecla que no es Escape', () => {
    renderModal();
    fireEvent.keyDown(document, { key: 'Enter' });
    assert.equal(onCloseMock.mock.calls.length, 0);
  });
});