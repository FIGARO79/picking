import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';

const Login = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">📦</div>
        <h1>{t('welcomeTitle')}</h1>
        <p className="login-subtitle">{t('welcomeSubtitle')}</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="form-label">{t('auditorNameLabel')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auditorNamePlaceholder')}
              required
              autoFocus
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn">
            {t('startShiftBtn')}
          </button>
        </form>
      </div>


      <style dangerouslySetInnerHTML={{
        __html: `
        .login-overlay {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: var(--font-sans);
        }

        .login-card {
          background-color: white;
          border-radius: var(--radius-lg);
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          text-align: center;
          animation: card-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes card-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .login-logo {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: inline-block;
          background: #f1f5f9;
          width: 72px;
          height: 72px;
          line-height: 72px;
          border-radius: var(--radius-md);
        }

        .login-card h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.25rem;
        }

        .login-subtitle {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 2.5rem;
        }

        .login-form {
          text-align: left;
        }

        .login-form .input-group {
          margin-bottom: 1.5rem;
        }

        .login-form input {
          height: 48px !important;
          font-size: 1rem !important;
          border: 2px solid var(--border-color) !important;
          border-radius: var(--radius-md) !important;
        }

        .login-form input:focus {
          border-color: var(--primary) !important;
        }

        .login-btn {
          width: 100%;
          height: 48px;
          font-size: 1rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          background-color: var(--primary);
        }
      `}} />
    </div>
  );
};

export default Login;
