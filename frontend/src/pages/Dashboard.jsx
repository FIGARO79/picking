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
      color: '#285f94',
      path: '/picking'
    },
    {
      titleKey: 'moduleHistoryTitle',
      descKey: 'moduleHistoryDesc',
      color: '#10b981',
      path: '/view_picking_audits'
    },
    {
      titleKey: 'moduleShipmentsTitle',
      descKey: 'moduleShipmentsDesc',
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
            <div className="module-details">
              <h3>{t(m.titleKey)}</h3>
              <p>{t(m.descKey)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sección de Actualización de Datos */}
      <div className="card upload-section">
        <div className="upload-header">
          <h3>{t('uploadSectionTitle')}</h3>
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
          border-left: 4px solid var(--accent-color);
          border-radius: var(--radius-md);
          padding: 1.75rem;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          cursor: pointer;
          transition: var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .module-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--border-color);
          background-color: #fafbfc;
        }

        .module-details {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .module-details h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--accent);
        }

        .module-details p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .upload-section {
          padding: 2rem;
        }

        .upload-header {
          margin-bottom: 1.5rem;
        }

        .upload-header h3 {
          margin-bottom: 0.25rem;
          font-weight: 600;
          color: var(--accent);
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .file-dropzone {
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-md);
          background-color: #f8fafc;
          padding: 3rem 2rem;
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
