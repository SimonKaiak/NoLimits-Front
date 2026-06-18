import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function handleReset(e) {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");
            setMessage("");

            localStorage.setItem("reset_email", email);

            const {error} = await  supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://localhost:5173/reset-password',
            });

            if (error) {
                setError(error.message);
                return;
            }

            setMessage("Revisa tu correo para restablecer tu contraseña.");
        } catch {
            setError("Ocurrió un error al intentar restablecer la contraseña.");
        } finally {
            setLoading(false);
        }
        
        }
        
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                        "radial-gradient(circle at top, #1f1f1f 0%, #050505 70%)",
                    padding: "20px",
                }}
            >
                 <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "rgba(255,255,255,0.96)",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
        }}
      >
        <h1
          style={{
            fontSize: "40px",
            fontWeight: "700",
            marginBottom: "20px",
            color: "#111",
          }}
        >
          Restablecer contraseña
        </h1>

        <p
          style={{
            color: "#555",
            fontSize: "18px",
            lineHeight: "1.6",
            marginBottom: "32px",
          }}
        >
          Ingresa tu correo electrónico y te enviaremos un
          enlace para restablecer tu contraseña.
        </p>

        <form onSubmit={handleReset}>
          <label
            style={{
              display: "block",
              marginBottom: "10px",
              color: "#333",
              fontWeight: "500",
            }}
          >
            Correo electrónico
          </label>

          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              height: "56px",
              padding: "0 16px",
              borderRadius: "14px",
              border: "1px solid #ddd",
              fontSize: "16px",
              outline: "none",
              marginBottom: "24px",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "56px",
              border: "none",
              borderRadius: "14px",
              background:
                "linear-gradient(135deg, #ff4d4f, #ff2d55)",
              color: "white",
              fontSize: "18px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>

          {message && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                borderRadius: "12px",
                background: "#ecfdf3",
                color: "#15803d",
                border: "1px solid #bbf7d0",
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                borderRadius: "12px",
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}
        </form>

        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            marginTop: "28px",
            background: "none",
            border: "none",
            color: "#555",
            cursor: "pointer",
            fontSize: "15px",
          }}
        >
          ← Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}
               