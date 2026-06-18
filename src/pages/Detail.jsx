/**
 * pages/Detail.jsx
 * Ficha completa de una obra — rediseñada con elementos de marca no/limits.
 *
 * Layout:
 *  [Backdrop hero 520px — título superpuesto]
 *  [Poster col (220px fijo)] | [Info col (flex:1) — rating · géneros · synopsis · reseña]
 *  [Más de esta saga — si obra.saga existe]
 *
 * La sinopsis y la reseña están DENTRO de la columna derecha para que
 * ambas columnas tengan masa visual equivalente.
 */

import { useParams, useNavigate }       from 'react-router-dom';
import { useState, useEffect }          from 'react';
import { motion }                       from 'motion/react';
import {
  ArrowLeft, BookmarkPlus, BookmarkCheck,
  Star, Calendar, Layers, ExternalLink,
} from 'lucide-react';
import Badge          from '@/components/ui/Badge';
import Button         from '@/components/ui/Button';
import WhereToFind    from '@/components/ui/WhereToFind';
import ContentSection from '@/components/sections/ContentSection';
import { useMovieDetail, useSeriesDetail } from '@/hooks/useTMDB';
import { useAnimeDetail }                  from '@/hooks/useJikan';
import { useGameDetail }                   from '@/hooks/useRAWG';
import { useBookDetail }                   from '@/hooks/useOpenLibrary';
import { useMusicDetail }                  from '@/hooks/useMusicBrainz';
import { fetchMovieProviders, fetchSeriesProviders } from '@/services/whereToWatch';
import { useSagaSearch }   from '@/hooks/useSearch';
import useAppStore         from '@/store/useAppStore';
import { parseMediaSlug }  from '@/utils/formatters';
import { DATA_SOURCES, MEDIA_TYPES } from '@/utils/constants';
import { obtenerProducto } from '@/services/productos';
import {
  guardarReview,
  obtenerReviewsPorObra,
  eliminarReview,
  reaccionarReview
} from '@/services/reviewService';
import { translateToSpanish } from '@/utils/translateText';

/* ── Etiqueta de sección estilo brandbook ─────────────────── */
function SectionLabel({ number, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-3)' }}>
      <span
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '11px',
          color:         'var(--nl-accent)',
          letterSpacing: '0.04em',
          flexShrink:    0,
        }}
      >
        {String(number).padStart(2, '0')}
      </span>
      <span
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color:         '#ffffff',
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: '1px', background: 'var(--nl-border)' }} />
    </div>
  );
}

/* ── Chip de género ───────────────────────────────────────── */
function GenreChip({ label }) {
  return (
    <span
      style={{
        padding:      '4px 12px',
        borderRadius: '20px',
        background:   'var(--nl-bg-subtle)',
        border:       '1px solid var(--nl-border)',
        fontSize:     '12px',
        fontFamily:   'var(--font-ui)',
        color:        'var(--nl-text-secondary)',
        whiteSpace:   'nowrap',
      }}
    >
      {label}
    </span>
  );
}

