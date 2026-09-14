import React, { useState, useEffect, useRef } from 'react';

const ScannerModal = ({ title, onScan, onClose }) => {
  const [code, setCode] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded border border-[#d2d0ce] shadow-xl p-6 w-full max-w-sm border-t-4 border-t-[#0078d4] animate-fade-in">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#201f1e]">
            {title || 'Escanear Código'}
          </h3>
          <button onClick={onClose} className="text-sm font-bold text-[#605e5c] hover:text-black cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-[#605e5c]">
            Escribe o simula el escaneo del código de barras (SKU) del artículo.
          </p>
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#201f1e] mb-1">
              Código SKU / Barra
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              ref={inputRef}
              placeholder="Ej: 88601349, V-BELT"
              className="w-full text-center font-mono text-base font-semibold rounded border border-[#8a8886] p-2 text-[#201f1e] outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="rounded border border-[#d2d0ce] px-3 py-1.5 text-xs text-[#605e5c] hover:bg-[#f3f3f3] cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="rounded bg-[#0078d4] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white hover:bg-[#106ebe] transition-colors cursor-pointer shadow-xs"
            >
              Procesar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScannerModal;
