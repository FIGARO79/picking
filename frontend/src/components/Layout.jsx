import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import '../styles/Layout.css';

const Layout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, locale, changeLanguage } = useTranslation();
  const [auditorName, setAuditorName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  const getTranslatedTitle = (currentTitle) => {
    if (currentTitle === 'Dashboard') return t('menuDashboard');
    if (currentTitle === 'Auditoría de Picking') return t('menuAudit');
    if (currentTitle === 'Pickings Empacados') return t('menuHistory');
    if (currentTitle === 'Envíos Consolidados') return t('menuShipments');
    if (currentTitle === 'Configuración' || currentTitle === 'Configuração') return t('menuSettings');
    if (currentTitle === 'Carga de Archivos' || currentTitle === 'Carregar Arquivos') return t('menuUpload');
    return currentTitle || 'LOGIX';
  };

  const isPrintPage = location.pathname.includes('/print/');

  if (isPrintPage) {
    return <>{children}</>;
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navSections = [
    {
      title: 'Principal',
      items: [
        { path: '/', labelKey: 'menuDashboard', label: 'Inicio', desc: 'Panel principal' }
      ]
    },
    {
      title: 'Operaciones Outbound',
      items: [
        { path: '/picking', labelKey: 'menuAudit', label: 'Picking', desc: 'Verificación de pedidos' },
        { path: '/view_picking_audits', labelKey: 'menuHistory', label: 'Empaque', desc: 'Auditorías y empaque' },
        { path: '/shipments', labelKey: 'menuShipments', label: 'Despacho', desc: 'Gestión de despachos' }
      ]
    },
    {
      title: 'Sistema',
      items: [
        { path: '/settings', labelKey: 'menuSettings', label: 'Configuración', desc: 'Carga de archivos y parámetros' },
        { path: '/update', labelKey: 'menuUpload', label: 'Carga de Archivos', desc: 'Subir archivo de picking CSV' }
      ]
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f3f3] font-sans text-[#111827] print:block print:h-auto print:overflow-visible">
      {/* Header / Shell Bar Estilo Windows Fluent */}
      <header className="top-header sticky top-0 z-50 flex h-[48px] items-center justify-between border-b border-[#c8c6c4] bg-white px-4 text-[#111827] shadow-none print:hidden no-print">
        <div className="flex items-center gap-3">
          <button
            className="cursor-pointer rounded p-1.5 text-[#374151] transition-all hover:bg-[#e5e7eb] hover:text-[#111827]"
            onClick={toggleMenu}
            aria-label="Menú"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1 text-base font-bold tracking-wide text-[#1e3a5f] hover:text-[#0078d4] transition-colors">
              <span className="tracking-wider">LOGIX</span>
              <span className="text-[#0078d4] font-black">.</span>
            </Link>
            <span className="text-[#c8c6c4] text-sm">|</span>
            <span className="text-xs md:text-sm font-semibold text-[#111827] uppercase tracking-wide">
              {getTranslatedTitle(title)}
            </span>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="header-actions flex items-center gap-3">
          {/* Badge Online/Offline */}
          <div className={`hidden sm:flex items-center gap-1.5 rounded-full border border-solid px-2.5 py-0.5 text-xs font-semibold uppercase transition-all ${!isOnline ? 'border-[#8a1f24] bg-[#fee2e2] text-[#8a1f24]' : 'border-[#0e620e] bg-[#dcfce7] text-[#0e620e]'}`}>
            <span className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-[#8a1f24]' : 'bg-[#0e620e]'}`}></span>
            {!isOnline ? 'OFFLINE' : 'ONLINE'}
          </div>

          {/* Selector de Idioma */}
          <div className="flex items-center rounded border border-[#c8c6c4] bg-[#f9f9f9] p-0.5 text-xs font-semibold">
            <button
              onClick={() => changeLanguage('es')}
              className={`px-2 py-0.5 rounded transition-all ${locale === 'es' ? 'bg-[#0078d4] text-white font-bold' : 'text-[#374151] hover:text-[#111827]'}`}
              title="Español"
            >
              ES
            </button>
            <span className="text-[#c8c6c4] px-0.5">|</span>
            <button
              onClick={() => changeLanguage('pt')}
              className={`px-2 py-0.5 rounded transition-all ${locale === 'pt' ? 'bg-[#0078d4] text-white font-bold' : 'text-[#374151] hover:text-[#111827]'}`}
              title="Português"
            >
              PT
            </button>
          </div>

          {/* Perfil Auditor */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#c8c6c4]">
            <div className="w-7 h-7 rounded-full bg-[#0078d4] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {auditorName ? auditorName.trim().charAt(0).toUpperCase() : 'OP'}
            </div>
            <span className="hidden md:inline text-xs md:text-sm font-semibold text-[#111827] max-w-[140px] truncate" title={auditorName}>
              {auditorName || 'Auditor'}
            </span>
          </div>

          {/* Botón Salir */}
          <button
            onClick={handleLogout}
            className="cursor-pointer rounded border border-[#c8c6c4] px-3 py-1 text-xs font-semibold uppercase text-[#8a1f24] transition-all hover:bg-[#fee2e2] hover:border-[#f8b8bc]"
            title={t('endShift')}
          >
            {t('endShift')}
          </button>
        </div>
      </header>

      {/* Menú Lateral Desplegable Sincronizado a 48px */}
      <div
        className={`fixed left-0 z-[999] w-64 overflow-y-auto border-r border-[#c8c6c4] bg-[#f9f9f9] shadow-xl transition-transform duration-300 ease-in-out print:hidden no-print ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ top: '48px', height: 'calc(100vh - 48px)' }}
      >
        <nav className="py-3">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="px-4 mb-3">
              <div className={`mb-1.5 px-2 text-xs font-bold uppercase tracking-wider text-[#374151] ${sIdx > 0 ? 'border-t border-[#c8c6c4] pt-2.5' : ''}`}>
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <div key={item.path} className="group/item flex items-center justify-between pr-2 transition-all hover:bg-[#ececec]">
                    <Link
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex-grow flex cursor-pointer items-center border-l-[4px] px-3 py-2 leading-tight transition-all ${
                        isActive
                          ? 'border-[#0078d4] bg-[#e5e5e5] font-bold text-[#0078d4]'
                          : 'border-transparent text-[#111827] font-medium hover:border-[#0078d4]/50'
                      }`}
                    >
                      <span className="text-sm select-none">{t(item.labelKey) || item.label}</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          ))}

          <div className="px-4 mt-4 pt-3 border-t border-[#c8c6c4]">
            <button
              onClick={handleLogout}
              className="mt-1 flex w-full cursor-pointer items-center justify-start border-l-[4px] border-transparent px-3 py-2 text-left text-sm font-bold uppercase text-[#8a1f24] transition-all hover:bg-[#fee2e2]"
            >
              {t('endShift')}
            </button>
          </div>
        </nav>
      </div>

      {/* Overlay translúcido al abrir menú */}
      <div
        className={`fixed inset-0 z-[998] bg-black/20 backdrop-blur-sm transition-opacity print:hidden no-print ${isMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
        style={{ top: '48px' }}
        onClick={toggleMenu}
      />

      {/* Contenedor Principal */}
      <main className="main-content flex-grow overflow-y-auto overflow-x-hidden bg-[#f3f3f3] p-4 sm:p-6 print:h-auto print:overflow-visible">
        <div className="container-wrapper max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
