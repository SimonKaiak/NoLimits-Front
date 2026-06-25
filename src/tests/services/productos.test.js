import { beforeEach, describe, test, vi, assert } from 'vitest';
import {
  listarProductos,
  listarProductosPaginado,
  obtenerProducto,
  crearProducto,
  editarProducto,
  eliminarProducto,
  obtenerSagas,
  obtenerProductosPorSaga,
  obtenerTiposProducto,
  obtenerClasificaciones,
  obtenerEstadosProducto,
  obtenerPlataformas,
  obtenerGeneros,
  obtenerEmpresas,
  obtenerDesarrolladores,
  actualizarPrecioSteam,
  editarProductoPut,
  editarProductoPatch,
  obtenerProductosDeSagaCompleto,
  adaptarProductoNoLimits,
  buscarProductosNoLimits,
} from '@/services/productos';

describe('productos service - tests de regresión', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  test('listarProductos carga todas las páginas y une resultados', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            contenido: [{ id: 1, nombre: 'Producto 1' }],
            totalPaginas: 2,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            contenido: [{ id: 2, nombre: 'Producto 2' }],
            totalPaginas: 2,
          }),
      });

    const result = await listarProductos({ force: true });

    assert.lengthOf(result, 2);
    assert.equal(result[0].nombre, 'Producto 1');
    assert.equal(result[1].nombre, 'Producto 2');
    assert.equal(global.fetch.mock.calls.length, 2);
  });

  test('listarProductos usa cache cuando no se fuerza', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          contenido: [{ id: 1, nombre: 'Cacheado' }],
          totalPaginas: 1,
        }),
    });

    const first = await listarProductos({ force: true });
    const second = await listarProductos();

    assert.deepEqual(second, first);
    assert.equal(global.fetch.mock.calls.length, 1);
  });

  test('listarProductos lanza error si respuesta no es ok', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Error backend',
    });

    try {
      await listarProductos({ force: true });
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.include(error.message, 'Status 500 -> Error backend');
    }
  });

  test('listarProductosPaginado devuelve contenido normalizado desde paginación', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          content: [{ id: 1, nombre: 'Elden Ring' }],
          page: 1,
          totalPages: 2,
          totalElements: 25,
        }),
    });

    const result = await listarProductosPaginado(1, 3);

    assert.include(
      global.fetch.mock.calls[0][0],
      '/api/v1/productos/paginacion?page=1&size=3'
    );

    assert.deepEqual(result, {
      content: [{ id: 1, nombre: 'Elden Ring' }],
      page: 1,
      totalPages: 2,
      totalElements: 25,
    });
  });

  test('listarProductosPaginado usa página 1 si recibe una página inválida', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          contenido: [],
          totalPaginas: 1,
          totalElementos: 0,
        }),
    });

    await listarProductosPaginado(0, 3);

    assert.include(global.fetch.mock.calls[0][0], 'page=1&size=3');
  });

  test('listarProductosPaginado retorna vacío si JSON es inválido', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'no-json',
    });

    const result = await listarProductosPaginado(1, 3);

    assert.deepEqual(result, {
      content: [],
      page: 1,
      totalPages: 1,
      totalElements: 0,
    });
  });

  test('listarProductosPaginado lanza error si respuesta no es ok', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad request',
    });

    try {
      await listarProductosPaginado(1, 3);
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.include(error.message, 'Status 400 -> Bad request');
    }
  });

  test('crearProducto envía Authorization Bearer cuando existe token', async () => {
    localStorage.setItem('nl_token', 'token-prueba');

    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ id: 99, nombre: 'Producto creado' }),
    });

    const data = { nombre: 'Producto creado' };
    const result = await crearProducto(data);

    assert.include(global.fetch.mock.calls[0][0], '/api/v1/productos');

    assert.include(global.fetch.mock.calls[0][1], {
      method: 'POST',
      body: JSON.stringify(data),
    });

    assert.include(global.fetch.mock.calls[0][1].headers, {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-prueba',
    });

    assert.deepEqual(result, { id: 99, nombre: 'Producto creado' });
  });

  test('crearProducto retorna null si respuesta exitosa no trae JSON válido', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '',
    });

    const result = await crearProducto({ nombre: 'Sin body' });

    assert.isNull(result);
  });

  test('crearProducto lanza error si backend responde error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Error al crear',
    });

    try {
      await crearProducto({ nombre: 'Fallido' });
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.equal(error.message, 'Error al crear');
    }
  });

  test('obtenerProducto retorna producto por id', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ id: 10, nombre: 'Producto' }),
    });

    const result = await obtenerProducto(10);

    assert.include(global.fetch.mock.calls[0][0], '/api/v1/productos/10');
    assert.deepEqual(result, { id: 10, nombre: 'Producto' });
  });

  test('obtenerProducto lanza error si respuesta no es ok', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'No encontrado',
    });

    try {
      await obtenerProducto(999);
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.include(error.message, 'Status 404 -> No encontrado');
    }
  });

  test('editarProducto hace PUT y retorna JSON', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ id: 5, nombre: 'Editado' }),
    });

    const data = { nombre: 'Editado' };
    const result = await editarProducto(5, data);

    assert.include(global.fetch.mock.calls[0][0], '/api/v1/productos/5');
    assert.equal(global.fetch.mock.calls[0][1].method, 'PUT');
    assert.equal(global.fetch.mock.calls[0][1].body, JSON.stringify(data));
    assert.deepEqual(result, { id: 5, nombre: 'Editado' });
  });

  test('editarProducto retorna null si JSON viene vacío', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '',
    });

    const result = await editarProducto(5, { nombre: 'Editado' });

    assert.isNull(result);
  });

  test('editarProducto lanza error si backend falla', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Error editar',
    });

    try {
      await editarProducto(5, {});
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.equal(error.message, 'Error editar');
    }
  });

  test('eliminarProducto retorna true si elimina correctamente', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '',
    });

    const result = await eliminarProducto(7);

    assert.include(global.fetch.mock.calls[0][0], '/api/v1/productos/7');
    assert.equal(global.fetch.mock.calls[0][1].method, 'DELETE');
    assert.isTrue(result);
  });

  test('eliminarProducto lanza error si backend falla', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Error eliminar',
    });

    try {
      await eliminarProducto(7);
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.equal(error.message, 'Error eliminar');
    }
  });

  test('obtenerSagas normaliza y filtra sagas válidas', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify([
          { nombre: 'Zelda', portadaSaga: ' portada.jpg ' },
          { nombre: '', portadaSaga: 'x.jpg' },
          { nombre: 'Mario', portadaSaga: '' },
        ]),
    });

    const result = await obtenerSagas();

    assert.lengthOf(result, 2);
    assert.deepEqual(result[0], {
      nombre: 'Zelda',
      portadaSaga: ' portada.jpg ',
    });
    assert.deepEqual(result[1], {
      nombre: 'Mario',
      portadaSaga: null,
    });
  });

  test('obtenerSagas retorna vacío si no hay texto o JSON inválido', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'no-json',
      });

    assert.deepEqual(await obtenerSagas(), []);
    assert.deepEqual(await obtenerSagas(), []);
  });

  test('obtenerSagas retorna vacío si JSON no es arreglo', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ nombre: 'No array' }),
    });

    const result = await obtenerSagas();

    assert.deepEqual(result, []);
  });

  test('obtenerSagas lanza error si backend falla', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Error sagas',
    });

    try {
      await obtenerSagas();
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.include(error.message, 'Status 500 -> Error sagas');
    }
  });

  test('obtenerProductosPorSaga filtra por saga exacta ignorando mayúsculas', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          contenido: [
            { id: 1, nombre: 'Zelda 1', saga: 'Zelda' },
            { id: 2, nombre: 'Mario 1', saga: 'Mario' },
          ],
          totalPaginas: 1,
        }),
    });

    const result = await obtenerProductosPorSaga(' zelda ');

    assert.lengthOf(result, 1);
    assert.equal(result[0].nombre, 'Zelda 1');
  });

  test('catálogos simples retornan JSON válido o arreglo vacío si JSON inválido', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{ id: 1, nombre: 'Tipo' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'no-json',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{ id: 3, nombre: 'Estado' }]),
      });

    assert.deepEqual(await obtenerTiposProducto(), [{ id: 1, nombre: 'Tipo' }]);
    assert.deepEqual(await obtenerClasificaciones(), []);
    assert.deepEqual(await obtenerEstadosProducto(), [{ id: 3, nombre: 'Estado' }]);
  });

  test('catálogo simple lanza error si respuesta no es ok', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Error catálogo',
    });

    try {
      await obtenerTiposProducto();
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.include(error.message, 'Status 500 -> Error catálogo');
    }
  });

  test('catálogos paginados retornan content, contenido o arreglo directo', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ content: [{ id: 1, nombre: 'PC' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ contenido: [{ id: 2, nombre: 'RPG' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{ id: 3, nombre: 'Empresa' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'no-json',
      });

    assert.deepEqual(await obtenerPlataformas(), [{ id: 1, nombre: 'PC' }]);
    assert.deepEqual(await obtenerGeneros(), [{ id: 2, nombre: 'RPG' }]);
    assert.deepEqual(await obtenerEmpresas(), [{ id: 3, nombre: 'Empresa' }]);
    assert.deepEqual(await obtenerDesarrolladores(), []);
  });

  test('catálogo paginado lanza error si backend falla', async () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Error plataformas',
    });

    try {
      await obtenerPlataformas();
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.equal(error.message, 'Error plataformas');
    }

    errorMock.mockRestore();
  });

  test('actualizarPrecioSteam hace PATCH y retorna json', async () => {
    localStorage.setItem('nl_token', 'token-steam');

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, precio: 9990 }),
    });

    const result = await actualizarPrecioSteam(1);

    assert.include(
      global.fetch.mock.calls[0][0],
      '/api/v1/productos/1/actualizar-precio-steam'
    );
    assert.equal(global.fetch.mock.calls[0][1].method, 'PATCH');
    assert.include(global.fetch.mock.calls[0][1].headers, {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-steam',
    });
    assert.deepEqual(result, { id: 1, precio: 9990 });
  });

  test('actualizarPrecioSteam lanza error si backend falla', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Error Steam',
    });

    try {
      await actualizarPrecioSteam(1);
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.equal(error.message, 'Error Steam');
    }
  });

  test('editarProductoPut y editarProductoPatch usan guardarProducto', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 1, nombre: 'PUT' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 1, nombre: 'PATCH' }),
      });

    const putResult = await editarProductoPut(1, { nombre: 'PUT' });
    const patchResult = await editarProductoPatch(1, { nombre: 'PATCH' });

    assert.equal(global.fetch.mock.calls[0][1].method, 'PUT');
    assert.equal(global.fetch.mock.calls[1][1].method, 'PATCH');
    assert.deepEqual(putResult, { id: 1, nombre: 'PUT' });
    assert.deepEqual(patchResult, { id: 1, nombre: 'PATCH' });
  });

  test('editarProductoPatch retorna null si backend responde vacío', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '',
    });

    const result = await editarProductoPatch(1, { nombre: 'Nada' });

    assert.isNull(result);
  });

  test('editarProductoPatch lanza error si backend falla', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Error patch',
    });

    try {
      await editarProductoPatch(1, {});
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.equal(error.message, 'Error patch');
    }
  });

  test('obtenerProductosDeSagaCompleto retorna JSON o vacío si JSON inválido', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{ id: 1, nombre: 'Saga item' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'no-json',
      });

    assert.deepEqual(await obtenerProductosDeSagaCompleto('God of War'), [
      { id: 1, nombre: 'Saga item' },
    ]);
    assert.deepEqual(await obtenerProductosDeSagaCompleto('God of War'), []);
  });

  test('obtenerProductosDeSagaCompleto lanza error si backend falla', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'No saga',
    });

    try {
      await obtenerProductosDeSagaCompleto('Nada');
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.include(error.message, 'Status 404 -> No saga');
    }
  });

  test('adaptarProductoNoLimits mantiene links de compra del scraping', () => {
    const producto = {
      id: 10,
      nombre: 'The Last of Us Part II',
      tipoProductoNombre: 'Videojuego',
      precio: 39990,
      sinopsis: 'Juego de acción y aventura',
      saga: 'The Last of Us',
      imagenPortada: 'https://imagen.cl/tlou.jpg',
      linksCompra: [
        {
          urlCompra: 'https://www.mercadolibre.cl/tlou',
          plataformaNombre: 'Mercado Libre',
        },
      ],
    };

    const result = adaptarProductoNoLimits(producto);

    assert.include(result, {
      id: 'nolimits-10',
      realId: 10,
      source: 'nolimits',
      type: 'game',
      title: 'The Last of Us Part II',
      price: 39990,
      saga: 'The Last of Us',
      image: 'https://imagen.cl/tlou.jpg',
    });

    assert.lengthOf(result.linksCompra, 1);
    assert.equal(result.linksCompra[0].plataformaNombre, 'Mercado Libre');
  });

  test('adaptarProductoNoLimits adapta película y usa fallback de imagenes', () => {
    const result = adaptarProductoNoLimits({
      id: 20,
      nombre: 'Interestelar',
      tipoProductoNombre: 'Película',
      precio: 9990,
      imagenes: ['poster.jpg'],
      plataformas: ['Netflix'],
    });

    assert.include(result, {
      id: 'nolimits-20',
      type: 'movie',
      title: 'Interestelar',
      poster: 'poster.jpg',
      backdrop: 'poster.jpg',
    });

    assert.deepEqual(result.plataformas, ['Netflix']);
  });

  test('buscarProductosNoLimits filtra por nombre, saga o tipo y adapta resultados', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          contenido: [
            {
              id: 1,
              nombre: 'God of War Ragnarok',
              tipoProductoNombre: 'Videojuego',
              saga: 'God of War',
              precio: 49990,
            },
            {
              id: 2,
              nombre: 'Interestelar',
              tipoProductoNombre: 'Película',
              saga: 'Nolan',
              precio: 9990,
            },
          ],
          totalPaginas: 1,
        }),
    });

    const result = await buscarProductosNoLimits('god');

    assert.lengthOf(result, 1);

    assert.include(result[0], {
      id: 'nolimits-1',
      title: 'God of War Ragnarok',
      type: 'game',
      source: 'nolimits',
    });
  });

  test('listarProductos maneja respuesta vacía y usa content/totalPages', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          content: [{ id: 3, nombre: 'Producto content' }],
          totalPages: 1,
        }),
    });

    const result = await listarProductos({ force: true });

    assert.deepEqual(result, [{ id: 3, nombre: 'Producto content' }]);
  });

  test('listarProductos maneja body vacío como lista vacía', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '',
    });

    const result = await listarProductos({ force: true });

    assert.deepEqual(result, []);
  });

  test('listarProductosPaginado usa valores fallback cuando faltan metadatos', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          contenido: [{ id: 7, nombre: 'Sin metadata' }],
        }),
    });

    const result = await listarProductosPaginado('abc', 5);

    assert.deepEqual(result, {
      content: [{ id: 7, nombre: 'Sin metadata' }],
      page: 1,
      totalPages: 1,
      totalElements: 1,
    });
  });

  test('eliminarProducto maneja error si text falla y usa mensaje por defecto', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => {
        throw new Error('No text');
      },
    });

    try {
      await eliminarProducto(99);
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.equal(error.message, 'Error al eliminar producto');
    }
  });

  test('obtenerProductosPorSaga retorna vacío si nombreSaga no es string o saga no es string', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          contenido: [
            { id: 1, nombre: 'Producto sin saga', saga: null },
            { id: 2, nombre: 'Producto con saga', saga: 'Zelda' },
          ],
          totalPaginas: 1,
        }),
    });

    const result = await obtenerProductosPorSaga(null);

    assert.deepEqual(result, []);
  });

  test('actualizarPrecioSteam envía headers sin Authorization cuando no hay token', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 2, precio: 12990 }),
    });

    const result = await actualizarPrecioSteam(2);

    assert.deepEqual(result, { id: 2, precio: 12990 });
    assert.equal(global.fetch.mock.calls[0][1].method, 'PATCH');
    assert.equal(global.fetch.mock.calls[0][1].headers.Authorization, undefined);
  });

  test('guardarProducto lanza mensaje por defecto si backend falla sin texto', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => '',
    });

    try {
      await editarProductoPut(5, { nombre: 'Fallido' });
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.equal(error.message, 'Error al editar producto');
    }
  });

  test('adaptarProductoNoLimits usa portadaSaga, imagen, urlImagen y tipo por defecto', () => {
    const conPortadaSaga = adaptarProductoNoLimits({
      id: 1,
      nombre: 'Producto saga',
      portadaSaga: 'portada-saga.jpg',
      tipoProductoNombre: 'Otro',
    });

    const conImagen = adaptarProductoNoLimits({
      id: 2,
      nombre: 'Producto imagen',
      imagen: 'imagen.jpg',
    });

    const conUrlImagen = adaptarProductoNoLimits({
      id: 3,
      nombre: 'Producto url',
      urlImagen: 'url-imagen.jpg',
    });

    assert.include(conPortadaSaga, {
      id: 'nolimits-1',
      type: 'game',
      image: 'portada-saga.jpg',
      poster: 'portada-saga.jpg',
    });

    assert.equal(conImagen.image, 'imagen.jpg');
    assert.equal(conUrlImagen.image, 'url-imagen.jpg');
  });

  test('obtenerTiposProducto y obtenerEstadosProducto retornan [] si JSON es inválido', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'no-json',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'no-json',
      });

    assert.deepEqual(await obtenerTiposProducto(), []);
    assert.deepEqual(await obtenerEstadosProducto(), []);
  });

  test('obtenerClasificaciones lanza error si respuesta no es ok', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Error clasificaciones',
    });

    try {
      await obtenerClasificaciones();
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.include(error.message, 'Status 500 -> Error clasificaciones');
    }
  });

  test('obtenerEstadosProducto lanza error si respuesta no es ok', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Error estados',
    });

    try {
      await obtenerEstadosProducto();
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.include(error.message, 'Status 500 -> Error estados');
    }
  });

  test('catálogo paginado lanza error por defecto si backend falla sin texto', async () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => '',
    });

    try {
      await obtenerGeneros();
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.equal(error.message, 'Error cargando GENEROS');
    }

    errorMock.mockRestore();
  });

  test('crearProducto lanza mensaje por defecto si backend falla sin texto', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => '',
    });

    try {
      await crearProducto({ nombre: 'Fallido' });
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.equal(error.message, 'Error al crear producto');
    }
  });

  test('editarProducto lanza mensaje por defecto si backend falla sin texto', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => '',
    });

    try {
      await editarProducto(1, { nombre: 'Fallido' });
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.equal(error.message, 'Error al editar producto');
    }
  });

  test('actualizarPrecioSteam lanza mensaje por defecto si backend falla sin texto', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => '',
    });

    try {
      await actualizarPrecioSteam(1);
      assert.fail('Debía lanzar error');
    } catch (error) {
      assert.equal(error.message, 'Error al actualizar precio desde Steam');
    }
  });

  test('fetchCatalogoPaged retorna [] si respuesta no tiene content ni contenido', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ otraCosa: [] }),
    });

    const result = await obtenerEmpresas();

    assert.deepEqual(result, []);
  });

  test('buscarProductosNoLimits maneja productos con campos faltantes', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 99 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            contenido: [
              {
                id: 1,
                nombre: null,
                tipoProductoNombre: null,
                saga: null,
              },
              {
                id: 2,
                nombre: 'Producto válido',
                tipoProductoNombre: 'Videojuego',
                saga: 'Saga válida',
              },
            ],
            totalPaginas: 1,
          }),
      });

    await crearProducto({ nombre: 'Limpia cache' });

    const result = await buscarProductosNoLimits('videojuego');

    assert.lengthOf(result, 1);
    assert.equal(result[0].title, 'Producto válido');
  });

  test('listarProductosPaginado retorna content vacío si no viene content ni contenido', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          page: 2,
          totalPages: 3,
          totalElements: 0,
        }),
    });

    const result = await listarProductosPaginado(2, 5);

    assert.deepEqual(result, {
      content: [],
      page: 2,
      totalPages: 3,
      totalElements: 0,
    });
  });

  test('obtenerSagas normaliza nombre no string como vacío y lo filtra', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify([
          { nombre: 123, portadaSaga: 'portada.jpg' },
          { nombre: 'Saga válida', portadaSaga: null },
        ]),
    });

    const result = await obtenerSagas();

    assert.deepEqual(result, [
      {
        nombre: 'Saga válida',
        portadaSaga: null,
      },
    ]);
  });

  test('obtenerProductosPorSaga maneja productos con saga no string', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 99 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            contenido: [
              { id: 1, nombre: 'Sin saga string', saga: 123 },
              { id: 2, nombre: 'Saga correcta', saga: 'Metroid' },
            ],
            totalPaginas: 1,
          }),
      });

    await crearProducto({ nombre: 'Limpia cache' });

    const result = await obtenerProductosPorSaga('metroid');

    assert.lengthOf(result, 1);
    assert.equal(result[0].nombre, 'Saga correcta');
  });
});