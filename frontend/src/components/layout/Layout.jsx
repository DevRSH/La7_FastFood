import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function Layout({ children, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close drawer on route change in mobile
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/pos', label: 'POS', icon: '🏪' },
    { path: '/cocina', label: 'Cocina (KDS)', icon: '🍳' },
    { path: '/fichas', label: 'Fichas Técnicas', icon: '📋' },
    { path: '/productos', label: 'Productos Reventa', icon: '🛒' },
    { path: '/insumos', label: 'Insumos', icon: '🥩' },
    { path: '/stock', label: 'Stock', icon: '📦' },
    { path: '/ventas', label: 'Ventas', icon: '📈' },
    { path: '/clientes', label: 'Clientes', icon: '👥' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/config', label: 'Configuración', icon: '⚙️' }
  ];

  const bottomNavItems = [
    { path: '/pos', label: 'POS', icon: '🏪' },
    { path: '/cocina', label: 'Cocina', icon: '🍳' },
    { path: '/stock', label: 'Stock', icon: '📦' },
    { path: '/ventas', label: 'Ventas', icon: '📈' },
  ];

  const currentPage = navItems.find(item => item.path === location.pathname)?.label || 'La 7 FastFood';

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      
      {/* Desktop & Tablet Sidebar */}
      <aside 
        className="hidden-mobile flex-col h-full"
        style={{ 
          width: collapsed ? '80px' : '260px', 
          backgroundColor: 'var(--surface)', 
          borderRight: '1px solid var(--border)',
          transition: 'var(--transition)',
          zIndex: 10
        }}
      >
        <div className="flex items-center justify-between p-4" style={{ height: '70px', borderBottom: '1px solid var(--border)' }}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="mono" style={{ color: 'var(--cyan)', fontSize: '1.5rem', fontWeight: 700 }}>LA 7</span>
            </div>
          )}
          <button 
            className="ghost" 
            onClick={() => setCollapsed(!collapsed)} 
            style={{ padding: '0.5rem', margin: collapsed ? '0 auto' : '0' }}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        <nav className="flex-col gap-2 p-4 overflow-y-auto" style={{ flex: 1 }}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--cyan-glow)' : 'transparent',
                transition: 'var(--transition)',
                justifyContent: collapsed ? 'center' : 'flex-start'
              })}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              {!collapsed && <span style={{ fontWeight: 500 }}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="danger w-full justify-center" onClick={onLogout}>
            <span style={{ fontSize: '1.25rem' }}>🚪</span>
            {!collapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Desplegable) */}
      {isMobileDrawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsMobileDrawerOpen(false)}>
          <div className="mobile-drawer-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)', height: '64px' }}>
              <span className="mono" style={{ color: 'var(--cyan)', fontSize: '1.4rem', fontWeight: 800 }}>LA 7 FASTFOOD</span>
              <button className="ghost" onClick={() => setIsMobileDrawerOpen(false)} style={{ fontSize: '1.2rem', padding: '0.4rem' }}>✕</button>
            </div>

            <nav className="flex-col gap-1 p-3 overflow-y-auto" style={{ flex: 1 }}>
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--cyan-glow)' : 'transparent',
                    fontWeight: isActive ? 700 : 500
                  })}
                >
                  <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button className="danger w-full justify-center" onClick={onLogout}>
                <span style={{ fontSize: '1.25rem' }}>🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-col" style={{ flex: 1, overflow: 'hidden' }}>
        
        {/* Topbar Header */}
        <header 
          className="flex items-center justify-between px-4 md:px-6" 
          style={{ height: '64px', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger button for Mobile */}
            <button 
              className="ghost hidden-desktop" 
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Abrir Menú"
              style={{ fontSize: '1.4rem', padding: '0.4rem' }}
            >
              ☰
            </button>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{currentPage}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div 
                style={{ 
                  width: '9px', 
                  height: '9px', 
                  borderRadius: '50%', 
                  backgroundColor: isOnline ? 'var(--green)' : 'var(--amber)', 
                  boxShadow: `0 0 8px ${isOnline ? 'var(--green)' : 'var(--amber)'}` 
                }}
              ></div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {isOnline ? 'Online' : 'Modo Offline'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="p-3 md:p-6 overflow-y-auto animate-fade-in" style={{ flex: 1, paddingBottom: 'calc(var(--bottom-nav-height) + 16px)' }}>
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (< 768px) */}
        <nav className="mobile-bottom-nav">
          {bottomNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button 
            className="mobile-nav-item ghost" 
            onClick={() => setIsMobileDrawerOpen(true)}
            style={{ border: 'none', background: 'transparent' }}
          >
            <span style={{ fontSize: '1.3rem' }}>☰</span>
            <span>Menú</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
