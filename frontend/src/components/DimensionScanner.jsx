import React, { useState, useEffect, useRef } from 'react';

const DimensionScanner = ({ packageNumber, onConfirm, onClose, initialData }) => {
  const [length, setLength] = useState('0.0');
  const [width, setWidth] = useState('0.0');
  const [height, setHeight] = useState('0.0');
  const [weight, setWeight] = useState('0.0');

  const lengthRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setLength(initialData.length?.toString() || '0.0');
      setWidth(initialData.width?.toString() || '0.0');
      setHeight(initialData.height?.toString() || '0.0');
      setWeight(initialData.weight?.toString() || '0.0');
    }
    if (lengthRef.current) {
      lengthRef.current.focus();
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      length: parseFloat(length) || 0.0,
      width: parseFloat(width) || 0.0,
      height: parseFloat(height) || 0.0,
      weight: parseFloat(weight) || 0.0
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content dimension-modal" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h3>📐 Medir Bulto #{packageNumber}</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <p className="dim-desc">Ingresa las dimensiones (cm) y peso (kg) del bulto actual para el Packing List.</p>
          
          <div className="dims-grid">
            <div className="input-group">
              <label className="form-label">Largo (cm)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                ref={lengthRef}
                onFocus={(e) => e.target.select()}
                required
              />
            </div>

            <div className="input-group">
              <label className="form-label">Ancho (cm)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                onFocus={(e) => e.target.select()}
                required
              />
            </div>

            <div className="input-group">
              <label className="form-label">Alto (cm)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                onFocus={(e) => e.target.select()}
                required
              />
            </div>

            <div className="input-group">
              <label className="form-label">Peso (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onFocus={(e) => e.target.select()}
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Medidas
            </button>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .dimension-modal {
          border-top: 4px solid var(--primary);
        }

        .dim-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
          line-height: 1.4;
        }

        .dims-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .dims-grid .input-group {
          margin-bottom: 0;
        }

        .dims-grid input {
          font-size: 1.1rem;
          text-align: center;
          font-weight: 500;
        }
      `}} />
    </div>
  );
};

export default DimensionScanner;
