/**
 * store/useAppStore.js — Estado global de no/limits
 * ══════════════════════════════════════════════════════════════
 *
 * Usa Zustand con el middleware `persist` para guardar datos en
 * localStorage. El estado se rehidrata automáticamente al recargar.
 *
 * SLICES:
 *  • user     — sesión del usuario (null = no autenticado)
 *  • myList   — obras guardadas personalmente
 *  • reviews  — reseñas personales por obraId
 *  • theme    — 'dark' (modo claro desactivado en v2.0)
 *
 * ── INTEGRACIÓN DEL BACKEND ───────────────────────────────────
 *
 *  AUTENTICACIÓN:
 *  Al hacer login exitoso, llamar: setUser({ id, name, email, token })
 *  El token se usará en services/api.js para el header Authorization.
 *
 *  SINCRONIZACIÓN DE LISTA:
 *  Hoy myList persiste solo en localStorage.
 *  Con backend, addToList/removeFromList deben llamar también a:
 *    POST   /api/user/list  → { obraId }
 *    DELETE /api/user/list/:obraId
 *  Y al inicio de sesión, cargar la lista desde el servidor:
 *    GET /api/user/list → reemplaza el myList local
 *
 *  SINCRONIZACIÓN DE RESEÑAS:
 *  Similar: setReview → POST /api/user/reviews
 *           deleteReview → DELETE /api/user/reviews/:obraId
 *
 *  TABLA DE DB RELACIONADA: users, user_lists, reviews (ver README.md)
 *
 * @module store/useAppStore
 */

//import { title } from 'motion/react-client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";

