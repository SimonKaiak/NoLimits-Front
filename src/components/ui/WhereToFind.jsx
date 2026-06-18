/**
 * components/ui/WhereToFind.jsx
 * Muestra dónde encontrar una obra según su tipo.
 *
 * Modo "compact" — saga page: íconos de plataformas sin llamadas extra.
 * Modo "full" — detail page: proveedores de TMDB cargados desde la API.
 *
 * Por tipo:
 *  movie/series → TMDB watch providers (modo full) | JustWatch link (compact)
 *  game         → plataformas de IGDB (platforms[])
 *  anime        → plataformas (studios[]) + link Crunchyroll
 *  book         → Open Library (lectura gratuita)
 *  music        → MusicBrainz
 */

import PropTypes from 'prop-types';
import { ExternalLink, BookOpen, Gamepad2, Film, Music } from 'lucide-react';
import { MEDIA_TYPES, DATA_SOURCES } from '@/utils/constants';

/* ── Mapeo de plataformas de juegos a colores de marca ──── */
const GAME_PLATFORM_CONFIG = new Map([
  ['PC',                 { color: '#60A5FA', abbr: 'PC'  }],
  ['PlayStation 5',      { color: '#003087', abbr: 'PS5' }],
  ['PlayStation 4',      { color: '#003087', abbr: 'PS4' }],
  ['Xbox Series X|S',    { color: '#107C10', abbr: 'XSX' }],
  ['Xbox One',           { color: '#107C10', abbr: 'XB1' }],
  ['Nintendo Switch',    { color: '#E4000F', abbr: 'NSW' }],
  ['iOS',                { color: '#A78BFA', abbr: 'iOS' }],
  ['Android',            { color: '#34D399', abbr: 'AND' }],
]);

/* Normaliza el nombre de plataforma a una clave conocida */
function normalizePlatform(name) {
  if (!name) return null;
  for (const key of GAME_PLATFORM_CONFIG.keys()) {
    if (name.toLowerCase().includes(key.toLowerCase())) return key;
    if (key.toLowerCase().includes(name.toLowerCase())) return key;
  }
  return null;
}

function PlatformBadge({ name }) {
  const normalized = normalizePlatform(name);
  const config     = normalized ? GAME_PLATFORM_CONFIG.get(normalized) : null;

  return (
    <span
      style={{
        padding:      '3px 8px',
        borderRadius: '4px',
        fontSize:     '11px',
        fontFamily:   'var(--font-mono)',
        fontWeight:   600,
        background:   config ? `${config.color}22` : 'var(--nl-bg-subtle)',
        color:        config ? config.color : 'var(--nl-text-muted)',
        border:       `1px solid ${config ? `${config.color}44` : 'var(--nl-border)'}`,
      }}
    >
      {config ? config.abbr : name.slice(0, 6)}
    </span>
  );
}

/* ── Botón de enlace externo ───────────────────────────── */
function LinkButton({ href, label, icon: Icon, accent = false }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '6px',
        padding:      '6px 14px',
        borderRadius: 'var(--radius-btn)',
        fontSize:     '12px',
        fontFamily:   'var(--font-ui)',
        fontWeight:   500,
        background:   accent ? 'var(--nl-accent)' : 'var(--nl-bg-subtle)',
        color:        accent ? '#fff' : 'var(--nl-text-secondary)',
        border:       accent ? 'none' : '1px solid var(--nl-border)',
        textDecoration: 'none',
        transition:   'opacity 150ms ease',
        whiteSpace:   'nowrap',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
    >
      {Icon && <Icon size={12} />}
      {label}
      <ExternalLink size={10} />
    </a>
  );
}