/* ── Providers de streaming ───────────────────────────────── */
function StreamingRow({ providers }) {
  if (!providers) return null;
  const services = providers.flatrate ?? providers.buy ?? [];
  const label    = providers.flatrate ? 'Streaming' : 'Comprar / alquilar';

  return (
    <div>
      <SectionLabel number={4}>{label}</SectionLabel>
      {services.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {services.slice(0, 6).map((s) => (
            <a
              key={s.provider_id}
              href={providers.link}
              target="_blank"
              rel="noopener noreferrer"
              title={s.provider_name}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
                padding:      '5px 10px',
                background:   'var(--nl-bg-subtle)',
                borderRadius: 'var(--radius-badge)',
                border:       '1px solid var(--nl-border)',
                fontSize:     '12px',
                color:        'var(--nl-text-secondary)',
                textDecoration: 'none',
                transition:   'border-color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--nl-text-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--nl-border)'; }}
            >
              {s.logo_path && (
                <img
                  src={`https://image.tmdb.org/t/p/original${s.logo_path}`}
                  alt={s.provider_name}
                  style={{ width: '18px', height: '18px', borderRadius: '3px' }}
                />
              )}
              {s.provider_name}
            </a>
          ))}
        </div>
      ) : (
        <a
          href={`https://www.justwatch.com/mx/buscar?q=${encodeURIComponent('')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--nl-accent)', textDecoration: 'none' }}
        >
          Ver opciones en JustWatch <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}

/* ── Sección "Más de esta saga" ───────────────────────────── */
function RelatedSaga({ saga }) {
  const { grouped, isLoading } = useSagaSearch(saga);
  const navigate = useNavigate();

  /* Mezcla películas + series + anime del resultado */
  const related = [
    ...(grouped.movies ?? []),
    ...(grouped.series ?? []),
    ...(grouped.anime  ?? []),
  ].slice(0, 10);

  if (!isLoading && related.length === 0) return null;

  return (
    <div style={{ marginTop: 'var(--space-12)', paddingTop: 'var(--space-8)', borderTop: '1px solid var(--nl-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          style={{ display: 'block', width: '28px', height: '3px', background: 'var(--nl-accent)', transformOrigin: 'left', flexShrink: 0 }}
        />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nl-text-muted)' }}>
          Más de la saga
        </p>
      </div>

      <button
        onClick={() => navigate(`/saga/${encodeURIComponent(saga)}`)}
        style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           '6px',
          fontFamily:    'var(--font-display)',
          fontSize:      'clamp(20px, 3vw, 32px)',
          fontWeight:    700,
          letterSpacing: '-0.02em',
          color:         'var(--nl-text-primary)',
          background:    'none',
          border:        'none',
          cursor:        'pointer',
          padding:       0,
          marginBottom:  'var(--space-6)',
          transition:    'color 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--nl-accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--nl-text-primary)'; }}
      >
        {saga}
        <ExternalLink size={16} />
      </button>

      <ContentSection
        title=""
        obras={related}
        isLoading={isLoading}
        cardType="media"
        limit={10}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════════════════════════════ */
function Detail() {
  const { mediaId } = useParams();
  const navigate    = useNavigate();
  const { source, type, nativeId } = parseMediaSlug(mediaId ?? '');

  const isMovie  = source === DATA_SOURCES.TMDB && type === MEDIA_TYPES.MOVIE;
  const isSeries = source === DATA_SOURCES.TMDB && type === MEDIA_TYPES.SERIES;
  const isAnime  = source === DATA_SOURCES.JIKAN;
  const isGame = source === 'rawg';
  const isBook   = source === DATA_SOURCES.OPENLIBRARY && type === MEDIA_TYPES.BOOK;
  const isMusic  = source === DATA_SOURCES.MUSICBRAINZ && type === MEDIA_TYPES.MUSIC;

  const movieRes  = useMovieDetail (isMovie  ? nativeId : null);
  const seriesRes = useSeriesDetail(isSeries ? nativeId : null);
  const animeRes  = useAnimeDetail (isAnime  ? nativeId : null);
  const gameRes   = useGameDetail  (isGame   ? nativeId : null);
  const bookWorkKey = isBook ? nativeId : null;
  const bookRes     = useBookDetail(bookWorkKey);
  const musicRes = useMusicDetail(isMusic ? nativeId : null);

  const isNoLimits = source === 'nolimits';

  const [noLimitsRes, setNoLimitsRes] = useState({
    data: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!isNoLimits || !nativeId) return;

    setNoLimitsRes({ data: null, isLoading: true, error: null });

    obtenerProducto(nativeId)
      .then((producto) => {
        
        setNoLimitsRes({
          data: {
            id: producto.id,
            source: 'nolimits',
            title: producto.nombre,
            type: producto.tipoProductoNombre || 'Producto',
            poster: producto.imagenes?.[0] || producto.imagen || null,
            backdrop: producto.imagenes?.[0] || producto.imagen || null,
            rating: '—',
            year: producto.anio || '—',
            genres: (producto.generos || [])
              .map((g) => typeof g === 'string' ? g : g?.nombre)
              .filter(Boolean),

            platforms: (producto.plataformas || [])
              .map((p) => typeof p === 'string' ? p : p?.nombre)
              .filter(Boolean),
            synopsis: producto.sinopsis || 'Sin sinopsis disponible.',
            saga: producto.saga || null,
            linksCompra: producto.linksCompra || [],
          },
          isLoading: false,
          error: null,
        });
      })
      .catch((err) => {
        setNoLimitsRes({ data: null, isLoading: false, error: err });
      });
  }, [isNoLimits, nativeId]);

  const { data: obra, isLoading, error } =
    isNoLimits ? noLimitsRes :
    isMovie    ? movieRes    :
    isSeries   ? seriesRes   :
    isAnime    ? animeRes    :
    isGame     ? gameRes     :
    isBook     ? bookRes     :
    isMusic    ? musicRes    :
    { data: null, isLoading: false, error: new Error(`Tipo no soportado: ${source}/${type}`) };

  const [providers, setProviders] = useState(null);
  useEffect(() => {
    if (!obra) return;
    if (isMovie)  fetchMovieProviders(nativeId).then(setProviders).catch(() => {});
    if (isSeries) fetchSeriesProviders(nativeId).then(setProviders).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se usa obra?.id (no obra completo) a propósito, para no repetir el fetch en cada render donde obra es un objeto nuevo pero la misma obra
  }, [obra?.id, isMovie, isSeries, nativeId]);

  const isLoggedIn = () => {
    const token = localStorage.getItem("nl_token");
    const user = localStorage.getItem("nl_user");
    const auth = localStorage.getItem("nl_auth");

    if (!token || !user) return false;

    if (auth !== "1" && auth !== "true") return false;

    try {
      const parsedUser = JSON.parse(user);
      return !!parsedUser?.id || !!parsedUser?.correo || !!parsedUser?.email;
    } catch {
      return false;
    }
  };

  const handleToggleList = async () => {
    try {
      if (!isLoggedIn()) {
        alert("Debes iniciar sesión para guardar en favoritos");
        navigate("/login");
        return;
      }

      const user = JSON.parse(localStorage.getItem("nl_user") || "null");

      const usuarioId =
        user?.backendId ||
        user?.idUsuario ||
        user?.usuarioId ||
        user?.id ||
        localStorage.getItem("nl_userId");

      if (!usuarioId) {
        alert("No se pudo identificar tu usuario. Cierra sesión e inicia sesión otra vez.");
        return;
      }

      //if (isInList) {
      //  await eliminarFavoritoUsuario(usuarioId, obra.id);
      //} else {
      //  await agregarFavoritoUsuario(usuarioId, obra);
      //}

      toggleList(obra);
    } catch (error) {
      console.error("Error actualizando favorito:", error);
      alert("No se pudo actualizar favoritos");
    }
  };

  const handleGuardarReview = async () => {
    try {
      if (!isLoggedIn()) {
        alert("Debes iniciar sesión para guardar reseñas");
        navigate("/login");
        return;
      }

      const user = JSON.parse(localStorage.getItem("nl_user"));
      const usuarioId = user?.backendId || user?.idUsuario || user?.usuarioId || user?.id;

      if (!usuarioId) {
        alert("No se pudo identificar tu usuario. Cierra sesión e inicia sesión otra vez.");
        return;
      }

      // Si hay editingReviewId → actualizar esa reseña inline
      // Si no → crear nueva reseña desde "Mi reseña personal"
      await guardarReview(usuarioId, {
        obraId: obra.id,
        contenido: editingReviewId ? reviewText : reviewText,
        rating: 10,
        ...(editingReviewId ? { reviewId: editingReviewId } : {}),
      });

      const reviewsActualizadas = await obtenerReviewsPorObra(obra.id);
      setReviews(reviewsActualizadas);
      setReviewText('');
      setReviewSaved(true);
      setEditingReviewId(null);

    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la reseña");
    }
  };

  const handleNuevaReview = async () => {
    try {
      if (!isLoggedIn()) {
        alert("Debes iniciar sesión para guardar reseñas");
        navigate("/login");
        return;
      }

      const user = JSON.parse(localStorage.getItem("nl_user"));
      const usuarioId = user?.backendId || user?.idUsuario || user?.usuarioId || user?.id;

      if (!usuarioId) {
        alert("No se pudo identificar tu usuario.");
        return;
      }

      await guardarReview(usuarioId, {
        obraId: obra.id,
        contenido: newReviewText,
        rating: 10,
      });

      const reviewsActualizadas = await obtenerReviewsPorObra(obra.id);
      setReviews(reviewsActualizadas);
      setNewReviewText('');
      setReviewSaved(true);

    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la reseña");
    }
  };

  const handleResponderReview = async (parentReviewId) => {
    try {

      if (!isLoggedIn()) {
        alert("Debes iniciar sesión para responder comentarios");
        navigate("/login");
        return;
      }

      const user = JSON.parse(localStorage.getItem("nl_user"));

      const usuarioId =
        user?.backendId ||
        user?.idUsuario ||
        user?.usuarioId ||
        user?.id;

      if (!usuarioId) {
        alert("No se pudo identificar el usuario");
        return;
      }

      await guardarReview(usuarioId, {
        obraId: obra.id,
        contenido: replyText,
        rating: null,
        parentReviewId,
      });

      const reviewsActualizadas = await obtenerReviewsPorObra(obra.id);
      setReviews(reviewsActualizadas);

      setExpandedReplies((prev) => ({
        ...prev,
        [parentReviewId]: true,
      }));

      setReplyText('');
      setReplyingToId(null);

    } catch (error) {
      console.error(error);
      alert("No se pudo responder el comentario");
    }
  };

  const handleActualizarRespuesta = async (respuestaId) => {
    try {
      const user = JSON.parse(localStorage.getItem("nl_user"));

      const usuarioId =
        user?.backendId ||
        user?.idUsuario ||
        user?.usuarioId ||
        user?.id;

      if (!usuarioId) {
        alert("No se pudo identificar el usuario");
        return;
      }

      await guardarReview(usuarioId, {
        obraId: obra.id,
        contenido: editingReplyText,
        rating: null,
        parentReviewId: null,
        reviewId: respuestaId,
      });

      const reviewsActualizadas = await obtenerReviewsPorObra(obra.id);
      setReviews(reviewsActualizadas);

      setEditingReplyId(null);
      setEditingReplyText("");

    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar la respuesta");
    }
  };

  const handleEliminarReview = async (reviewId) => {
    try {
      const user = JSON.parse(localStorage.getItem("nl_user"));

      const usuarioId =
        user?.backendId ||
        user?.idUsuario ||
        user?.usuarioId ||
        user?.id;

      if (!usuarioId) {
        alert("No se pudo identificar el usuario");
        return;
      }

      await eliminarReview(usuarioId, reviewId);

      const reviewsActualizadas = await obtenerReviewsPorObra(obra.id);
      setReviews(reviewsActualizadas);

      setReviewText('');
      setEditingReviewId(null);
      setReviewSaved(false);

    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la reseña");
    }
  };

  const handleReaccionReview = async (reviewId, tipoReaccion) => {
    try {
      if (!isLoggedIn()) {
        alert("Debes iniciar sesión para reaccionar a una reseña");
        navigate("/login");
        return;
      }

      const user = JSON.parse(localStorage.getItem("nl_user"));

      const usuarioId =
        user?.backendId ||
        user?.idUsuario ||
        user?.usuarioId ||
        user?.id;

      if (!usuarioId) {
        alert("Debes iniciar sesión");
        return;
      }

      await reaccionarReview(
        reviewId,
        usuarioId,
        tipoReaccion
      );

      const reviewsActualizadas = await obtenerReviewsPorObra(obra.id);
      setReviews(reviewsActualizadas);

    } catch (error) {
      console.error(error);
      alert("No se pudo registrar la reacción");
    }
  };

  const isInList   = useAppStore((s) => obra ? s.isInList(obra.id) : false);
  const toggleList = useAppStore((s) => s.toggleList);
const [synopsis, setSynopsis] = useState('');

useEffect(() => {
  if (!obra?.synopsis) return;
  setSynopsis(obra.synopsis);
  translateToSpanish(obra.synopsis).then(setSynopsis);
}, [obra?.synopsis]);
  const [reviewText, setReviewText] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyText, setEditingReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});

  useEffect(() => {
    if (!obra?.id) return;

    obtenerReviewsPorObra(obra.id)
      .then(setReviews)
      .catch((error) => {
        console.error("Error cargando reseñas:", error);
      });
  }, [obra?.id]);

  const currentUser = JSON.parse(localStorage.getItem("nl_user") || "null");
  const usuarioActualId =
    currentUser?.backendId ||
    currentUser?.idUsuario ||
    currentUser?.usuarioId ||
    currentUser?.id;
  
  const comentariosPrincipales = reviews.filter(
    (review) => !review.parentReviewId
  );

  const obtenerRespuestas = (reviewId) =>
    reviews.filter(
      (review) => review.rootReviewId === reviewId
    );

  const toggleRespuestas = (reviewId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      // eslint-disable-next-line security/detect-object-injection -- reviewId viene de las reseñas propias del backend, es estado local de UI, no una clave externa peligrosa
      [reviewId]: !prev[reviewId],
    }));
  };

  const limpiarNombreUsuario = (nombre) => {
    if (!nombre) return 'Usuario';

    return nombre
      .replace(/\b(Google|Temporal|Supabase|NoLimits)\b/gi, '')
      .replace(/[+()-]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  /* ── Loading ────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)' }}>
        {/* Skeleton de backdrop */}
        <div className="nl-skeleton" style={{ height: '520px', borderRadius: 0, marginBottom: 0 }} />
        <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-8)' }}>
          <div className="nl-skeleton" style={{ width: '220px', aspectRatio: '2/3', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[80, 50, 100, 60, 40].map((w, i) => (
              <div key={i} className="nl-skeleton" style={{ height: i === 0 ? '40px' : '16px', width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ──────────────────────────────────────────────── */
  if (error || !obra) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)' }}>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Volver
        </Button>
        <p style={{ color: 'var(--nl-text-muted)', marginTop: 'var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          No se pudo cargar esta obra. ({source}/{type}/{nativeId})
        </p>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div>
      {/* ══ HERO BACKDROP ═══════════════════════════════════ */}
      <div
        style={{
          position:   'relative',
          height:     'clamp(300px, 45vw, 520px)',
          overflow:   'hidden',
          background: 'var(--nl-bg-elevated)',
        }}
      >
        {obra.backdrop && (
          <motion.img
            src={obra.backdrop}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1.0  }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }}
          />
        )}

        {/* Gradiente */}
        {/* Gradiente:
              - Capa inferior full-width: cubre TODO el ancho en la franja baja
                para que cualquier título, sin importar su longitud, sea legible.
              - Capa lateral: detalle visual decorativo, no afecta legibilidad. */}
        <div
          style={{
            position:   'absolute',
            inset:      0,
            background: `
              linear-gradient(to top,
                rgba(10,10,11,1)    0%,
                rgba(10,10,11,0.92) 20%,
                rgba(10,10,11,0.5)  45%,
                transparent         70%
              ),
              linear-gradient(to right,
                rgba(10,10,11,0.5) 0%,
                transparent        55%
              )
            `,
          }}
        />

        {/* Botón volver */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate(-1)}
          style={{
            position:   'absolute',
            top:        'var(--space-6)',
            left:       'var(--space-6)',
            display:    'flex',
            alignItems: 'center',
            gap:        '6px',
            color:      'rgba(255,255,255,0.65)',
            background: 'rgba(10,10,11,0.4)',
            border:     '1px solid rgba(255,255,255,0.15)',
            borderRadius:'var(--radius-btn)',
            padding:    '6px 14px',
            cursor:     'pointer',
            fontSize:   '13px',
            fontFamily: 'var(--font-ui)',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(10,10,11,0.7)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(10,10,11,0.4)'; }}
        >
          <ArrowLeft size={14} /> Volver
        </motion.button>

        {/* Título superpuesto en el backdrop */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1,  y: 0  }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="container hero-mobile-content"
          style={{
            position:      'absolute',
            bottom:        0,
            left:          0,
            right:         0,
            width:         '100%',
            paddingBottom: 'var(--space-8)',
            textAlign:     'center',
          }}
        >
          {/* Badge + saga */}
          <div
            className="hero-mobile-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-3)',
              flexWrap: 'wrap',
            }}
          >
            <Badge type={obra.type} />
            {obra.saga && (
              <button
                onClick={() => navigate(`/saga/${encodeURIComponent(obra.saga)}`)}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        '4px',
                  background: 'rgba(255,77,77,0.15)',
                  border:     '1px solid rgba(255,77,77,0.35)',
                  borderRadius:'20px',
                  padding:    '3px 10px',
                  fontSize:   '11px',
                  fontFamily: 'var(--font-mono)',
                  color:      'var(--nl-accent)',
                  cursor:     'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                <Layers size={10} /> {obra.saga}
              </button>
            )}
          </div>

          <h1
            className="hero-mobile-title"
            style={{
              fontFamily:    'var(--font-display)',
              fontSize: 'clamp(22px, 4.2vw, 56px)',
              fontWeight:    700,
              letterSpacing: '-0.04em',
              lineHeight:    1.05,
              color:         '#fff',
              /* maxWidth evita que títulos largos lleguen a la zona sin gradiente */
              maxWidth: 'min(86%, 780px)',
              margin: '0 auto',
              overflowWrap:  'break-word',
              /* Sombra reforzada como segunda línea de defensa */
              textShadow:    '0 1px 0 rgba(0,0,0,0.8), 0 4px 24px rgba(0,0,0,0.7)',
            }}
          >
            {obra.title}
          </h1>
        </motion.div>
      </div>

      {/* ══ CONTENIDO PRINCIPAL ═════════════════════════════ */}
      <div className="container" style={{ paddingBottom: 'var(--space-16)' }}>
        <div
          className="detail-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: 'var(--space-8)',
            alignItems: 'flex-start',
            marginTop: 'var(--space-8)',
          }}
        >
          {/* ── COLUMNA IZQUIERDA: Poster + acciones rápidas ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            {/* Poster */}
            {obra.poster && (
              <img
                src={obra.poster}
                alt={`Poster de ${obra.title}`}
                style={{
                  width:        '100%',
                  aspectRatio:  '2/3',
                  objectFit:    'cover',
                  borderRadius: 'var(--radius-card)',
                  display:      'block',
                  border:       '1px solid var(--nl-border)',
                }}
              />
            )}

            {/* Rating destacado */}
            {obra.rating !== '—' && (
              <div
                style={{
                  background:   'var(--nl-bg-elevated)',
                  border:       '1px solid var(--nl-border)',
                  borderRadius: 'var(--radius-card)',
                  padding:      'var(--space-4)',
                  textAlign:    'center',
                }}
              >
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', marginBottom: '6px' }}>
                  Valoración
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Star size={16} color="var(--nl-accent)" fill="var(--nl-accent)" />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--nl-accent)', letterSpacing: '-0.02em' }}>
                    {obra.rating}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ffffff' }}>/10</span>
                </div>
              </div>
            )}

            {/* Año */}
            <div
              style={{
                background:   'var(--nl-bg-elevated)',
                border:       '1px solid var(--nl-border)',
                borderRadius: 'var(--radius-card)',
                padding:      'var(--space-3) var(--space-4)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={12} /> Año
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--nl-text-primary)' }}>
                {obra.year}
              </span>
            </div>

            {/* Botón guardar */}
            <Button
              variant={isInList ? 'secondary' : 'primary'}
              onClick={handleToggleList}
              style={{ width: '100%' }}
            >
              {isInList ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
              {isInList ? 'En tu lista' : 'Guardar en mi lista'}
            </Button>

            {/* WhereToFind */}
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 'var(--space-2)' }}>
                Dónde encontrarlo
              </p>
              <WhereToFind obra={obra} providers={providers} compact={!providers} />
            </div>
          </motion.div>

          {/* ── COLUMNA DERECHA: Todo el contenido narrativo ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}
          >
            {/* 01 · GÉNEROS */}
            {obra.genres.length > 0 && (
              <div>
                <SectionLabel number={1}>Géneros</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {obra.genres.map((g) => <GenreChip key={g} label={g} />)}
                </div>
              </div>
            )}

            {/* 02 · PLATAFORMAS (juegos / redes de TV) */}
            {obra.platforms.length > 0 && (
              <div>
                <SectionLabel number={2}>
                  {obra.type === MEDIA_TYPES.GAME ? 'Plataformas' : 'Redes / estudios'}
                </SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {obra.platforms.slice(0, 8).map((p) => <GenreChip key={p} label={p} />)}
                </div>
              </div>
            )}

            {/* 03 · STREAMING */}
            {(isMovie || isSeries) && (
              <StreamingRow providers={providers} />
            )}

            {obra.synopsis && (
              <div>
                <SectionLabel number={obra.platforms.length > 0 ? 3 : 2}>Sinopsis</SectionLabel>
                <div
                  style={{
                    fontSize:   '15px',
                    lineHeight: 1.8,
                    color:      'var(--nl-text-secondary)',
                  }}
                  dangerouslySetInnerHTML={{ __html: synopsis }}
                />
              </div>
            )}

            {/* 05 · MI RESEÑA */}
            <div>
              <SectionLabel number={obra.synopsis ? 5 : 4}>Mi reseña personal</SectionLabel>
              <textarea
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                placeholder="Escribe tu opinión sobre esta obra…"
                rows={5}
                style={{
                  width:        '100%',
                  background:   'var(--nl-bg-elevated)',
                  border:       '1px solid var(--nl-border)',
                  borderRadius: 'var(--radius-card)',
                  color:        'var(--nl-text-primary)',
                  padding:      'var(--space-4)',
                  fontSize:     '14px',
                  lineHeight:   1.7,
                  resize:       'vertical',
                  outline:      'none',
                  fontFamily:   'var(--font-ui)',
                  display:      'block',
                  marginBottom: 'var(--space-3)',
                  transition:   'border-color 150ms ease',
                }}
                onFocus={(e)  => { e.currentTarget.style.borderColor = 'var(--nl-accent)'; }}
                onBlur={(e)   => { e.currentTarget.style.borderColor = 'var(--nl-border)'; }}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNuevaReview}
              >
                Guardar reseña
              </Button>
              {reviewSaved && (
                <span style={{ marginLeft: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nl-text-muted)' }}>
                  ✓ guardada
                </span>
              )}
            </div>

            {/* 06 · RESEÑAS */}
<div>
  <SectionLabel number={6}>Reseñas</SectionLabel>

  {reviews.length === 0 ? (
    <p style={{ color: 'var(--nl-text-muted)', fontSize: '14px' }}>
      Todavía no hay reseñas para esta obra.
    </p>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {comentariosPrincipales.map((review) => (
        <div
          key={review.id}
          style={{
            background: 'var(--nl-bg-elevated)',
            border: '1px solid var(--nl-border)',
            borderRadius: 'var(--radius-card)',
            padding: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <strong style={{ color: 'var(--nl-text-primary)', fontSize: '14px' }}>
              {limpiarNombreUsuario(review.nombreUsuario)}
            </strong>

            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ffffff' }}>
              {new Date(review.fechaCreacion).toLocaleDateString('es-CL')}
              {review.editado && ' · editado'}
            </span>
          </div>

          {editingReviewId === review.id ? (
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              autoFocus
              style={{
                width: '100%',
                background: 'var(--nl-bg-subtle)',
                border: '1px solid var(--nl-accent)',
                borderRadius: 'var(--radius-card)',
                color: 'var(--nl-text-primary)',
                padding: 'var(--space-3)',
                fontSize: '14px',
                lineHeight: 1.7,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'var(--font-ui)',
                marginBottom: 'var(--space-2)',
              }}
            />
          ) : (
            <p style={{ color: 'var(--nl-text-secondary)', fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {review.contenido}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'var(--space-3)',
              gap: 'var(--space-3)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => handleReaccionReview(review.id, 'LIKE')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--nl-text-secondary)',
                  fontSize: '14px',
                }}
              >
                👍 {review.likes ?? 0}
              </button>

              <button
                onClick={() => handleReaccionReview(review.id, 'DISLIKE')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--nl-text-secondary)',
                  fontSize: '14px',
                }}
              >
                👎 {review.dislikes ?? 0}
              </button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingToId(review.id)}
              >
                Responder
              </Button>
            </div>

            {review.usuarioId === usuarioActualId && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {editingReviewId === review.id ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleGuardarReview}
                    >
                      Guardar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingReviewId(null);
                        setReviewText('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setReviewText(review.contenido);
                      setEditingReviewId(review.id);
                    }}
                  >
                    Editar reseña
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminarReview(review.id)}
                  style={{
                    color: '#ff6b6b',
                    borderColor: 'rgba(255,107,107,0.2)',
                  }}
                >
                  Eliminar reseña
                </Button>
              </div>
            )}
          </div>

          {replyingToId === review.id && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe una respuesta…"
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--nl-bg-subtle)',
                  border: '1px solid var(--nl-border)',
                  borderRadius: 'var(--radius-card)',
                  color: 'var(--nl-text-primary)',
                  padding: 'var(--space-3)',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />

              <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--space-2)' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleResponderReview(review.id)}
                >
                  Publicar respuesta
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyText('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {obtenerRespuestas(review.id).length > 0 && (
            <button
              onClick={() => toggleRespuestas(review.id)}
              style={{
                marginTop: 'var(--space-3)',
                background: 'transparent',
                border: 'none',
                color: 'var(--nl-accent)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {expandedReplies[review.id]
                ? 'Ocultar respuestas ▲'
                : `${obtenerRespuestas(review.id).length} ${
                    obtenerRespuestas(review.id).length === 1 ? 'respuesta' : 'respuestas'
                  } ▼`}
            </button>
          )}

          {expandedReplies[review.id] &&
            obtenerRespuestas(review.id).map((respuesta) => (
              <div
                key={respuesta.id}
                style={{
                  marginTop: 'var(--space-3)',
                  marginLeft: 'var(--space-5)',
                  paddingLeft: 'var(--space-3)',
                  borderLeft: '2px solid var(--nl-border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 'var(--space-2)',
                    marginBottom: '6px',
                  }}
                >
                  <strong
                    style={{
                      color: 'var(--nl-text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    {limpiarNombreUsuario(respuesta.nombreUsuario)}
                  </strong>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--nl-text-muted)',
                    }}
                  >
                    {new Date(respuesta.fechaCreacion).toLocaleDateString('es-CL')}
                    {respuesta.editado && ' · editado'}
                  </span>
                </div>

                {editingReplyId === respuesta.id ? (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <textarea
                      value={editingReplyText}
                      onChange={(e) => setEditingReplyText(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        background: 'var(--nl-bg-subtle)',
                        border: '1px solid var(--nl-border)',
                        borderRadius: 'var(--radius-card)',
                        color: 'var(--nl-text-primary)',
                        padding: 'var(--space-3)',
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />

                    <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--space-2)' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleActualizarRespuesta(respuesta.id)}
                      >
                        Guardar cambios
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingReplyId(null);
                          setEditingReplyText('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p
                    style={{
                      color: 'var(--nl-text-secondary)',
                      fontSize: '14px',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {respuesta.contenido}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => handleReaccionReview(respuesta.id, 'LIKE')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--nl-text-secondary)',
                      fontSize: '14px',
                    }}
                  >
                    👍 {respuesta.likes ?? 0}
                  </button>

                  <button
                    onClick={() => handleReaccionReview(respuesta.id, 'DISLIKE')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--nl-text-secondary)',
                      fontSize: '14px',
                    }}
                  >
                    👎 {respuesta.dislikes ?? 0}
                  </button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingToId(respuesta.id);
                      setReplyText('');
                    }}
                  >
                    Responder
                  </Button>

                  {respuesta.usuarioId === usuarioActualId && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingReplyId(respuesta.id);
                          setEditingReplyText(respuesta.contenido);
                        }}
                      >
                        Editar
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminarReview(respuesta.id)}
                        style={{
                          color: '#ff6b6b',
                          borderColor: 'rgba(255,107,107,0.2)',
                        }}
                      >
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>

                {replyingToId === respuesta.id && (
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escribe una respuesta…"
                      rows={3}
                      style={{
                        width: '100%',
                        background: 'var(--nl-bg-subtle)',
                        border: '1px solid var(--nl-border)',
                        borderRadius: 'var(--radius-card)',
                        color: 'var(--nl-text-primary)',
                        padding: 'var(--space-3)',
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />

                    <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--space-2)' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResponderReview(respuesta.id)}
                      >
                        Publicar respuesta
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingToId(null);
                          setReplyText('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  )}
</div>

</motion.div>
        </div>

        {/* Responsive: en pantallas angostas colapsa a 1 col */}
        <style>{`
          @media (max-width: 767px) {
            .detail-grid {
              grid-template-columns: 1fr !important;
              gap: var(--space-6) !important;
              margin-top: var(--space-6) !important;
            }

            .detail-grid > div:first-child {
              max-width: 220px;
              width: 100%;
              margin: 0 auto;
            }

            .detail-grid > div:last-child {
              gap: var(--space-6) !important;
              min-width: 0;
            }

            .container {
              padding-left: var(--space-4);
              padding-right: var(--space-4);
            }

            .hero-mobile-content {
              text-align: center;
            }

            .hero-mobile-badge {
              justify-content: center;
            }

            .hero-mobile-title {
              margin: 0 auto;
              max-width: 100% !important;
            }
          }

          @media (max-width: 480px) {
            .detail-grid > div:first-child {
              max-width: 190px;
            }
          }
        `}</style>

        {/* ── MÁS DE ESTA SAGA ─────────────────────────────── */}
        {obra.saga && (
          <RelatedSaga saga={obra.saga} />
        )}
      </div>
    </div>
  );
}

export default Detail;