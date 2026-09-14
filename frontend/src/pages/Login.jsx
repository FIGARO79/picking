import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import '../styles/FluentPages.css';

const Login = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { t, locale, changeLanguage } = useTranslation();

  useEffect(() => {
    const stored = localStorage.getItem('auditor_name');
    if (stored) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (cleanName) {
      localStorage.setItem('auditor_name', cleanName);
      navigate('/');
    }
  };

  return (
    <div className="login-page min-h-screen flex flex-col items-center justify-center bg-[#f3f3f3] p-4">
      <div className="logix-login-card bg-white p-8 rounded border border-[#c8c6c4] shadow-md w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold tracking-wider text-[#111827]">
            LOGIX<span className="text-[#0078d4]">.</span>
          </div>
          <h1 className="text-sm font-semibold text-[#374151] uppercase tracking-wider mt-1.5">
            {t('welcomeSubtitle')}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-bold uppercase tracking-wider text-[#111827] mb-1.5">
              {t('auditorNameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auditorNamePlaceholder')}
              required
              autoFocus
              className="w-full rounded border border-[#605e5c] p-2.5 text-sm font-medium text-[#111827] outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#0078d4] text-white py-2.5 rounded text-xs md:text-sm font-bold uppercase tracking-wider hover:bg-[#106ebe] transition-colors cursor-pointer shadow-xs"
          >
            {t('startShiftBtn')}
          </button>
        </form>

        {/* Selector de idioma */}
        <div className="mt-6 pt-4 border-t border-[#e5e7eb] flex justify-center items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => changeLanguage('es')}
            className={`px-2.5 py-1 rounded transition-colors ${
              locale === 'es' ? 'bg-[#0078d4] text-white font-bold' : 'text-[#374151] hover:text-[#111827]'
            }`}
          >
            ES
          </button>
          <span className="text-[#c8c6c4]">|</span>
          <button
            onClick={() => changeLanguage('pt')}
            className={`px-2.5 py-1 rounded transition-colors ${
              locale === 'pt' ? 'bg-[#0078d4] text-white font-bold' : 'text-[#374151] hover:text-[#111827]'
            }`}
          >
            PT
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
