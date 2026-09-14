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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded border border-[#d2d0ce] shadow-xl p-6 w-full max-w-sm border-t-4 border-t-[#0078d4] animate-fade-in">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#201f1e]">
            📐 Medir Bulto #{packageNumber}
          </h3>
          <button onClick={onClose} className="text-sm font-bold text-[#605e5c] hover:text-black cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-[#605e5c]">
            Ingresa las dimensiones (cm) y peso (kg) del bulto actual para el Packing List.
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-[#201f1e] mb-1">
                Largo (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                ref={lengthRef}
                onFocus={(e) => e.target.select()}
                required
                className="w-full text-center font-mono font-medium rounded border border-[#8a8886] p-2 text-sm text-[#201f1e] outline-none focus:border-[#0078d4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#201f1e] mb-1">
                Ancho (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                onFocus={(e) => e.target.select()}
                required
                className="w-full text-center font-mono font-medium rounded border border-[#8a8886] p-2 text-sm text-[#201f1e] outline-none focus:border-[#0078d4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#201f1e] mb-1">
                Alto (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                onFocus={(e) => e.target.select()}
                required
                className="w-full text-center font-mono font-medium rounded border border-[#8a8886] p-2 text-sm text-[#201f1e] outline-none focus:border-[#0078d4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#201f1e] mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onFocus={(e) => e.target.select()}
                required
                className="w-full text-center font-mono font-medium rounded border border-[#8a8886] p-2 text-sm text-[#201f1e] outline-none focus:border-[#0078d4]"
              />
            </div>
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
              Guardar Medidas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DimensionScanner;
