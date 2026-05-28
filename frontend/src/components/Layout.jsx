import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';

const Layout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, locale, changeLanguage } = useTranslation();
  const [auditorName, setAuditorName] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('auditor_name');
    if (!stored && location.pathname !== '/login') {
      navigate('/login');
    } else {
      setAuditorName(stored || '');
    }
  }, [location, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('auditor_name');
    navigate('/login');
  };

  const navItems = [
    { path: '/', labelKey: 'menuDashboard', icon: '📊' },
    { path: '/picking', labelKey: 'menuAudit', icon: '🔍' },
    { path: '/view_picking_audits', labelKey: 'menuHistory', icon: '📦' },
    { path: '/shipments', labelKey: 'menuShipments', icon: '🚚' },
    { path: '/settings', labelKey: 'menuSettings', icon: '⚙️' }
  ];

  const getTranslatedTitle = (currentTitle) => {
    if (currentTitle === 'Dashboard') return t('menuDashboard');
    if (currentTitle === 'Auditoría de Picking') return t('menuAudit');
    if (currentTitle === 'Pickings Empacados') return t('menuHistory');
    if (currentTitle === 'Envíos Consolidados') return t('menuShipments');
    if (currentTitle === 'Configuración' || currentTitle === 'Configuração') return t('menuSettings');
    return currentTitle;
  };

  const isPrintPage = location.pathname.includes('/print/');

  if (isPrintPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-container">
      {/* Barra Lateral Premium */}
      <aside className="sidebar no-print">
        <div className="sidebar-logo">
          <span className="logo-icon">📦</span>
          <div className="logo-text">
            <h2>LOGIX</h2>
            <span>{t('welcomeSubtitle')}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Selector de Idioma Manual */}
        <div className="language-selector">
          <button 
            onClick={() => changeLanguage('es')} 
            className={`lang-btn ${locale === 'es' ? 'active' : ''}`}
            title="Español"
          >
            ES
          </button>
          <span className="lang-divider">|</span>
          <button 
            onClick={() => changeLanguage('pt')} 
            className={`lang-btn ${locale === 'pt' ? 'active' : ''}`}
            title="Português (Brasil)"
          >
            PT
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="auditor-profile">
            <div className="profile-avatar">👤</div>
            <div className="profile-info">
              <span className="profile-title">{t('shiftActive')}</span>
              <span className="profile-name" title={auditorName}>{auditorName || 'N/A'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout" title={t('endShift')}>
            🚪 {t('endShift')}
          </button>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <main className="main-content">
        <header className="page-header no-print">
          <div>
            <h1>{getTranslatedTitle(title)}</h1>
            <p className="page-subtitle">LOGIX - SISTEMA DE CONTROL DE EMPAQUE</p>
          </div>
          <div className="header-status">
            <span className="status-indicator online"></span>
            <span className="status-text">SISTEMA ONLINE</span>
          </div>
        </header>

        <div className="page-body">
          {children}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .sidebar {
          width: 260px;
          background-color: var(--accent);
          color: white;
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
          padding: 1.5rem 1rem;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
          padding-left: 0.5rem;
        }

        .logo-icon {
          font-size: 1.75rem;
          background: rgba(255,255,255,0.1);
          padding: 0.25rem;
          border-radius: var(--radius-sm);
        }

        .logo-text h2 {
          color: white;
          font-size: 1.15rem;
          font-weight: 600;
          line-height: 1.1;
        }

        .logo-text span {
          font-size: 0.55rem;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
          display: block;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          flex-grow: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: var(--transition-fast);
        }

        .nav-item:hover {
          color: white;
          background-color: rgba(255,255,255,0.05);
        }

        .nav-item.active {
          color: white;
          background-color: var(--primary);
        }

        /* Selector de Idioma */
        .language-selector {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: auto;
          margin-bottom: 1rem;
          padding: 0.4rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .lang-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .lang-btn:hover {
          color: white;
        }

        .lang-btn.active {
          color: white;
          background-color: var(--primary);
        }

        .lang-divider {
          color: rgba(255, 255, 255, 0.15);
          font-size: 0.75rem;
        }

        .sidebar-footer {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .auditor-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255,255,255,0.03);
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255,255,255,0.05);
        }

        .profile-avatar {
          font-size: 1.25rem;
          background: rgba(255,255,255,0.1);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .profile-title {
          font-size: 0.65rem;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .profile-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-logout {
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          height: 36px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.25rem;
          margin-bottom: 2rem;
        }

        .page-subtitle {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--text-light);
          margin-top: 0.15rem;
        }

        .header-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #f8fafc;
          border: 1px solid var(--border-color);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-indicator.online {
          background-color: var(--success);
          box-shadow: 0 0 8px var(--success);
        }

        .status-text {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            padding: 1rem;
          }
          .sidebar-logo {
            margin-bottom: 1rem;
          }
          .language-selector {
            margin-top: 1rem;
            margin-bottom: 1rem;
          }
          .sidebar-footer {
            display: none; /* Simplificado en mobile */
          }
        }
      `}} />
    </div>
  );
};

export default Layout;
