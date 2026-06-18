import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import useAppStore from '@/store/useAppStore';

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "https://nolimits-backend-final.onrender.com"
).replace(/\/+$/, "");

export default function AuthCallback() {
  const navigate = useNavigate();

  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    const finishGoogleLogin = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error(error);
          navigate("/login");
          return;
        }

        if (data?.session?.user) {
          const user = data.session.user;

           const userData = {
            id: user.id,
            name:
              user.user_metadata?.full_name ||
              user.email?.split('@')[0],

            email: user.email,
            token: data.session.access_token,
            avatar: user.user_metadata?.avatar_url || null,
            role: 'USER',
          };

          localStorage.setItem('nl_auth', '1');
          localStorage.setItem('nl_user', JSON.stringify(userData));
          localStorage.setItem('nl_token', data.session.access_token);

          setUser(userData);

          // ==============================
          // SINCRONIZAR CON BACKEND
          // ==============================
          const response = await fetch(
            `${API_BASE}/api/v1/auth/google/sync`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                correo: user.email || "",
                nombre:
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  "",
              }),
            }
          );

          if (!response.ok) {
            const txt = await response.text();
            console.error("Error sincronizando usuario Google:", txt);
            navigate("/login");
            return;
          }

          const backendUser = await response.json();

          // ==============================
          // USUARIO FINAL
          // ==============================
          const usuarioGoogle = {
            id: user.id, // ID de Supabase
            backendId: backendUser.id, // ID real del backend
            correo: user.email || "",
            email: user.email || "",
            nombre:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "",
            apellidos: "",
            telefono: "",
            avatar: user.user_metadata?.avatar_url || "",
            proveedor: "google",
            rol: backendUser.rolNombre || "USER",
            rolNombre: backendUser.rolNombre || "USER",
          };

          // ==============================
          // LOCAL STORAGE
          // ==============================
          localStorage.setItem("nl_auth", "1");
          localStorage.setItem("nl_user", JSON.stringify(usuarioGoogle));

          // ID REAL DEL BACKEND
          localStorage.setItem(
            "nl_userId",
            String(backendUser.id)
          );

          localStorage.setItem(
            "nl_role",
            backendUser.rolNombre || "USER"
          );

          localStorage.setItem(
            "nl_token",
            backendUser.token
          );

          localStorage.setItem(
            "nl_supabase_token",
            data.session.access_token
          );

          navigate("/");
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };

    finishGoogleLogin();
  }, [navigate, setUser]);

  return (
    <p style={{ padding: "20px" }}>
      Iniciando sesión con Google...
    </p>
  );
}