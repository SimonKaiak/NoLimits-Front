import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { supabase } from "@/lib/supabase";

import {
  obtenerMiPerfil,
  actualizarMiPerfil,
  cambiarPassword,
  cambiarCorreo,
} from "../services/usuarios";

import {
  User,
  Phone,
  Lock,
  Mail,
  Camera,
  Trash2
} from "lucide-react";

// =========================
// ESTILOS
// =========================

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#999",
  fontSize: "14px",
};

const inputStyle = {
  width: "100%",
  background: "#050505",
  border: "1px solid #222",
  borderRadius: "16px",
  padding: "16px",
  color: "white",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
  transition: "all .25s ease",

};
const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";
// =========================
// COMPONENTE
// =========================

function Profile() {

  // =========================
  // STATES
  // =========================

  const [usuario, setUsuario] = useState(null);

  const [loading, setLoading] = useState(true);
  const [subiendoFoto, setSubiendoFoto]= useState(false);
  const [imgError, setImgError] = useState(false);

  const [mensajeNombre, setMensajeNombre] = useState("");
  const [mensajeTelefono, setMensajeTelefono] = useState("");
  const [mensajePassword, setMensajePassword] = useState("");

  const [showPasswordCorreo, setShowPasswordCorreo] = useState(false);

  // =========================
  // CORREO
  // =========================

  const [correoData, setCorreoData] = useState({
    nuevoCorreo: "",
    passwordCorreo: "",
    passwordActual: "",
  });

  const [mensajeCorreo, setMensajeCorreo] = useState("");
  const [savingCorreo, setSavingCorreo] = useState(false);


  const [savingNombre, setSavingNombre] = useState(false);
  const [savingTelefono, setSavingTelefono] = useState(false);
  

  // =========================
  // FORMULARIO PERFIL
  // =========================

  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    fotoPerfil: "",
  });

  // =========================
  // PASSWORD
  // =========================

  const [passwordData, setPasswordData] = useState({
    passwordActual: "",
    nuevaPassword: "",
    confirmarPassword: "",
  });

  // =========================
  // OJITOS PASSWORD
  // =========================

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  // =========================
  // EFFECT
  // =========================

  useEffect(() => {

    const token =
      localStorage.getItem("nl_token");

    if (!token) {

      localStorage.clear();

      window.location.href = "/login";

      return;
    }
    cargarPerfil();
  }, []);

  // =========================
  // CARGAR PERFIL
  // =========================

  const cargarPerfil = async () => {
    try {
      const data = await obtenerMiPerfil();

      const usuarioLocal = JSON.parse(
        localStorage.getItem("nl_user") || "null"
      );

      const esGoogle =
        data.proveedor === "google" ||
        usuarioLocal?.proveedor === "google" ||
        data.apellidos === "Google";

      setUsuario({
        ...data,
        proveedor: esGoogle ? "google" : data.proveedor,
      });

      setFormData({
        nombre: esGoogle
          ? (data.nombre || "").trim()
          : `${data.nombre || ""} ${data.apellidos || ""}`.trim(),

        telefono: data.telefono
          ? `${String(data.telefono).slice(0, 1)} ${String(data.telefono).slice(1)}`
          : "",

        fotoPerfil: data.fotoPerfil || "",
      });

    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ACTUALIZAR NOMBRE
  // =========================

  const guardarNombre = async () => {

    try {

      setSavingNombre(true);
      setMensajeNombre("");

      if (!formData.nombre?.trim()) {
        setMensajeNombre(
          "El nombre no puede estar vacío"
        );

        setTimeout(() => {
          setMensajeNombre("");
        }, 3000);

        setSavingNombre(false);

        return;
      }

      await actualizarMiPerfil({
        nombre: formData.nombre,
      });

      setUsuario({
        ...usuario,
        nombre: formData.nombre,
      });

      setMensajeNombre(
        "Nombre actualizado correctamente"
      );

      setTimeout(() => {
        setMensajeNombre("");
      }, 3000);

    } catch (error) {

      console.error(error);

      setMensajeNombre(
        "Error actualizando nombre"
      );

    } finally {

      setSavingNombre(false);
    }
  };

  // =========================
  // ACTUALIZAR TELEFONO
  // =========================

  const guardarTelefono = async () => {

    try {

      setSavingTelefono(true);
      setMensajeTelefono("");

      if (!formData.telefono?.trim()) {

        setMensajeTelefono(
          "El Campo teléfono no puede estár vacío"
        );
        setTimeout(() => {
          setMensajeTelefono("");
        }, 3000);
        setSavingTelefono(false);
        return;
      }

      const telefonoLimpio =
        formData.telefono.replace(/\s/g, "");
      
      if (telefonoLimpio.length !== 9) {
        setMensajeTelefono(
          "El telefono debe tener 9 dígitos"
        );

        setTimeout(() => {
          setMensajeTelefono("");
        }, 3000);

        setSavingTelefono(false);

        return;
      }

      await actualizarMiPerfil({
        telefono: telefonoLimpio,
      });
      setUsuario({
        ...usuario,
        telefono: formData.telefono,
      });

      setMensajeTelefono(
        "Teléfono actualizado correctamente"
      );

      setTimeout(() => {
        setMensajeTelefono("");
      }, 3000);

    } catch (error) {

      console.error(error);

      setMensajeTelefono(
        "Error actualizando teléfono"
      );

    } finally {

      setSavingTelefono(false);
    }
  };

  // =========================
  // CAMBIAR CORREO
  // =========================

  const guardarCorreo = async () => {

    try {

      setSavingCorreo(true);
      setMensajeCorreo("");

      if (
        !correoData.nuevoCorreo?.trim() ||
        !correoData.passwordActual?.trim()
      ) {
        setMensajeCorreo(
          "Debes completar todos los campos"
        );
        setTimeout(() => {
          setMensajeCorreo("");
        }, 3000);
        return;
      } 
      await cambiarCorreo({
        nuevoCorreo:
          correoData.nuevoCorreo,

        passwordActual:
          correoData.passwordActual,
      });
      setMensajeCorreo(
        "Correo actualizado correctamente. Debes iniciar sesión nuevamente."
      );

      localStorage.clear();

      setTimeout(() => {
        window.location.href =
          "/login";
      }, 2000);
    } catch (error) {
        console.error(error);

        setMensajeCorreo(
          error.message ||
          "Error actualizando correo"
        );
    } finally {
      setSavingCorreo(false);
    }
    
  };
  //==========================
  // ELIMINAR CUENTA
  //==========================
  const eliminarCuenta = async () => {

    const confirmar = window.confirm(
      "¿Estás seguro de eliminar tu cuenta?"
    );

    if (!confirmar) return;

    try {
      const token = localStorage.getItem("nl_token");

      const response = await fetch(
        `${API_BASE}/api/v1/usuarios/eliminar-cuenta`,

        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =await response.text();

      if (!response.ok) {
        throw new Error(data);
      }
      
      localStorage.clear();

      setUsuario(null);
      setLoading(true);

      alert(data ||"Cuenta eliminada correctamente");

      window.location.replace("/login");

    } catch (error) {

      console.error(error);

      alert(error.message);
    }
  };

  //==========================
  // SUBIR FOTO PERFIL
  //==========================
  const subirFotoPerfil = async (e) => {

    try {
      setSubiendoFoto(true);

      const file = e.target.files[0];
      if (!file) return;

      const nombreArchivo =
        `${Date.now()}-${file.name}`;
      
      const { error } = await supabase
        .storage
        .from("avatars")
        .upload(
          nombreArchivo,
          file
        );
      if (error) {
        throw error;
      }
      const {
        data: { publicUrl },
      } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(nombreArchivo);

      //await actualizarMiPerfil({
      //  fotoPerfil: publicUrl,
      //});
      console.log("PUBLIC URL:", publicUrl);

      const response = await actualizarMiPerfil({
        fotoPerfil: publicUrl,
      });

      console.log("RESPUESTA PATCH:", response);

      await cargarPerfil();

      setImgError(false);
    } catch (error) {
      console.error(
        "Error subiendo foto:",
        error
      );
    
    } finally {
      setSubiendoFoto(false);
    }
  };

  // =========================
  // CAMBIAR PASSWORD
  // =========================

  const guardarNuevaPassword = async () => {

    try {

      setMensajePassword("");

      if (
        !passwordData.passwordActual?.trim() ||
        !passwordData.nuevaPassword?.trim() ||
        !passwordData.confirmarPassword?.trim()
      ) {
        setMensajePassword(
          "Error: Debes completar todos los campos"
        );
        setTimeout(() => {
          setMensajePassword("");
        }, 3000);
        return;
      }

      if (
        passwordData.nuevaPassword !==
        passwordData.confirmarPassword
      ) {

        setMensajePassword(
          "Error: Las contraseñas no coinciden"
        );
        setTimeout(() => {
          setMensajePassword("");
        }, 3000);

        return;
      }

      if (
        passwordData.nuevaPassword.length < 8
      ) {

        setMensajePassword(
          "Error: La contraseña debe tener mínimo 8 caracteres"
        );
        setTimeout(() => {
          setMensajePassword("");
        }, 3000);

        return;
      }

      await cambiarPassword({
        passwordActual:
          passwordData.passwordActual,

        nuevaPassword:
          passwordData.nuevaPassword,
      });

      setMensajePassword(
        "Contraseña actualizada correctamente"
      );

      setPasswordData({
        passwordActual: "",
        nuevaPassword: "",
        confirmarPassword: "",
      });

      setTimeout(() => {
        setMensajePassword("");
      }, 3000);

    } catch (error) {

      console.error(error);

      setMensajePassword(
        "Error cambiando contraseña"
      );
      setTimeout(() => {
        setMensajePassword("");
      }, 3000);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: "22px",
        }}
      >
        Cargando perfil...
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (!usuario || !localStorage.getItem("nl_token")) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#ff4d4d",
          fontSize: "22px",
        }}
      >
        Error cargando perfil
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "white",
        padding: "60px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          position: "relative"
        }}
      >
        <button
          type="button"
          onClick={() => window.location.href = "/"}
          style={{
             position: "absolute",
            top: "-10px",
            left: "-120px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(20,20,20,.75)",  
            border:  "1px solid rgba(255,255,255,.08)",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize:"14px",
            backdropFilter: "blur(8px)",
            zIndex: 20,
            transition: "all .25s ease",
          
          }}
        >
            ← Volver

        </button>

        {/* HERO */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "32px",
            marginBottom: "60px",
            padding: "20px 10px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg,#ff4d4d,#ff1f1f)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "clamp(32px, 8vw, 48px)",
              fontWeight: "800",
              border:
                "4px solid rgba(255,255,255,.06)",
              boxShadow:
                "0 0 40px rgba(255,77,77,.35)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {usuario?.fotoPerfil && !imgError ?(

              <img
                src={usuario?.fotoPerfil}
                alt= "Perfil"
                onError={() => 
                  setImgError(true)
                }
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            ) : (
              usuario?.nombre?.charAt(0)
            )}
          </div>

          <label
            style={{
              cursor: "pointer",
              marginTop: "12px",
              display: "flex",
              alignItems:"center",
              gap: "8px",
              color: "#aaa",
              fontSize: "14px",
            }}
          >
            <>
            <Camera size={16}/>

            <span>
              {subiendoFoto
                ? "Subiendo..."
                :"cambiar foto"}
            </span>
            </>
            <input
              type= "file"
              accept="image/*"
              style={{ display: "none"}}
              onChange={subirFotoPerfil}
            />

          </label>

          <div>
            <p
              style={{
                color: "#888",
                fontSize: "13px",
                marginBottom: "10px",
                letterSpacing: ".5px",
              }}
            >
              Bienvenido a tu perfil
            </p>

            <h1
              style={{
                fontSize: "clamp(38px,8vw,56px)",
                wordBreak: "break-word",
                fontWeight: "800",
                margin: 0,
                lineHeight: 1,
                color: "white",

              }}
            >
              {usuario?.proveedor === "google"
                ? usuario?.nombre
                : `${usuario?.nombre || ""} ${usuario?.apellidos || ""}`.trim()}
            </h1>
          </div>
        </div>
        
        {/* PERFIL */}
        <div
          style={{
            background: 
              "linear-gradient(180deg,rgba(18,18,18,.95),rgba(8,8,8,.98))",
            border: 
              "1px solid rgba(255,255,255,.06)",
            backdropFilter: "blur(12px)", 
            boxShadow:
              "0 0 40px rgba(0,0,0,.35)",

            borderRadius: "30px",
            padding: "clamp(20px,5vw,48px)",
            marginBottom: "40px",
            
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "16px",
                background:
                  "linear-gradient(180deg,#401313,#2a0d0d)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow:
                "0 0 20px rgba(255,0,0,.18)",
              }}    
            >
              <User size={24} color="#ff4d4d" />

            </div>
            <h2
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: "800",
              }}  
            >
              Información personal

            </h2>

          </div>

          <p
            style={{
              color: "#888",
              marginBottom: "28px",
              fontSize: "14px",
              textAlign: "center",

            }}
          >
            Editar tu información personal
          </p>

          <div
            style={{
              display: "grid",
              gap: "24px",
              width: "100%",
              maxWidth: "500px",
              margin: "0 auto",
            }}
          >
            {/* NOMBRE COMPLETO*/}
            <div>
              <label style={labelStyle}>
                Nombre completo
              </label>

              <input
                value={formData.nombre || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nombre: e.target.value,
                  })
                }
                style={inputStyle}
              />
              <button
                type="button"
                onClick={guardarNombre}
                disabled={savingNombre}
                style={{
                  width: "100%",
                  marginTop: "18px",
                  background:
                    "linear-gradient(180deg,#ff2d2d,#d90000)",
                  boxShadow:
                    "0 10px 30px rgba(255,0,0,.25)",
                  borderRadius: "14px",
                  fontWeight: "700",
                  transition: "all .25s ease",


                  color: "white",
                  border: "none",
                  padding: "12px",
                  cursor:
                    savingNombre
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {savingNombre
                  ? "Guardando..."
                  : "Actualizar nombre"}
              </button>

              {mensajeNombre && (

                <div
                  style={{
                    marginTop: "14px",
                    padding: "14px",
                    borderRadius: "10px",
                    background:
                      mensajeNombre.includes("Error")
                        ? "#3b1111"
                        : "#113b1c",

                    color:
                      mensajeNombre.includes("Error")
                        ? "#ff8b8b"
                        : "#86efac",

                    border:
                      mensajeNombre.includes("Error")
                        ? "1px solid #ff4d4d"
                        : "1px solid #4ade80",
                  }}
                >
                  {mensajeNombre}
                </div>

              )}
            </div>

            {/* TELEFONO */}
            <div>
              <label style={labelStyle}>
                Teléfono
              </label>

              <input
                type="tel"
                placeholder="EJ: 9 23456789"
                value={formData.telefono || ""}
                onChange={(e) => {
                  let valor = e.target.value;

                  //Solo números
                  valor = valor.replace(/\D/g, "");

                  //máximo 9 dígitos
                  valor = valor.slice(0, 9);

                  //formato visual
                  if (valor.length > 1) {
                    valor =
                      valor.slice(0, 1) +
                      " " +
                      valor.slice(1);
                  }
                  setFormData({
                    ...formData,
                    telefono: valor,
                  });
                }}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={guardarTelefono}
                disabled={savingTelefono}
                style={{
                  width: "100%",
                  marginTop: "18px",
                  background:
                    "linear-gradient(180deg,#ff2d2d,#d90000)",
                  boxShadow:
                    "0 10px 30px rgba(255,0,0,.25)",
                  borderRadius: "14px",
                  fontWeight: "700",
                  transition: "all .25s ease",

                  color: "white",
                  border: "none",
                  padding: "12px",
                  cursor:
                    savingTelefono
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {savingTelefono
                  ? "Guardando..."
                  : "Actualizar teléfono"}
              </button>

                {mensajeTelefono && (

                  <div
                    style={{
                      marginTop: "14px",
                      padding: "14px",
                      borderRadius: "10px",
                      background:
                        mensajeTelefono.includes("Error")
                          ? "#3b1111"
                          : "#113b1c",

                      color:
                        mensajeTelefono.includes("Error")
                          ? "#ff8b8b"
                          : "#86efac",

                      border:
                        mensajeTelefono.includes("Error")
                          ? "1px solid #ff4d4d"
                          : "1px solid #4ade80",
                    }}
                  >
                    {mensajeTelefono}
                  </div>

                )}
            </div>
          </div>
          </div>
          {/* SEGURIDAD */}
          <div
            style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: "24px",
              padding: "clamp(20px, 4vw, 40px)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "28px",
              }}  
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "16px",
                  background:
                    "linear-gradient(180deg,#401313,#2a0d0d)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow:
                    "0 0 20px rgba(255,0,0,.18)",
                }}
              >
                <Lock size={24} color="#ff4d4d"/>
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: "800",
                }}  
              >
                Seguridad
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gap: "20px",
                width: "100%",
                maxWidth: "500px",
                margin: "0 auto",
              }}
            >
              {/* CAMBIAR CORREO */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap:  "24px",
                  marginBottom: "40px",
                }}
              >
                {/* NUEVO CORREO */}
                <div style={{ display: "flex", flexDirection: "column", gap: "18px", }}>
                  <label style={labelStyle}>
                    Nuevo correo
                  </label>

                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <input
                    type="email"
                    autoComplete="off"
                    value={correoData.nuevoCorreo}
                    onChange={(e) =>
                      setCorreoData({
                        ...correoData,
                        nuevoCorreo: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                  <div
                    style={{
                      position: "relative",
                      marginTop: "18px",
                    }}
                  >
                    <input
                      type={
                        showPasswordCorreo
                          ? "text"
                          :"password"
                      }
                      autoComplete="new-password"
                     
                      value={
                        correoData.passwordActual || ""
                      }
                      onChange={(e) =>
                        setCorreoData({
                          ...correoData,
                          passwordActual:
                          e.target.value,
                        })
                      }
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswordCorreo(
                          !showPasswordCorreo
                        )
                      }
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform:
                          "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "#999",
                        cursor: "pointer",
                      }}    
                    >
                      {showPasswordCorreo
                        ? <EyeOff size={20} />
                        : <Eye size={20} />}

                    </button>

                  </div>

                  </div>
                    <button
                    type="button"
                    onClick={guardarCorreo}
                    disabled={savingCorreo}
                    style={{
                      width: "100%",
                      background:
                        savingCorreo
                          ? "#666"
                          : "linear-gradient(180deg,#ff2d2d,#d90000)",
                      boxShadow:
                        "0 6px 18px rgba(255,0,0,.22)",
                      borderRadius: "14px",
                      fontWeight: "700",
                      transition: "all .25s ease",

                      color: "white",
                      border: "none",
                      padding: "14px",
                      cursor:
                        savingCorreo
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                  {savingCorreo
                    ? "Actualizando..."
                    : "Actualizar correo"}
                    </button>

                {mensajeCorreo && (
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      background:
                        mensajeCorreo.includes("Error")
                          ? "#3b1111"
                          : "#113b1c",

                      color:
                        mensajeCorreo.includes("Error")
                          ? "#ff8b8b"
                          : "#86efac",

                      border:
                        mensajeCorreo.includes("Error")
                          ? "1px solid #ff4d4d"
                          : "1px solid #4ade80",
                    }}
                  >
                    {mensajeCorreo}
                  </div>
                )}
              </div>
                
                </div>
                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid #222",
                      marginBottom: "40px",
                    }}
                  />

                {/* PASSWORD ACTUAL */}
                <div>

                  <label style={labelStyle}>
                    Contraseña actual
                  </label>

                  <div
                    style={{
                      position: "relative",
                    }}
                  >
                    <input
                      type={
                        showActual
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      value={
                        passwordData.passwordActual || ""
                      }
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          passwordActual:
                            e.target.value,
                        })
                      }
                      style={inputStyle}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowActual(!showActual)
                      }
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform:
                          "translateY(-50%)",

                        background: "transparent",
                        border: "none",
                        color: "#999",
                        cursor: "pointer",
                      }}
                    >
                      {showActual
                        ? <EyeOff size={20} />
                        : <Eye size={20} />}
                    </button>

                  </div>
                </div>
          
                  {/* NUEVA PASSWORD */}
                <div>
                  <label style={labelStyle}>
                    Nueva contraseña
                  </label>

                  <div
                    style={{
                      position: "relative",
                    }}
                  >
                    <input
                      type={
                        showNueva
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      value={
                        passwordData.nuevaPassword || ""
                      }
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          nuevaPassword:
                            e.target.value,
                        })
                      }
                      style={inputStyle}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNueva(!showNueva)
                      }
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform:
                          "translateY(-50%)",

                        background: "transparent",
                        border: "none",
                        color: "#999",
                        cursor: "pointer",
                      }}
                    >
                      {showNueva
                        ? <EyeOff size={20} />
                        : <Eye size={20} />}
                    </button>

                  </div>
                </div>

                  {/* CONFIRMAR PASSWORD */}
                <div>
                  <label style={labelStyle}>
                    Confirmar contraseña
                  </label>

                  <div
                    style={{
                    position: "relative",
                    }}
                  >
                    <input
                      type={
                        showConfirmar
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      value={
                        passwordData.confirmarPassword || ""
                      }
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmarPassword:
                            e.target.value,
                        })
                      }
                      style={inputStyle}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmar(
                          !showConfirmar
                        )
                      }
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform:
                          "translateY(-50%)",

                        background: "transparent",
                        border: "none",
                        color: "#999",
                        cursor: "pointer",
                      }}
                    >
                      {showConfirmar
                        ? <EyeOff size={20} />
                        : <Eye size={20} />}
                    </button>

                  </div>
                </div>
              
        
                </div>
                  {/* BOTON PASSWORD */}
                  <div
                    style={{
                    marginTop: "45px",
                    display: "flex",
                    justifyContent: "center",
                    }}
                  >

                    <button
                      type="button"
                      onClick={guardarNuevaPassword}
                      style={{
                        background:  "linear-gradient(180deg,#ff2d2d,#d90000)",
                        color: "white",
                        border: "none",
                        padding: "14px 28px",
                        borderRadius: "14px",
                        fontSize: "16px",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all .25s ease",
                      }}
                    >
                      Cambiar contraseña
                    </button>

                  </div>

                    {/* MENSAJE PASSWORD */}
                  {mensajePassword && (
                    <div
                      style={{
                        marginTop: "24px",
                        padding: "18px",
                        borderRadius: "12px",
                        background:
                          mensajePassword.includes("Error")
                            ? "#3b1111"
                            : "#113b1c",

                        border:
                          mensajePassword.includes("Error")
                            ? "1px solid #ff4d4d"
                            : "1px solid #4ade80",

                        color:
                          mensajePassword.includes("Error")
                            ? "#ff8b8b"
                            : "#86efac",

                        fontWeight: "500",
                      }}
                    >
                      {mensajePassword}
                    </div>
                  )}

                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid #222",
                      margin: "40px 0",
                      
                    }}
                  />

                  {/* ELIMINAR CUENTA */}
                  <div>

                    <h3
                      style={{
                        color: "#ff4d4d",
                        marginBottom: "14px",
                        fontSize: "22px",
                        textAlign: "center",
                      }}
                    >
                      Eliminar cuenta
                    </h3>

                    <p
                      style={{
                        color: "#888",
                        marginBottom: "20px",
                        textAlign: "center",
                      }}
                    >
                      Esta acción eliminará permanentemente tu cuenta.
                    </p>

                    <button
                      type="button"
                      onClick={eliminarCuenta}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",

                        margin: "0 auto",
                        background: 
                          "linear-gradient(180deg,#ff2d2d,#b80000)",
                        color: "white",
                        border: "none",
                        padding: "14px 24px",
                        borderRadius: "14px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={18}/>
                      <span>Eliminar cuenta</span>
                    </button>
                  </div>
            </div>
        </div>
    </div> 
  );
}

export default Profile;