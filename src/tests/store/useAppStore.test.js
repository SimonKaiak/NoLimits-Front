import { describe, test, beforeEach, afterEach, vi, assert } from "vitest";
import useAppStore from "../../store/useAppStore";

const initialState = useAppStore.getState();

describe("useAppStore", () => {
 beforeEach(() => {
    localStorage.clear();

    useAppStore.setState({
      ...initialState,
      user: null,
      myList: [],
      reviews: {},
      theme: "dark",
    });

    global.fetch = vi.fn();
    global.alert = vi.fn();

    delete window.location;
    window.location = { href: "" };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("usuario", () => {
    test("deberia guardar usuario con setUser", () => {
      const user = {
        id: "1",
        name: "James",
        email: "test@test.com",
        token: "abc",
      };

      useAppStore.getState().setUser(user);

      assert.deepEqual(useAppStore.getState().user, user);
    });

    test("deberia limpiar usuario y localStorage con clearUser", () => {
      localStorage.setItem("nl_auth", "x");
      localStorage.setItem("nl_user", "x");
      localStorage.setItem("nl_userId", "1");
      localStorage.setItem("nl_role", "USER");
      localStorage.setItem("nl_token", "token");

      useAppStore.setState({ user: { id: "1" } });

      useAppStore.getState().clearUser();

      assert.equal(useAppStore.getState().user, null);
      assert.equal(localStorage.getItem("nl_auth"), null);
      assert.equal(localStorage.getItem("nl_user"), null);
      assert.equal(localStorage.getItem("nl_userId"), null);
      assert.equal(localStorage.getItem("nl_role"), null);
      assert.equal(localStorage.getItem("nl_token"), null);
    });
  });

  describe("favoritos", () => {
    test("deberia redirigir al login si no hay token al agregar favorito", async () => {
      await useAppStore.getState().addToList({
        id: "movie-1",
        title: "Matrix",
      });

      assert.equal(window.location.href, "/login");
      assert.equal(fetch.mock.calls.length, 0);
    });

    test("deberia agregar favorito correctamente", async () => {
      localStorage.setItem("nl_token", "token");
      localStorage.setItem("nl_userId", "10");

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const obra = {
        id: "movie-1",
        title: "Matrix",
        type: "movie",
        image: "poster.jpg",
        source: "tmdb",
      };

      await useAppStore.getState().addToList(obra);

      assert.equal(fetch.mock.calls.length, 1);
      assert.equal(useAppStore.getState().myList.length, 1);
      assert.deepEqual(useAppStore.getState().myList[0], obra);
    });

    test("deberia mostrar alerta si favorito ya existe", async () => {
      localStorage.setItem("nl_token", "token");
      localStorage.setItem("nl_userId", "10");

      useAppStore.setState({
        myList: [{ id: "movie-1", title: "Matrix" }],
      });

      await useAppStore.getState().addToList({
        id: "movie-1",
        title: "Matrix",
      });

      assert.equal(alert.mock.calls.length, 1);
      assert.equal(fetch.mock.calls.length, 0);
    });

    test("deberia mostrar alerta si backend falla al agregar favorito", async () => {
      localStorage.setItem("nl_token", "token");
      localStorage.setItem("nl_userId", "10");

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Error backend" }),
      });

      await useAppStore.getState().addToList({
        id: "movie-1",
        title: "Matrix",
      });

      assert.equal(alert.mock.calls[0][0], "Error backend");
      assert.equal(useAppStore.getState().myList.length, 0);
    });

    test("deberia eliminar favorito correctamente", async () => {
      localStorage.setItem("nl_token", "token");
      localStorage.setItem("nl_userId", "10");

      useAppStore.setState({
        myList: [
          { id: "movie-1", title: "Matrix" },
          { id: "movie-2", title: "Avatar" },
        ],
      });

      fetch.mockResolvedValueOnce({
        ok: true,
      });

      await useAppStore.getState().removeFromList("movie-1");

      assert.equal(fetch.mock.calls.length, 1);
      assert.equal(useAppStore.getState().myList.length, 1);
      assert.equal(useAppStore.getState().myList[0].id, "movie-2");
    });

    test("deberia redirigir al login si no hay token al eliminar favorito", async () => {
      await useAppStore.getState().removeFromList("movie-1");

      assert.equal(window.location.href, "/login");
      assert.equal(fetch.mock.calls.length, 0);
    });

    test("deberia saber si una obra esta en favoritos", () => {
      useAppStore.setState({
        myList: [{ id: "movie-1" }],
      });

      assert.equal(useAppStore.getState().isInList("movie-1"), true);
      assert.equal(useAppStore.getState().isInList("movie-2"), false);
    });

    test("deberia alternar favorito agregando si no existe", () => {
      const addToList = vi.fn();
      const removeFromList = vi.fn();

      useAppStore.setState({
        myList: [],
        addToList,
        removeFromList,
      });

      useAppStore.getState().toggleList({ id: "movie-1" });

      assert.equal(addToList.mock.calls.length, 1);
      assert.equal(removeFromList.mock.calls.length, 0);
    });

    test("deberia alternar favorito eliminando si ya existe", () => {
      const addToList = vi.fn();
      const removeFromList = vi.fn();

      useAppStore.setState({
        myList: [{ id: "movie-1" }],
        addToList,
        removeFromList,
      });

      useAppStore.getState().toggleList({ id: "movie-1" });

      assert.equal(removeFromList.mock.calls.length, 1);
      assert.equal(addToList.mock.calls.length, 0);
    });
  });

  describe("loadFavorites", () => {
    test("no deberia cargar favoritos si falta token o usuarioId", async () => {
      await useAppStore.getState().loadFavorites();

      assert.equal(fetch.mock.calls.length, 0);
    });

    test("deberia cargar favoritos desde backend", async () => {
      localStorage.setItem("nl_token", "token");
      localStorage.setItem("nl_userId", "10");

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            obraId: "movie-1",
            titulo: "Matrix",
            tipo: "movie",
            poster: "poster.jpg",
            source: "tmdb",
          },
        ],
      });

      await useAppStore.getState().loadFavorites();

      assert.deepEqual(useAppStore.getState().myList, [
        {
          id: "movie-1",
          title: "Matrix",
          type: "movie",
          poster: "poster.jpg",
          source: "tmdb",
        },
      ]);
    });

    test("deberia limpiar sesion y redirigir si token expiro", async () => {
      localStorage.setItem("nl_token", "token");
      localStorage.setItem("nl_userId", "10");

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await useAppStore.getState().loadFavorites();

      assert.equal(window.location.href, "/login");
      assert.equal(localStorage.getItem("nl_token"), null);
    });
  });

  describe("reviews", () => {
    test("deberia guardar y obtener review", () => {
      useAppStore.getState().setReview("obra-1", "Muy buena");

      assert.equal(useAppStore.getState().getReview("obra-1"), "Muy buena");
    });

    test("deberia retornar string vacio si no existe review", () => {
      assert.equal(useAppStore.getState().getReview("obra-x"), "");
    });

    test("deberia eliminar review", () => {
      useAppStore.setState({
        reviews: { "obra-1": "Muy buena" },
      });

      useAppStore.getState().deleteReview("obra-1");

      assert.deepEqual(useAppStore.getState().reviews, {});
    });
  });

  describe("theme", () => {
    test("deberia mantener theme dark al ejecutar toggleTheme", () => {
      useAppStore.getState().toggleTheme();

      assert.equal(useAppStore.getState().theme, "dark");
    });
  });

   describe("casos adicionales de errores y fallbacks", () => {
    test("loadFavorites captura error si backend responde no ok distinto de 401/403", async () => {
      const consoleErrorMock = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      localStorage.setItem("nl_token", "token");
      localStorage.setItem("nl_userId", "10");

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await useAppStore.getState().loadFavorites();

      assert.equal(consoleErrorMock.mock.calls.length, 1);
      assert.deepEqual(useAppStore.getState().myList, []);

      consoleErrorMock.mockRestore();
    });

    test("loadFavorites redirige si backend responde 403", async () => {
      localStorage.setItem("nl_token", "token");
      localStorage.setItem("nl_userId", "10");

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await useAppStore.getState().loadFavorites();

      assert.equal(window.location.href, "/login");
    });

    test("addToList usa fallbacks titulo, tipo, poster y source frontend", async () => {
      localStorage.setItem("nl_token", "token");
      localStorage.setItem("nl_userId", "10");

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const obra = {
        id: "obra-1",
        titulo: "Título fallback",
        tipo: "movie",
        poster: "poster-fallback.jpg",
      };

      await useAppStore.getState().addToList(obra);

      const body = JSON.parse(fetch.mock.calls[0][1].body);

      assert.deepEqual(body, {
        obraId: "obra-1",
        titulo: "Título fallback",
        tipo: "movie",
        poster: "poster-fallback.jpg",
        source: "frontend",
      });
    });

    test("addToList muestra mensaje por defecto si backend falla sin message", async () => {
      localStorage.setItem("nl_token", "token");
      localStorage.setItem("nl_userId", "10");

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await useAppStore.getState().addToList({
        id: "obra-1",
        title: "Matrix",
      });

      assert.equal(alert.mock.calls[0][0], "Error guardando favoritos");
    });

    test("addToList captura error inesperado y muestra alerta", async () => {
      const consoleErrorMock = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      localStorage.setItem("nl_token", "token");
      localStorage.setItem("nl_userId", "10");

      fetch.mockRejectedValueOnce(new Error("Fallo red"));

      await useAppStore.getState().addToList({
        id: "obra-1",
        title: "Matrix",
      });

      assert.equal(alert.mock.calls[0][0], "Error actualizando favoritos");
      assert.equal(consoleErrorMock.mock.calls.length, 1);

      consoleErrorMock.mockRestore();
    });

    test("removeFromList muestra alerta si backend falla", async () => {
      const consoleErrorMock = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      localStorage.setItem("nl_token", "token");
      localStorage.setItem("nl_userId", "10");

      fetch.mockResolvedValueOnce({
        ok: false,
      });

      await useAppStore.getState().removeFromList("movie-1");

      assert.equal(alert.mock.calls[0][0], "No errrrrrrrrroooor favoritos");
      assert.equal(consoleErrorMock.mock.calls.length, 1);

      consoleErrorMock.mockRestore();
    });
  });
});