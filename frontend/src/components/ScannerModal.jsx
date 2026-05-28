import React, { useState, useEffect, useRef } from 'react';

const ScannerModal = ({ title, onScan, onClose }) => {
  const [code, setCode] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Asegurar auto-focus del input al abrir el modal
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode) {
      onScan(cleanCode);
      setCode('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content scanner-modal" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>{title || 'Escanear Código'}</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <p className="scanner-desc">Escribe o simula el escaneo del código de barras (SKU) del artículo.</p>
          
          <div className="input-group">
            <label className="form-label">Código SKU / Barra</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              ref={inputRef}
              placeholder="Ej: 88601349, V-BELT"
              className="scanner-input"
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Procesar
            </button>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .scanner-modal {
          border-top: 4px solid var(--primary);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--accent);
        }

        .close-btn {
          background: transparent;
          border: none;
          font-size: 1.2rem;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-fast);
          padding: 0.25rem;
        }

        .close-btn:hover {
          color: var(--text-main);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .scanner-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
          line-height: 1.4;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .scanner-input {
          text-align: center;
          font-family: var(--font-mono);
          font-size: 1.1rem;
          letter-spacing: 0.05em;
          font-weight: 500;
          height: 48px !important;
          border: 2px solid var(--border-color) !important;
        }

        .scanner-input:focus {
          border-color: var(--primary) !important;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
      `}} />
    </div>
  );
};

export default ScannerModal;
