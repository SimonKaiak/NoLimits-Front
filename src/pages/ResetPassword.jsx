import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Eye, EyeOff } from "lucide-react";
const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";


export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const navigate = useNavigate();

  async function handleUpdate(e) {
    e.preventDefault();

    // eslint-disable-next-line security/detect-possible-timing-attacks -- son dos campos de un formulario (no un secreto contra un valor guardado), comparar en tiempo constante no aporta nada aquí
    if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      const correo = localStorage.getItem("reset_email");

      const response = await fetch(
         `${API_BASE}/api/v1/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            correo,
            password,
            }),
        }
    );

    const data = await response.text();

    if (!response.ok) {
        setError(data);
        return;
    }

    setMessage('Contraseña actualizada correctamente.');

    setTimeout(() => {
        navigate('/login');
    }, 1500);
    } catch {
      setError('Ocurrió un error.');
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
      }}
    >
      <form
        onSubmit={handleUpdate}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '32px',
          border: '1px solid var(--nl-border)',
          borderRadius: '16px',

          background:  '#111827',
        }}
      >
        <h2 style={{ marginBottom: '20px',  color: 'white', }}>
          Nueva contraseña
        </h2>

        <div
          style={{
            position: "relative",
            marginBottom: "20px",
          }}
        >
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{
              width: "100%",
              height: "52px",
              padding: "0 50px 0 16px",
              borderRadius: "12px",
              border: "1px solid #444",
              background: "#1e1e1e",
              color: "white",
              fontSize: "15px",
              caretColor: "white",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#aaa",
            }}
          >
            {showPassword ? (
              <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
          </button>
        </div>

        <div
          style={{
            position: "relative",
            marginBottom: "24px",
          }}
        >
          <input
            type={
              showConfirmPassword ? "text" : "password"
            }
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            required
            style={{
              width: "100%",
              height: "52px",
              padding: "0 50px 0 16px",
              borderRadius: "12px",
              border: "1px solid #444",
              background: "#1e1e1e",
              color: "white",
              fontSize: "15px",
              caretColor: "white",
              outline: "none",
            }}
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(
                !showConfirmPassword
              )
            }
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#aaa",
            }}
          >
           {showConfirmPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )} 
          </button>
        </div>

        <button
          style={{
            width: '100%',
            height: '52px',
            cursor: 'pointer',
            border: 'none',
            borderRadius: '12px',
            background:
              'linear-gradient(135deg, #ff4d4f, #ff2d55)',
            color: 'white',
            fontWeight: '700',
            fontSize: '16px',

          }}
        >
          {loading ? 'Actualizando...' : 'Guardar contraseña'}
        </button>

        {message && (
          <p style={{ color: '#4ade80', marginTop: '16px' }}>
            {message}
          </p>
        )}

        {error && (
          <p style={{ color: '#ff4d4f', marginTop: '16px' }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}