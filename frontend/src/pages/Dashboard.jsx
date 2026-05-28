import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const modules = [
    {
      titleKey: 'moduleAuditTitle',
      descKey: 'moduleAuditDesc',
      icon: '🔍',
      color: '#285f94',
      path: '/picking'
    },
    {
      titleKey: 'moduleHistoryTitle',
      descKey: 'moduleHistoryDesc',
      icon: '📦',
      color: '#10b981',
      path: '/view_picking_audits'
    },
    {
      titleKey: 'moduleShipmentsTitle',
      descKey: 'moduleShipmentsDesc',
      icon: '🚚',
      color: '#f59e0b',
      path: '/shipments'
    }
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/update/picking_file', {
        method: 'POST',
        headers: {
          'Accept-Language': locale
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al actualizar el archivo');
      }

      const data = await response.json();
      toast.success(data.message || t('uploadSectionTitle'));
      setFile(null);
    } catch (err) {
      toast.error(err.message || 'Error al conectar con el servidor.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Grid de Módulos */}
      <div className="modules-grid">
        {modules.map((m, idx) => (
          <div 
            key={idx} 
            className="module-card"
            onClick={() => navigate(m.path)}
            style={{ '--accent-color': m.color }}
          >
            <div className="module-icon">{m.icon}</div>
            <div className="module-details">
              <h3>{t(m.titleKey)}</h3>
              <p>{t(m.descKey)}</p>
            </div>
            <span className="module-arrow">→</span>
          </div>
        ))}
      </div>

      {/* Sección de Actualización de Datos */}
      <div className="card upload-section">
        <div className="upload-header">
          <h3>📂 {t('uploadSectionTitle')}</h3>
          <p>{t('uploadSectionDesc')}</p>
        </div>

        <form onSubmit={handleUpload} className="upload-form">
          <div className="file-dropzone">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              id="picking-file-input" 
              className="file-input"
            />
            <label htmlFor="picking-file-input" className="file-label">
              <span className="upload-cloud">☁️</span>
              {file ? (
                <span className="file-name">{t('selectedFile')} <strong>{file.name}</strong></span>
              ) : (
                <span className="file-instruction">{t('dragDropInstruction')}</span>
              )}
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary upload-btn" 
            disabled={!file || uploading}
          >
            {uploading ? t('uploadingBtn') : t('uploadBtn')}
          </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .module-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-left: 5px solid var(--accent-color);
          border-radius: var(--radius-md);
          padding: 1.75rem;
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 1.25rem;
          cursor: pointer;
          transition: var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .module-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          background-color: #fafbfc;
        }

        .module-icon {
          font-size: 2.25rem;
          background-color: var(--bg-app);
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }

        .module-details {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .module-details h3 {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--accent);
        }

        .module-details p {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.3;
        }

        .module-arrow {
          font-size: 1.2rem;
          color: var(--text-light);
          transition: var(--transition-fast);
        }

        .module-card:hover .module-arrow {
          color: var(--primary);
          transform: translateX(3px);
        }

        .upload-section {
          padding: 2rem;
        }

        .upload-header {
          margin-bottom: 1.5rem;
        }

        .upload-header h3 {
          margin-bottom: 0.25rem;
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .file-dropzone {
          border: 2px dashed #cbd5e1;
          border-radius: var(--radius-md);
          background-color: #f8fafc;
          padding: 2.5rem;
          text-align: center;
          cursor: pointer;
          position: relative;
          transition: var(--transition-fast);
        }

        .file-dropzone:hover {
          border-color: var(--primary);
          background-color: var(--primary-light);
        }

        .file-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .file-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .upload-cloud {
          font-size: 2.5rem;
          margin-bottom: 0.25rem;
        }

        .file-instruction {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .file-name {
          font-size: 0.9rem;
          color: var(--primary);
        }

        .upload-btn {
          height: 44px;
          font-size: 0.9rem;
          font-weight: 600;
        }
      `}} />
    </div>
  );
};

export default Dashboard;
