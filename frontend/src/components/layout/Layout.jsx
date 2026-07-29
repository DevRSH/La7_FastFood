import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function Layout({ children, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/pos', label: 'POS', icon: '🏪' },
    { path: '/fichas', label: 'Fichas Técnicas', icon: '📋' },
    { path: '/productos', label: 'Productos Reventa', icon: '🛒' },
    { path: '/insumos', label: 'Insumos', icon: '🥩' },
    { path: '/stock', label: 'Stock', icon: '📦' },
    { path: '/ventas', label: 'Ventas', icon: '📈' },
    { path: '/clientes', label: 'Clientes', icon: '👥' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/config', label: 'Configuración', icon: '⚙️' }
  ];

  const currentPage = navItems.find(item => item.path === location.pathname)?.label || 'La 7 FastFood';

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside 
        className="flex-col h-full"
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
          <button className="ghost" onClick={() => setCollapsed(!collapsed)} style={{ padding: '0.5rem', margin: collapsed ? '0 auto' : '0' }}>
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

      {/* Main Content Area */}
      <div className="flex-col" style={{ flex: 1, overflow: 'hidden' }}>
        {/* Topbar */}
        <header className="flex items-center justify-between px-6" style={{ height: '70px', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{currentPage}</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--green)', boxShadow: '0 0 8px var(--green)' }}></div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 overflow-y-auto animate-fade-in" style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
