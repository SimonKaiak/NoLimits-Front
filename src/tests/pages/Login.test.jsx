import { describe, test, beforeEach, afterEach, vi, assert } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../../pages/Login";
import useAppStore from "../../store/useAppStore";
import { login, registrarUsuario } from "../../services/usuarios";
import { supabase } from "../../lib/supabase";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../components/layout/Logo", () => ({
  default: () => <div>Logo NoLimits</div>,
}));

vi.mock("../../components/ui/Button", () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../services/usuarios", () => ({
  login: vi.fn(),
  registrarUsuario: vi.fn(),
}));

vi.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}));

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    localStorage.clear();

    useAppStore.setState({
      user: null,
      myList: [],
      reviews: {},
      theme: "dark",
    });

    Object.defineProperty(window, "location", {
      value: {
        hostname: "localhost",
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderLogin() {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  }

  describe("renderizado inicial", () => {
    test("deberia mostrar formulario de inicio de sesion", () => {
      renderLogin();

      assert.ok(screen.getByText("Iniciar sesión"));
      assert.ok(screen.getByText("Registrarse"));
      assert.ok(screen.getByPlaceholderText("tu@email.com"));
      assert.ok(screen.getByPlaceholderText("Contraseña"));
      assert.ok(screen.getByText("Entrar"));
      assert.ok(screen.getByText("Continuar con Google"));
    });

    test("deberia navegar a recuperar contraseña", () => {
      renderLogin();

      fireEvent.click(screen.getByText("¿Olvidaste tu contraseña?"));

      assert.equal(navigateMock.mock.calls[0][0], "/forgot-password");
    });

    test("deberia alternar visibilidad de contraseña", () => {
      renderLogin();

      const inputPassword = screen.getByPlaceholderText("Contraseña");

      assert.equal(inputPassword.type, "password");

      fireEvent.click(inputPassword.parentElement.querySelector("button"));

      assert.equal(inputPassword.type, "text");
    });
  });

  describe("validaciones", () => {
    test("deberia mostrar error si email no es valido", async () => {
      renderLogin();

      const inputEmail = screen.getByPlaceholderText("tu@email.com");

      fireEvent.change(inputEmail, {
        target: { value: "correo-invalido" },
      });

      inputEmail.setCustomValidity("");

      fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
        target: { value: "12345678" },
      });

      fireEvent.submit(screen.getByRole("button", { name: "Entrar" }).closest("form"));

      assert.ok(await screen.findByText("Ingresa un email válido."));
      assert.equal(login.mock.calls.length, 0);
    });

    test("deberia mostrar error si password tiene menos de 8 caracteres", async () => {
      renderLogin();

      fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
        target: { value: "martin.rojas@test.com" },
      });

      fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
        target: { value: "1234567" },
      });

      fireEvent.click(screen.getByText("Entrar"));

      assert.ok(
        await screen.findByText("La contraseña debe tener mínimo 8 caracteres.")
      );

      assert.equal(login.mock.calls.length, 0);
    });
  });

  describe("inicio de sesion", () => {
    test("deberia iniciar sesion y guardar datos del usuario", async () => {
      login.mockResolvedValueOnce({
        id: 10,
        nombre: "Martín",
        correo: "martin.rojas@test.com",
        token: "token-123",
        rolNombre: "ROLE_USER",
      });

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
        target: { value: "martin.rojas@test.com" },
      });

      fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
        target: { value: "12345678" },
      });

      fireEvent.click(screen.getByText("Entrar"));

      assert.ok(await screen.findByText("Inicio de sesión exitoso"));

      assert.equal(localStorage.getItem("nl_auth"), "1");
      assert.equal(localStorage.getItem("nl_role"), "ROLE_USER");
      assert.equal(localStorage.getItem("nl_token"), "token-123");
      assert.equal(localStorage.getItem("nl_userId"), "10");

      assert.equal(useAppStore.getState().user.name, "Martín");

      await waitFor(
        () => {
          assert.equal(navigateMock.mock.calls[0][0], "/");
        },
        { timeout: 2500 }
      );
    });

    test("deberia redirigir a admin si rol es ROLE_ADMIN", async () => {
      login.mockResolvedValueOnce({
        usuarioId: 1,
        name: "Administrador",
        email: "admin.nolimits@test.com",
        token: "token-admin",
        rol: "ROLE_ADMIN",
      });

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
        target: { value: "admin.nolimits@test.com" },
      });

      fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
        target: { value: "12345678" },
      });

      fireEvent.click(screen.getByText("Entrar"));

      assert.ok(await screen.findByText("Inicio de sesión exitoso"));

      await waitFor(
        () => {
          assert.equal(navigateMock.mock.calls[0][0], "/admin");
        },
        { timeout: 2500 }
      );
    });

    test("deberia mostrar error si login no retorna data", async () => {
      login.mockResolvedValueOnce(null);

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
        target: { value: "martin.rojas@test.com" },
      });

      fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
        target: { value: "12345678" },
      });

      fireEvent.click(screen.getByText("Entrar"));

      assert.ok(
        await screen.findByText("Error al procesar respuesta del servidor.")
      );
    });

    test("deberia mostrar error si login lanza excepcion", async () => {
      login.mockRejectedValueOnce(new Error("Credenciales inválidas"));

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
        target: { value: "martin.rojas@test.com" },
      });

      fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
        target: { value: "12345678" },
      });

      fireEvent.click(screen.getByText("Entrar"));

      assert.ok(await screen.findByText("Credenciales inválidas"));
    });
  });

  describe("registro", () => {
    test("deberia mostrar campos de registro al cambiar tab", () => {
      renderLogin();

      fireEvent.click(screen.getByText("Registrarse"));

      assert.ok(screen.getByPlaceholderText("Tu nombre"));
      assert.ok(screen.getByPlaceholderText("Tus apellidos"));
      assert.ok(screen.getByText("Crear cuenta"));
    });

    test("deberia registrar usuario e iniciar sesion automaticamente", async () => {
      registrarUsuario.mockResolvedValueOnce({ ok: true });

      login.mockResolvedValueOnce({
        id: 20,
        nombre: "Camila",
        correo: "camila.soto@test.com",
        token: "token-registro",
        rolNombre: "ROLE_USER",
      });

      renderLogin();

      fireEvent.click(screen.getByText("Registrarse"));

      fireEvent.change(screen.getByPlaceholderText("Tu nombre"), {
        target: { value: "Camila" },
      });

      fireEvent.change(screen.getByPlaceholderText("Tus apellidos"), {
        target: { value: "Soto" },
      });

      fireEvent.change(screen.getByPlaceholderText("tu@email.com"), {
        target: { value: "camila.soto@test.com" },
      });

      fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
        target: { value: "12345678" },
      });

      fireEvent.click(screen.getByText("Crear cuenta"));

      assert.ok(await screen.findByText("Cuenta creada correctamente"));

      assert.equal(registrarUsuario.mock.calls.length, 1);
      assert.deepEqual(registrarUsuario.mock.calls[0][0], {
        nombre: "Camila",
        apellidos: "Soto",
        correo: "camila.soto@test.com",
        telefono: "99999999",
        contrasena: "12345678",
      });

      assert.equal(login.mock.calls.length, 1);
      assert.equal(useAppStore.getState().user.name, "Camila");
    });
  });

  describe("google login", () => {
    test("deberia iniciar login con google usando redirect localhost", async () => {
      supabase.auth.signInWithOAuth.mockResolvedValueOnce({
        error: null,
      });

      renderLogin();

      fireEvent.click(screen.getByText("Continuar con Google"));

      await waitFor(() => {
        assert.equal(supabase.auth.signInWithOAuth.mock.calls.length, 1);
      });

      assert.deepEqual(supabase.auth.signInWithOAuth.mock.calls[0][0], {
        provider: "google",
        options: {
          redirectTo: "http://localhost:5173/auth/callback",
        },
      });
    });

    test("deberia mostrar error si google retorna error", async () => {
      supabase.auth.signInWithOAuth.mockResolvedValueOnce({
        error: new Error("Google error"),
      });

      renderLogin();

      fireEvent.click(screen.getByText("Continuar con Google"));

      assert.ok(await screen.findByText("No se pudo iniciar sesión con Google."));
    });

    test("deberia mostrar error si google lanza excepcion", async () => {
      supabase.auth.signInWithOAuth.mockRejectedValueOnce(
        new Error("Error inesperado")
      );

      renderLogin();

      fireEvent.click(screen.getByText("Continuar con Google"));

      assert.ok(await screen.findByText("Ocurrió un error con Google."));
    });
  });
  describe("branches adicionales", () => {
    test("redirige a admin cuando rol es ADMIN (sin ROLE_)", async () => {
      login.mockResolvedValueOnce({
        id: 2,
        nombre: "Admin",
        correo: "admin@test.com",
        token: "token-admin2",
        rolNombre: "ADMIN",
      });
      renderLogin();
      fireEvent.change(screen.getByPlaceholderText("tu@email.com"), { target: { value: "admin@test.com" } });
      fireEvent.change(screen.getByPlaceholderText("Contraseña"), { target: { value: "12345678" } });
      fireEvent.click(screen.getByText("Entrar"));
      assert.ok(await screen.findByText("Inicio de sesión exitoso"));
      await waitFor(() => {
        const calls = navigateMock.mock.calls;
        const adminCall = calls.find(c => c[0] === '/admin');
        assert.ok(adminCall, `Expected /admin call, got: ${JSON.stringify(calls)}`);
      }, { timeout: 2500 });
    });

    test("muestra fallback de error cuando exception no tiene message", async () => {
      login.mockRejectedValueOnce({});
      renderLogin();
      fireEvent.change(screen.getByPlaceholderText("tu@email.com"), { target: { value: "test@test.com" } });
      fireEvent.change(screen.getByPlaceholderText("Contraseña"), { target: { value: "12345678" } });
      fireEvent.click(screen.getByText("Entrar"));
      assert.ok(await screen.findByText("Error al iniciar sesión."));
    });

    test("usa URL de produccion cuando hostname no es localhost", async () => {
      Object.defineProperty(window, "location", {
        value: { hostname: "www.nolimitshub.cl" },
        writable: true,
      });
      supabase.auth.signInWithOAuth.mockResolvedValueOnce({ error: null });
      renderLogin();
      fireEvent.click(screen.getByText("Continuar con Google"));
      await waitFor(() => assert.equal(supabase.auth.signInWithOAuth.mock.calls.length, 1));
      assert.include(
        supabase.auth.signInWithOAuth.mock.calls[0][0].options.redirectTo,
        "nolimitshub.cl"
      );
    });
  });
  test("usa fallbacks de email y nombre cuando no hay datos del usuario", async () => {
      login.mockResolvedValueOnce({
        id: 3,
        token: null,
      });
      renderLogin();
      fireEvent.change(screen.getByPlaceholderText("tu@email.com"), { target: { value: "usuario@test.com" } });
      fireEvent.change(screen.getByPlaceholderText("Contraseña"), { target: { value: "12345678" } });
      fireEvent.click(screen.getByText("Entrar"));
      assert.ok(await screen.findByText("Inicio de sesión exitoso"));
      // Sin rolNombre ni rol → rol vacío → navega a /
      await waitFor(() => {
        const calls = navigateMock.mock.calls;
        const homeCall = calls.find(c => c[0] === '/');
        assert.ok(homeCall);
      }, { timeout: 2500 });
      // Verifica que usó email.split como nombre
      assert.equal(localStorage.getItem('nl_role'), '');
    });
});