/**
 * components/layout/Layout.jsx
 * Wrapper principal: Header + Outlet (páginas) + Footer + ChatBot flotante.
 * Aplica la clase de tema en <html> según el store.
 */

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

/** Sube al inicio en cada cambio de ruta */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}
import { AnimatePresence } from 'motion/react';
import Header  from './Header';
import Footer  from './Footer';
import ChatBot from '@/components/ui/ChatBot';
import useAppStore from '@/store/useAppStore';

const PAGE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

function Layout() {
  const theme    = useAppStore((s) => s.theme);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'light') {
      html.classList.add('light');
    } else {
      html.classList.remove('light');
    }
  }, [theme]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScrollToTop />
      <Header />

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <Footer />

      {/* Chatbot flotante — presente en todas las páginas */}
      <ChatBot />
    </div>
  );
}

export default Layout;
