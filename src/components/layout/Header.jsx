/**
 * components/layout/Header.jsx
 * Header sticky: Logo · Nav · Búsqueda colapsable · Login.
 * Modo claro desactivado (dark-first permanente).
 */

import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate }  from 'react-router-dom';
import { Search, X, BookMarked, LogIn, LogOut, User } from 'lucide-react';
import Logo      from './Logo';
import SearchBar from '@/components/ui/SearchBar';
import useAppStore from '@/store/useAppStore';

function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!searchOpen) return;
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);
  const navigate    = useNavigate();

  const myListCount = useAppStore((s) => s.myList.length);
  const user        = useAppStore((state) => state.user);
  const clearUser   = useAppStore((s) => s.clearUser);

  return (
    <header className="nl-header">
      <div className="container nl-header__inner">
        <Logo size="md" />

        <nav className="nl-header__nav" aria-label="Navegación principal">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nl-header__nav-link ${isActive ? 'nl-header__nav-link--active' : ''}`}
          >
            Descubrir
          </NavLink>

          <NavLink
            to="/saga"
            className={({ isActive }) => `nl-header__nav-link ${isActive ? 'nl-header__nav-link--active' : ''}`}
            style={{ color: 'var(--nl-accent)', fontWeight: 600 }}
          >
            Sagas
          </NavLink>
            <NavLink
              to="/my-list"
              className={({ isActive }) => `nl-header__nav-link ${isActive ? 'nl-header__nav-link--active' : ''}`}
            >
              Mi biblioteca
              {user && myListCount > 0 && (
                <span 
                  style={{ 
                    marginLeft: '6px', 
                    background: 'var(--nl-accent)', 
                    color: '#fff', 
                    borderRadius: '10px', 
                    padding: '0 6px', 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    verticalAlign: 'middle' 
                  }}
                  >
                  {myListCount}
                </span>
              )}
            </NavLink>
        
          </nav>

        <div className="nl-header__actions" ref={searchRef}>
          {searchOpen && (
            <div style={{ width: '260px' }}>
              <SearchBar compact />
            </div>
          )}

          <button
            className="nl-header__search-btn"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={searchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          {/* Botón Lista — solo visible en móvil */}
          {user && (
            <button
              className="nl-header__search-btn nl-header__library-mobile"
              onClick={() => navigate('/my-list')}
              aria-label="Mi biblioteca"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <BookMarked size={16} />
                {myListCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    left: '-7px',
                    background: 'var(--nl-accent)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '0 5px',
                    fontSize: '10px',
                    fontWeight: 700,
                    lineHeight: '16px',
                    minWidth: '16px',
                    textAlign: 'center',
                  }}
                >
                  {myListCount}
                </span>
                )}
              </span>
              Lista
            </button>
          )}

          {/* Login / logout */}
          {user ? (
            <>
              {/* Perfil */}
              <button
                className="nl-header__search-btn"
                onClick={() => navigate('/profile')}
                aria-label="Mi perfil"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                }}
              >
                <User size={16} />
                Perfil
              </button>

              {/*Logout */}
              <button 
                className="nl-header__search-btn"
                onClick={() => {
                  clearUser();

                  localStorage.clear();

                  //localStorage.removeItem('nl_user');
                  //localStorage.removeItem('nl_role');
                  //localStorage.removeItem('nl_token');

                  navigate("/");
                }}
                aria-label="Cerrar sesión"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                }}
              >
                <LogOut size={16} />
                Salir
              </button>
            </>
          ) : (
            /*Usuario no autenticado */
            <button
              className="nl-header__search-btn"
              onClick={() => navigate('/login')}
              aria-label="Iniciar sesión"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
              }}
            >
              <LogIn size={16} />
              Login
            </button>
          )}
        </div>      
      </div>    
    </header>      
  );
}

export default Header;