const useAppStore = create(
  persist(
    (set, get) => ({

      // ── USUARIO ─────────────────────────────────────────────
      // Estructura esperada del backend:
      // { id: string, name: string, email: string, token: string, avatar?: string }
      user: null,

      /**
       * Guarda el usuario tras un login exitoso.
       * El token en user.token se inyectará en services/api.js.
       * @param {{ id, name, email, token, avatar? }} user
       */
      setUser: (user) => set({ user }),

      /**
       * Limpia la sesión al hacer logout.
       * También limpiar localStorage.removeItem('auth_token') en el componente.
       */
      /*clearUser: () => set({ user: null }),*/
      clearUser: () => {
        localStorage.removeItem('nl_auth');
        localStorage.removeItem('nl_user');
        localStorage.removeItem('nl_userId');
        localStorage.removeItem('nl_role');
        localStorage.removeItem('nl_token');

        set({ user: null });
      },

      // ── MI LISTA ─────────────────────────────────────────────
      // Tabla relacionada: user_lists (user_id, obra_id, created_at)
      myList: [],

      loadFavorites: async () => {
        try {
          const token = localStorage.getItem("nl_token");
          const usuarioId = localStorage.getItem("nl_userId");

          if (!token || !usuarioId) return;

          const response = await fetch(
            `${API_BASE}/api/v1/usuarios/${usuarioId}/favoritos`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.status === 401 || response.status === 403) {
            // Token expirado → limpiar sesión y redirigir al login
            localStorage.clear();
            window.location.href = "/login";
            return;
          }

          if (!response.ok) {
            throw new Error("Error cargando favoritos");
          }

          const data = await response.json();
          const favoritosMapeados = data.map((fav) => ({
            id: fav.obraId,
            title: fav.titulo,
            type: fav.tipo,
            poster: fav.poster,
            source: fav.source,
          }));
          set({ myList: favoritosMapeados });

        } catch (error) {
          console.error(error);
        }
      },

      /**
       * Agrega una obra a la lista. Ignora duplicados.
       * INTEGRACIÓN BACKEND: también llamar POST /api/user/list
       * @param {Object} obra — Objeto normalizado al modelo Obra
       */
      addToList: async (obra) => {

        try {
          const token = localStorage.getItem("nl_token");

          const usuarioId = localStorage.getItem("nl_userId");

          if (!token || !usuarioId) {
            window.location.href = "/login";
            return;
          }

          const { myList } = get();

          if (
            myList.some(
              (item) => item.id === obra.id
            )
          ) {

            alert(
              "Esta obra ya está en favoritos"
            );

              return;
          }

          const response = await fetch(
            `${API_BASE}/api/v1/usuarios/${usuarioId}/favoritos`,
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                obraId: obra.id,

                titulo: obra.title || obra.titulo,

                tipo: obra.type || obra.tipo,

                poster: obra.image || obra.poster,

                source: obra.source || "frontend",
              }),
            }
          );

          if (!response.ok) {

            const error = 
              await response.json();

            console.log(
              "ERROR BACKEND:", error
            );

            alert(
              error.message ||
              "Error guardando favoritos"
            );
            return;
          }
          set({
            myList: [...myList, obra]
          });

        } catch (error) {
          console.error(error);

          alert(
            "Error actualizando favoritos"
          );
        }
      },

      /**
       * Elimina una obra de la lista por su ID compuesto.
       * INTEGRACIÓN BACKEND: también llamar DELETE /api/user/list/:obraId
       * @param {string} obraId — ej: "tmdb:movie:12345"
       */
      removeFromList: async (obraId) => {
        try {
          const token = localStorage.getItem("nl_token");

          const usuarioId = localStorage.getItem("nl_userId");

          if (!token || !usuarioId) {
            window.location.href = "/login";
            return;
          }

          const response = await fetch(
            `${API_BASE}/api/v1/usuarios/${usuarioId}/favoritos/${obraId}`,
            {
              method: "DELETE",

              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              "Error eliminando favorito"
            );
          }
          set((state) => ({
            myList: state.myList.filter(
              (item) => item.id !== obraId
            ),
          }));
        } catch (error) {
          console.error(error);

          alert(
            "No errrrrrrrrroooor favoritos"
          );
        }
       
      },

      /**
       * Alterna el estado de guardado de una obra.
       * @param {Object} obra
       */
      toggleList: (obra) => {
        const { isInList, addToList, removeFromList } = get();
        if (isInList(obra.id)) removeFromList(obra.id);
        else addToList(obra);
      },

      /** @param {string} obraId @returns {boolean} */
      isInList: (obraId) => get().myList.some((item) => item.id === obraId),

      // ── RESEÑAS ──────────────────────────────────────────────
      // Tabla relacionada: reviews (user_id, obra_id, content, rating, updated_at)
      // Hoy: { [obraId]: string }
      // Con backend: { [obraId]: { content: string, rating: number } }
      reviews: {},

      /**
       * Guarda o actualiza la reseña de una obra.
       * INTEGRACIÓN BACKEND: POST /api/user/reviews
       * @param {string} obraId
       * @param {string} text
       */
      setReview: (obraId, text) =>
        set((state) => ({ reviews: { ...state.reviews, [obraId]: text } })),

      /** @param {string} obraId @returns {string} */
      // eslint-disable-next-line security/detect-object-injection -- obraId es el id propio de la obra, no input externo sin validar
      getReview: (obraId) => get().reviews[obraId] ?? '',

      /**
       * Elimina la reseña.
       * INTEGRACIÓN BACKEND: DELETE /api/user/reviews/:obraId
       */
      deleteReview: (obraId) =>
        set((state) => {
          const updated = { ...state.reviews };
          // eslint-disable-next-line security/detect-object-injection -- obraId es el id propio de la obra, no input externo sin validar
          delete updated[obraId];
          return { reviews: updated };
        }),

      // ── TEMA ─────────────────────────────────────────────────
      // Modo claro desactivado en v2.0 (dark-first por diseño del brandbook).
      theme: 'dark',
      toggleTheme: () => { /* no-op: dark mode permanente en v2.0 */ },

    }),

    {
      name: 'nolimits-store',

      // Solo persiste estos campos — user NO se persiste (el token
      // debe revalidarse con el backend en cada sesión).
      partialize: (state) => ({
        user: state.user,
        myList:  state.myList,
        reviews: state.reviews,
        theme:   state.theme,
      }),
    }
  )
);

export default useAppStore;
