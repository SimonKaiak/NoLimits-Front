import { describe, test, vi, beforeEach, assert } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ChatBot from '@/components/ui/ChatBot';

Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  value: vi.fn(),
});

describe('ChatBot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza el botón flotante', () => {
    render(
      <MemoryRouter>
        <ChatBot />
      </MemoryRouter>
    );

    assert.isNotNull(
      screen.getByLabelText('Abrir asistente')
    );
  });

  test('abre el chat al hacer click', () => {
    render(
      <MemoryRouter>
        <ChatBot />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByLabelText('Abrir asistente')
    );

    assert.isNotNull(
      screen.getByText(/Asistente no\/limits/i)
    );
  });

  test('muestra mensaje inicial', () => {
    render(
      <MemoryRouter>
        <ChatBot />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByLabelText('Abrir asistente')
    );

    assert.isNotNull(
      screen.getByText(/Soy el asistente de NoLimits/i)
    );
  });

  test('envía mensaje exitosamente', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            reply: 'Hola usuario',
          }),
      })
    );

    render(
      <MemoryRouter>
        <ChatBot />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByLabelText('Abrir asistente')
    );

    fireEvent.change(
      screen.getByPlaceholderText('Pregúntame algo…'),
      {
        target: {
          value: 'Hola',
        },
      }
    );

    fireEvent.submit(
      screen
        .getByPlaceholderText('Pregúntame algo…')
        .closest('form')
    );

    await waitFor(() => {
      assert.isNotNull(
        screen.getByText('Hola usuario')
      );
    });
  });

  test('muestra error cuando falla fetch', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(
        new Error('error')
      )
    );

    render(
      <MemoryRouter>
        <ChatBot />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByLabelText('Abrir asistente')
    );

    fireEvent.change(
      screen.getByPlaceholderText('Pregúntame algo…'),
      {
        target: {
          value: 'Hola',
        },
      }
    );

    fireEvent.submit(
      screen
        .getByPlaceholderText('Pregúntame algo…')
        .closest('form')
    );

    await waitFor(() => {
      assert.isNotNull(
        screen.getByText(
          /No pude responder en este momento/i
        )
      );
    });
  });

  test('deshabilita el input mientras está pensando', async () => {
    global.fetch = vi.fn(
        () =>
        new Promise((resolve) =>
            setTimeout(
            () =>
                resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                    reply: 'Respuesta',
                    }),
                }),
            200
            )
        )
    );

    render(
        <MemoryRouter>
        <ChatBot />
        </MemoryRouter>
    );

    fireEvent.click(
        screen.getByLabelText('Abrir asistente')
    );

    const input =
        screen.getByPlaceholderText('Pregúntame algo…');

    fireEvent.change(input, {
        target: { value: 'Hola' },
    });

    fireEvent.submit(
        input.closest('form')
    );

    assert.isTrue(input.disabled);

    await waitFor(() => {
        assert.isFalse(input.disabled);
    });
  });

  test('deshabilita el botón enviar cuando el input está vacío', () => {
    render(
        <MemoryRouter>
        <ChatBot />
        </MemoryRouter>
    );

    fireEvent.click(
        screen.getByLabelText('Abrir asistente')
    );

    const buttons =
        screen.getAllByRole('button');

    const sendButton = buttons[1];

    assert.isTrue(sendButton.disabled);
  });

  test('habilita el botón enviar cuando hay texto', () => {
    render(
        <MemoryRouter>
        <ChatBot />
        </MemoryRouter>
    );

    fireEvent.click(
        screen.getByLabelText('Abrir asistente')
    );

    fireEvent.change(
        screen.getByPlaceholderText('Pregúntame algo…'),
        {
        target: {
            value: 'Hola',
        },
        }
    );

    const buttons =
        screen.getAllByRole('button');

    const sendButton = buttons[1];

    assert.isFalse(sendButton.disabled);
  });

  test('no envía mensaje vacío', async () => {
        global.fetch = vi.fn();

        render(
            <MemoryRouter>
            <ChatBot />
            </MemoryRouter>
        );

        fireEvent.click(
            screen.getByLabelText('Abrir asistente')
        );

        fireEvent.submit(
            screen
            .getByPlaceholderText('Pregúntame algo…')
            .closest('form')
        );

        await new Promise(resolve => setTimeout(resolve, 100));

        assert.equal(
            global.fetch.mock.calls.length,
            0
        );
  });

  test('no envía mensaje compuesto solo por espacios', async () => {
        global.fetch = vi.fn();

        render(
            <MemoryRouter>
            <ChatBot />
            </MemoryRouter>
        );

        fireEvent.click(
            screen.getByLabelText('Abrir asistente')
        );

        fireEvent.change(
            screen.getByPlaceholderText('Pregúntame algo…'),
            {
            target: {
                value: '      ',
            },
            }
        );

        fireEvent.submit(
            screen
            .getByPlaceholderText('Pregúntame algo…')
            .closest('form')
        );

        await new Promise(resolve => setTimeout(resolve, 100));

        assert.equal(
            global.fetch.mock.calls.length,
            0
        );
  });

    test('usa mensaje por defecto cuando API responde sin reply', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
            ok: true,
            json: () =>
                Promise.resolve({}),
            })
        );

        render(
            <MemoryRouter>
            <ChatBot />
            </MemoryRouter>
        );

        fireEvent.click(
            screen.getByLabelText('Abrir asistente')
        );

        fireEvent.change(
            screen.getByPlaceholderText('Pregúntame algo…'),
            {
            target: {
                value: 'Hola',
            },
            }
        );

        fireEvent.submit(
            screen
            .getByPlaceholderText('Pregúntame algo…')
            .closest('form')
        );

        await waitFor(() => {
            assert.isNotNull(
            screen.getByText(
                'No pude generar una respuesta.'
            )
            );
        });
    });

    test('muestra el mensaje del usuario enviado', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
            ok: true,
            json: () =>
                Promise.resolve({
                reply: 'respuesta',
                }),
            })
        );

        render(
            <MemoryRouter>
            <ChatBot />
            </MemoryRouter>
        );

        fireEvent.click(
            screen.getByLabelText('Abrir asistente')
        );

        fireEvent.change(
            screen.getByPlaceholderText('Pregúntame algo…'),
            {
            target: {
                value: 'Mi mensaje',
            },
            }
        );

        fireEvent.submit(
            screen
            .getByPlaceholderText('Pregúntame algo…')
            .closest('form')
        );

        await waitFor(() => {
            assert.isNotNull(
            screen.getByText('Mi mensaje')
            );
        });
        });

        test('maneja respuesta HTTP no exitosa', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
            ok: false,
            })
        );

        render(
            <MemoryRouter>
            <ChatBot />
            </MemoryRouter>
        );

        fireEvent.click(
            screen.getByLabelText('Abrir asistente')
        );

        fireEvent.change(
            screen.getByPlaceholderText('Pregúntame algo…'),
            {
            target: {
                value: 'Hola',
            },
            }
        );

        fireEvent.submit(
            screen
            .getByPlaceholderText('Pregúntame algo…')
            .closest('form')
        );

        await waitFor(() => {
            assert.isNotNull(
            screen.getByText(
                /No pude responder en este momento/i
            )
            );
        });
    });

    test('limpia el input después de enviar', async () => {
    global.fetch = vi.fn(() =>
        Promise.resolve({
        ok: true,
        json: () =>
            Promise.resolve({
            reply: 'ok',
            }),
        })
    );

    render(
        <MemoryRouter>
        <ChatBot />
        </MemoryRouter>
    );

    fireEvent.click(
        screen.getByLabelText('Abrir asistente')
    );

    const input =
        screen.getByPlaceholderText(
        'Pregúntame algo…'
        );

    fireEvent.change(input, {
        target: {
        value: 'Hola',
        },
    });

    fireEvent.submit(
        input.closest('form')
    );

    await waitFor(() => {
        assert.equal(
        input.value,
        ''
        );
    });
  });

  test('muestra indicador de escritura mientras espera respuesta', async () => {
    global.fetch = vi.fn(
        () =>
        new Promise((resolve) =>
            setTimeout(
            () =>
                resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                    reply: 'ok',
                    }),
                }),
            500
            )
        )
    );

    render(
        <MemoryRouter>
        <ChatBot />
        </MemoryRouter>
    );

    fireEvent.click(
        screen.getByLabelText('Abrir asistente')
    );

    fireEvent.change(
        screen.getByPlaceholderText('Pregúntame algo…'),
        {
        target: { value: 'Hola' },
        }
    );

    fireEvent.submit(
        screen
        .getByPlaceholderText('Pregúntame algo…')
        .closest('form')
    );

    const dots =
        document.querySelectorAll('span');

    assert.isAbove(dots.length, 0);
  });

  test('no envía mensajes cuando thinking es true', async () => {
    global.fetch = vi.fn(
        () =>
        new Promise((resolve) =>
            setTimeout(
            () =>
                resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                    reply: 'ok',
                    }),
                }),
            500
            )
        )
    );

    render(
        <MemoryRouter>
        <ChatBot />
        </MemoryRouter>
    );

    fireEvent.click(
        screen.getByLabelText('Abrir asistente')
    );

    const input =
        screen.getByPlaceholderText('Pregúntame algo…');

    fireEvent.change(input, {
        target: { value: 'Hola' },
    });

    fireEvent.submit(
        input.closest('form')
    );

    fireEvent.submit(
        input.closest('form')
    );

    assert.equal(
        global.fetch.mock.calls.length,
        1
    );
  });

  test('renderiza mensaje del bot con texto formateado', async () => {
    global.fetch = vi.fn(() =>
        Promise.resolve({
        ok: true,
        json: () =>
            Promise.resolve({
            reply: '**Batman** es genial',
            }),
        })
    );

    render(
        <MemoryRouter>
        <ChatBot />
        </MemoryRouter>
    );

    fireEvent.click(
        screen.getByLabelText('Abrir asistente')
    );

    fireEvent.change(
        screen.getByPlaceholderText('Pregúntame algo…'),
        {
        target: { value: 'Batman' },
        }
    );

    fireEvent.submit(
        screen
        .getByPlaceholderText('Pregúntame algo…')
        .closest('form')
    );

    await waitFor(() => {
        assert.isNotNull(
        screen.getByText('Batman')
        );
    });
  });
});