/* ── Componente principal ──────────────────────────────── */
function WhereToFind({ obra, compact = false, providers = null }) {
  if (!obra) return null;
  const { type, platforms = [] } = obra;

  if (obra?.linksCompra?.length > 0) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {obra.linksCompra.map((link, index) => (
          <a
            key={index}
            href={link.url || link.urlCompra}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-btn)',
              background: 'var(--nl-bg-subtle)',
              border: '1px solid var(--nl-border)',
              fontSize: '12px',
              color: 'var(--nl-text-secondary)',
              textDecoration: 'none',
            }}
          >
            {link.label || link.plataformaNombre || link.plataforma?.nombre || 'Mercado Libre'}
            <ExternalLink size={10} />
          </a>
        ))}
      </div>
    );
  }

  /* ── Videojuegos ────────────────────────────────────── */
  if (type === MEDIA_TYPES.GAME) {
    const knownPlatforms = platforms.slice(0, 5);
    const gameStores     = obra.gameStores ?? [];

    if (gameStores.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {knownPlatforms.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {knownPlatforms.map((p) => <PlatformBadge key={p} name={p} />)}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {gameStores.map((store) => (
              <LinkButton
                key={store.url}
                href={store.url}
                label={store.label}
                icon={Gamepad2}
                accent={store.accent}
              />
            ))}
          </div>
        </div>
      );
    }

  // Fallback: botones por plataforma detectada
    const PLATFORM_STORE_LINKS = new Map([
      ['PlayStation 5',  { label: 'PlayStation Store', url: `https://store.playstation.com/es-cl/search/${encodeURIComponent(obra.title)}` }],
      ['PlayStation 4',  { label: 'PlayStation Store', url: `https://store.playstation.com/es-cl/search/${encodeURIComponent(obra.title)}` }],
      ['PC',             { label: 'Steam',              url: `https://store.steampowered.com/search/?term=${encodeURIComponent(obra.title)}` }],
      ['Xbox Series X',  { label: 'Xbox Store',         url: `https://www.xbox.com/es-CL/Search/Results?q=${encodeURIComponent(obra.title)}` }],
      ['Xbox One',       { label: 'Xbox Store',         url: `https://www.xbox.com/es-CL/Search/Results?q=${encodeURIComponent(obra.title)}` }],
      ['Nintendo Switch',{ label: 'Nintendo eShop',     url: `https://www.nintendo.com/search/#q=${encodeURIComponent(obra.title)}` }],
    ]);

    const platformButtons = knownPlatforms
      .map((p) => {
        const key = [...PLATFORM_STORE_LINKS.keys()].find((k) => p.includes(k) || k.includes(p));
        return key ? { ...PLATFORM_STORE_LINKS.get(key) } : null;
      })
      .filter(Boolean)
      .filter((v, i, arr) => arr.findIndex((x) => x.label === v.label) === i);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {knownPlatforms.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {knownPlatforms.map((p) => <PlatformBadge key={p} name={p} />)}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {platformButtons.map((btn) => (
            <LinkButton key={btn.label} href={btn.url} label={btn.label} icon={Gamepad2} accent />
          ))}
          {platformButtons.length === 0 && (
            <LinkButton
              href={`https://www.google.com/search?q=${encodeURIComponent(obra.title + ' comprar')}`}
              label="Buscar dónde comprar"
              icon={Gamepad2}
            />
          )}
        </div>
      </div>
    );
  }

  /* ── Libros ─────────────────────────────────────────── */
  if (type === MEDIA_TYPES.BOOK) {
    const googleBooksId = obra.id.replace('openlibrary:book:', '');
    const url = `https://books.google.com/books?id=${googleBooksId}`;
    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <LinkButton href={url} label="Ver en Google Books" icon={BookOpen} accent />
      </div>
    );
  }

  /* ── Anime ──────────────────────────────────────────── */
  if (type === MEDIA_TYPES.ANIME) {
    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <LinkButton href="https://www.crunchyroll.com" label="Crunchyroll" icon={Film} />
        <LinkButton href="https://www.netflix.com" label="Netflix" icon={Film} />
      </div>
    );
  }

  /* ── Películas y series (TMDB watch providers) ──────── */
  if (type === MEDIA_TYPES.MOVIE || type === MEDIA_TYPES.SERIES) {

    if (obra?.linksCompra?.length > 0) {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {obra.linksCompra.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                background: 'var(--nl-bg-subtle)',
                borderRadius: 'var(--radius-badge)',
                border: '1px solid var(--nl-border)',
                fontSize: '12px',
                color: 'var(--nl-text-secondary)',
                textDecoration: 'none',
              }}
            >
              {link.label || link.plataformaNombre || 'Mercado Libre'}
            </a>
          ))}
        </div>
      );
    }

    if (compact) {
      const title = encodeURIComponent(obra.title);
      return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <LinkButton
            href={`https://www.justwatch.com/mx/buscar?q=${title}`}
            label="JustWatch"
            icon={Film}
          />
          <LinkButton
            href={`https://www.google.com/search?q=${title}+ver+online`}
            label="Buscar online"
            icon={Film}
          />
        </div>
      );
    }

    if (providers) {
      const services = (providers.flatrate ?? providers.buy ?? [])
        .filter((s) => s.provider_name !== 'Google Play Movies');
      
      if (services.length === 0) {
        return (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <LinkButton
              href={providers.link || `https://www.justwatch.com/mx/buscar?q=${encodeURIComponent(obra.title)}`}
              label="JustWatch"
              icon={Film}
            />
            <LinkButton
              href={`https://www.google.com/search?q=${encodeURIComponent(obra.title)}+ver+online`}
              label="Buscar online"
              icon={Film}
            />
          </div>
        );
      }
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {services.slice(0, 5).map((s) => (
            <a
              key={s.provider_id}
              href={providers.link}
              target="_blank"
              rel="noopener noreferrer"
              title={s.provider_name}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: 'var(--nl-bg-subtle)', borderRadius: '6px', fontSize: '12px', color: 'var(--nl-text-secondary)', textDecoration: 'none' }}
            >
              {s.logo_path && (
                <img src={`https://image.tmdb.org/t/p/original${s.logo_path}`} alt={s.provider_name}
                  style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
              )}
              {s.provider_name}
            </a>
          ))}
          <LinkButton
            href={`https://www.google.com/search?q=${encodeURIComponent(obra.title)}+ver+online`}
            label="Buscar online"
            icon={Film}
          />
        </div>
      );
    }

    /* Cargando o sin datos: link fallback */
    const title = encodeURIComponent(obra.title);
    return (
      <LinkButton
        href={`https://www.justwatch.com/mx/buscar?q=${title}`}
        label="¿Dónde verlo?"
        icon={Film}
      />
    );
  }

  /* ── Música ─────────────────────────────────────────── */
  if (type === MEDIA_TYPES.MUSIC) {
    const mbid = obra.id.replace('musicbrainz:music:', '');
    return (
      <LinkButton
        href={`https://musicbrainz.org/release-group/${mbid}`}
        label="Ver en MusicBrainz"
        icon={Music}
      />
    );
  }

  return null;
}

WhereToFind.propTypes = {
  obra:      PropTypes.object,
  compact:   PropTypes.bool,
  providers: PropTypes.object,
};

export default WhereToFind;
