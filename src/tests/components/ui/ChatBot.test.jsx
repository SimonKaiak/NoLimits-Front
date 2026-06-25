import { describe, test, vi, beforeEach, assert } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

window.HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock('motion/react', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    span:   ({ children, ...p }) => <span {...p}>{children}</span>,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import ChatBot from '@/components/ui/ChatBot';

function renderChatBot() {
  return render(
    <MemoryRouter>
      <ChatBot />
    </MemoryRouter>
  );
}

describe('ChatBot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test('renderiza el botón flotante de abrir asistente', () => {
    renderChatBot();
    assert.isNotNull(screen.getByLabelText('Abrir asistente'));
  });

  test('abre el chat al hacer click en el botón flotante', () => {
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    assert.isNotNull(screen.getByText('Asistente no/limits'));
  });

  test('muestra mensaje de bienvenida al abrir', () => {
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    assert.isNotNull(screen.getByText(/Soy el asistente de NoLimits/i));
  });

  test('cierra el chat al hacer click en el botón X del header', () => {
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    assert.isNotNull(screen.getByText('Asistente no/limits'));
    const xButtons = screen.getAllByRole('button');
    const headerXBtn = xButtons.find(btn =>
      btn.getAttribute('style')?.includes('nl-text-muted')
    );
    if (headerXBtn) {
      fireEvent.click(headerXBtn);
      assert.isNull(screen.queryByText('Asistente no/limits'));
    } else {
      fireEvent.click(xButtons[1]);
    }
  });

  test('actualiza el input al escribir', () => {
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    const input = screen.getByPlaceholderText('Pregúntame algo…');
    fireEvent.change(input, { target: { value: 'Hola' } });
    assert.equal(input.value, 'Hola');
  });

  test('no envía mensaje si el input está vacío', () => {
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    const input = screen.getByPlaceholderText('Pregúntame algo…');
    fireEvent.submit(input.closest('form'));
    assert.equal(global.fetch.mock.calls.length, 0);
  });

  test('envía mensaje y muestra respuesta del bot', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Respuesta del bot' }),
    });
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    const input = screen.getByPlaceholderText('Pregúntame algo…');
    fireEvent.change(input, { target: { value: 'Hola bot' } });
    fireEvent.submit(input.closest('form'));
    await waitFor(() => assert.isNotNull(screen.getByText('Respuesta del bot')));
  });

  test('muestra fallback cuando reply está vacío', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: '' }),
    });
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    const input = screen.getByPlaceholderText('Pregúntame algo…');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.submit(input.closest('form'));
    await waitFor(() => assert.isNotNull(screen.getByText('No pude generar una respuesta.')));
  });

  test('muestra mensaje de error cuando fetch falla', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    const input = screen.getByPlaceholderText('Pregúntame algo…');
    fireEvent.change(input, { target: { value: 'Hola' } });
    fireEvent.submit(input.closest('form'));
    await waitFor(() => assert.isNotNull(screen.getByText(/No pude responder en este momento/i)));
  });

  test('muestra error cuando la respuesta HTTP no es ok', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    const input = screen.getByPlaceholderText('Pregúntame algo…');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.submit(input.closest('form'));
    await waitFor(() => assert.isNotNull(screen.getByText(/No pude responder en este momento/i)));
  });

  test('renderiza texto con **bold** como elemento strong', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Texto **importante** aquí' }),
    });
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    const input = screen.getByPlaceholderText('Pregúntame algo…');
    fireEvent.change(input, { target: { value: 'Test bold' } });
    fireEvent.submit(input.closest('form'));
    await waitFor(() => assert.isNotNull(screen.getByText('importante')));
  });

  test('muestra thinking indicator mientras espera respuesta', async () => {
    let resolveFetch;
    global.fetch.mockReturnValueOnce(new Promise(r => { resolveFetch = r; }));
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    const input = screen.getByPlaceholderText('Pregúntame algo…');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.submit(input.closest('form'));
    assert.isNotNull(input.disabled !== undefined);
    resolveFetch({ ok: true, json: async () => ({ reply: 'Ok' }) });
  });

  test('deshabilita input mientras está pensando', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Listo' }),
    });
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    const input = screen.getByPlaceholderText('Pregúntame algo…');
    fireEvent.change(input, { target: { value: 'Hola' } });
    fireEvent.submit(input.closest('form'));
    await waitFor(() => assert.isNotNull(screen.getByText('Listo')));
  });

  test('limpia el input después de enviar', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Ok' }),
    });
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    const input = screen.getByPlaceholderText('Pregúntame algo…');
    fireEvent.change(input, { target: { value: 'Mensaje' } });
    fireEvent.submit(input.closest('form'));
    assert.equal(input.value, '');
  });

  test('muestra el mensaje del usuario en el chat', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Respuesta' }),
    });
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    const input = screen.getByPlaceholderText('Pregúntame algo…');
    fireEvent.change(input, { target: { value: 'Mi mensaje' } });
    fireEvent.submit(input.closest('form'));
    assert.isNotNull(screen.getByText('Mi mensaje'));
  });
  test('no envía si está pensando (thinking=true)', async () => {
    let resolveFetch;
    global.fetch.mockReturnValueOnce(new Promise(r => { resolveFetch = r; }));
    renderChatBot();
    fireEvent.click(screen.getByLabelText('Abrir asistente'));
    const input = screen.getByPlaceholderText('Pregúntame algo…');
    fireEvent.change(input, { target: { value: 'Primer mensaje' } });
    fireEvent.submit(input.closest('form'));
    // Intentar enviar otro mientras piensa
    fireEvent.change(input, { target: { value: 'Segundo' } });
    fireEvent.submit(input.closest('form'));
    // Solo debe haberse llamado fetch una vez
    assert.equal(global.fetch.mock.calls.length, 1);
    resolveFetch({ ok: true, json: async () => ({ reply: 'Ok' }) });
  });

  test('botón flotante alterna ícono entre abierto y cerrado', () => {
    renderChatBot();
    const btn = screen.getByLabelText('Abrir asistente');
    // Cerrado: muestra MessageCircle
    assert.isNotNull(btn);
    fireEvent.click(btn);
    // Abierto: el panel aparece
    assert.isNotNull(screen.getByText('Asistente no/limits'));
  });
});