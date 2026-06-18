/**
 * components/ui/ChatBot.jsx
 * Asistente cultural flotante de no/limits.
 *
 * Ubicación: bottom-right (posición fija, z-index 200).
 * Entiende preguntas en español sobre cultura pop:
 *   - "Busca Spider-Man" → multi-API search
 *   - "¿Dónde puedo ver Dune?" → busca la película
 *   - "Recomiéndame un anime" → top anime de Jikan
 *   - "Juegos de Batman" → búsqueda en RAWG
 *   - Saga de X → redirige a /saga/:name
 *
 * Preparado para backend: cuando exista, handleSend() puede llamar
 * a POST /api/chat en lugar del motor local.
 *
 * Depende de: hooks/useSearch · react-router-dom · motion/react
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { mediaIdToSlug } from '@/utils/formatters';

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  'https://nolimits-backend-final.onrender.com'
).replace(/\/+$/, '');

/* ── Componente ─────────────────────────────────────────── */

function ResultCard({ obra }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/detail/${mediaIdToSlug(obra.id)}`)}
      style={{
        display:      'flex',
        gap:          '10px',
        padding:      '8px',
        background:   'var(--nl-bg-subtle)',
        borderRadius: '8px',
        cursor:       'pointer',
        transition:   'background 150ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--nl-border)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--nl-bg-subtle)'; }}
    >
      {obra.poster && (
        <img
          src={obra.poster}
          alt={obra.title}
          style={{ width: '36px', height: '54px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
        />
      )}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--nl-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {obra.title}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--nl-text-muted)' }}>
          {obra.year} · {obra.rating !== '—' ? `★ ${obra.rating}` : obra.type}
        </p>
      </div>
    </div>
  );
}

function parseMessageText(text) {
  /* Convierte **bold** a <strong> */
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

function ChatBot() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    {
      id:   0,
      role: 'bot',
      text: '¡Oye! 👊 Soy el asistente de NoLimits. ¡No me subestimes, sé de todo lo que hay aquí! ¿Qué andas buscando?',
    },
  ]);
  const [input,    setInput]    = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  /* Scroll al último mensaje */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  async function handleSend(e) {
    e?.preventDefault();
    if (!input.trim() || thinking) return;

    const userText = input.trim().slice(0, 500);
    setInput('');

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', text: userText },
    ]);

    setThinking(true);

    try {
      const res = await fetch(`${API_BASE}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) {
        throw new Error('No se pudo obtener respuesta del chatbot');
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'bot',
          text: data.reply || 'No pude generar una respuesta.',
        },
      ]);
    } catch (error) {
      console.error('Error chatbot:', error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'bot',
          text: 'No pude responder en este momento. Intenta nuevamente más tarde.',
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.92, y: 16  }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position:     'fixed',
              bottom:       '88px',
              right:        '24px',
              width:        '340px',
              maxHeight:    '520px',
              zIndex:       200,
              background:   'var(--nl-bg-elevated)',
              border:       '1px solid var(--nl-border)',
              borderRadius: 'var(--radius-modal)',
              display:      'flex',
              flexDirection:'column',
              overflow:     'hidden',
              boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header del chat */}
            <div
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        'var(--space-3) var(--space-4)',
                borderBottom:   '1px solid var(--nl-border)',
                background:     'var(--nl-bg-base)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={16} color="var(--nl-accent)" />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Asistente no/limits</span>
                <span
                  style={{
                    width: '7px', height: '7px',
                    borderRadius: '50%',
                    background: '#34D399',
                    flexShrink: 0,
                  }}
                />
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ color: 'var(--nl-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Mensajes */}
            <div
              style={{
                flex:      1,
                overflowY: 'auto',
                padding:   'var(--space-4)',
                display:   'flex',
                flexDirection: 'column',
                gap:       'var(--space-3)',
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display:       'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    gap:           '8px',
                    alignItems:    'flex-start',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width:          '28px',
                      height:         '28px',
                      borderRadius:   '50%',
                      background:     msg.role === 'bot' ? 'var(--nl-accent)' : 'var(--nl-bg-subtle)',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      flexShrink:     0,
                    }}
                  >
                    {msg.role === 'bot'
                      ? <Bot  size={14} color="#fff" />
                      : <User size={14} color="var(--nl-text-secondary)" />
                    }
                  </div>

                  {/* Burbuja */}
                  <div style={{ maxWidth: '76%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div
                      style={{
                        padding:      '8px 12px',
                        borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        background:   msg.role === 'user' ? 'var(--nl-accent)' : 'var(--nl-bg-subtle)',
                        fontSize:     '13px',
                        lineHeight:   1.5,
                        color:        msg.role === 'user' ? '#fff' : 'var(--nl-text-primary)',
                        whiteSpace:   'pre-line',
                      }}
                    >
                      {parseMessageText(msg.text)}
                    </div>

                    {/* Resultados inline */}
                    {msg.results?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {msg.results.map((obra) => (
                          <ResultCard key={obra.id} obra={obra} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {thinking && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: 'var(--nl-accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Bot size={14} color="#fff" />
                  </div>
                  <div
                    style={{
                      padding:    '10px 14px',
                      borderRadius: '4px 16px 16px 16px',
                      background: 'var(--nl-bg-subtle)',
                      display:    'flex',
                      gap:        '4px',
                      alignItems: 'center',
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--nl-text-muted)', display: 'block' }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              style={{
                display:    'flex',
                gap:        '8px',
                padding:    'var(--space-3) var(--space-4)',
                borderTop:  '1px solid var(--nl-border)',
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregúntame algo…"
                disabled={thinking}
                style={{
                  flex:         1,
                  height:       '38px',
                  background:   'var(--nl-bg-subtle)',
                  border:       '1px solid var(--nl-border)',
                  borderRadius: '20px',
                  color:        'var(--nl-text-primary)',
                  fontSize:     '13px',
                  padding:      '0 14px',
                  outline:      'none',
                  fontFamily:   'var(--font-ui)',
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                style={{
                  width:          '38px',
                  height:         '38px',
                  borderRadius:   '50%',
                  background:     input.trim() ? 'var(--nl-accent)' : 'var(--nl-bg-subtle)',
                  border:         'none',
                  cursor:         input.trim() ? 'pointer' : 'default',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  transition:     'background 150ms ease',
                  flexShrink:     0,
                }}
              >
                <Send size={15} color={input.trim() ? '#fff' : 'var(--nl-text-muted)'} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position:       'fixed',
          bottom:         '24px',
          right:          '24px',
          width:          '56px',
          height:         '56px',
          borderRadius:   '50%',
          background:     'var(--nl-accent)',
          border:         'none',
          cursor:         'pointer',
          zIndex:         200,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      '0 4px 16px rgba(255,77,77,0.4)',
        }}
        aria-label="Abrir asistente"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x"   initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X              size={22} color="#fff" /></motion.span>
            : <motion.span key="msg" initial={{ rotate:  90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate:-90, opacity: 0 }} transition={{ duration: 0.15 }}><MessageCircle  size={22} color="#fff" /></motion.span>
          }
        </AnimatePresence>
      </motion.button>
    </>
  );
}

export default ChatBot;
