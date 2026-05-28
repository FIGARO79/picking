import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Settings = () => {
  const { t, locale } = useTranslation();
  const [warehouseName, setWarehouseName] = useState('');
  const [carriers, setCarriers] = useState([]);
  const [newCarrier, setNewCarrier] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config/');
      if (!res.ok) throw new Error('Error al cargar la configuración.');
      const data = await res.json();
      setWarehouseName(data.warehouse_name || '');
      setCarriers(data.carriers || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCarrier = (e) => {
    e.preventDefault();
    const cleanCarrier = newCarrier.trim();
    if (!cleanCarrier) return;
    if (carriers.includes(cleanCarrier)) {
      toast.warning(locale === 'pt' ? 'Esta transportadora já existe.' : 'Esta transportadora ya existe.');
      return;
    }
    setCarriers([...carriers, cleanCarrier]);
    setNewCarrier('');
  };

  const handleRemoveCarrier = (index) => {
    const updated = carriers.filter((_, idx) => idx !== index);
    setCarriers(updated);
  };

  const handleSaveConfig = async () => {
    if (!warehouseName.trim()) {
      toast.warning(locale === 'pt' ? 'O nome da adega é obrigatório.' : 'El nombre de la bodega es requerido.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/config/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          warehouse_name: warehouseName.trim(),
          carriers: carriers
        })
      });

      if (!res.ok) throw new Error('Error al guardar la configuración.');
      
      toast.success(
        locale === 'pt' 
          ? 'Configuração salva com sucesso!' 
          : '¡Configuración guardada con éxito!'
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="settings-container animate-fade-in">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="settings-grid">
        {/* Columna 1: Transportadoras */}
        <div className="card settings-card">
          <div className="card-header-fiori">
            <h3>📦 {locale === 'pt' ? 'Gestão de Transportadoras' : 'Gestión de Transportadoras'}</h3>
            <p className="card-subtitle-fiori">
              {locale === 'pt' 
                ? 'Adicione ou remova as empresas de transporte de carga.' 
                : 'Agrega o elimina empresas encargadas del transporte de carga.'}
            </p>
          </div>

          <form onSubmit={handleAddCarrier} className="carrier-form" style={{ marginTop: '1rem' }}>
            <div className="input-group">
              <label className="form-label" style={{ fontWeight: '600' }}>
                {locale === 'pt' ? 'Nova Transportadora' : 'Nueva Transportadora'}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="text"
                  value={newCarrier}
                  onChange={(e) => setNewCarrier(e.target.value)}
                  placeholder="Ej: DHL Express, FedEx, Coordinadora..."
                  style={{ flex: 1, height: '36px', padding: '0 0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ height: '36px', padding: '0 1rem', display: 'flex', alignItems: 'center' }}>
                  ＋ {locale === 'pt' ? 'Adicionar' : 'Agregar'}
                </button>
              </div>
            </div>
          </form>

          <div className="carriers-list-container" style={{ marginTop: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
              {locale === 'pt' ? 'Transportadoras Ativas' : 'Transportadoras Activas'}
            </label>
            {carriers.length === 0 ? (
              <div style={{ padding: '1rem', border: '1px dashed #ccc', borderRadius: '4px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                {locale === 'pt' ? 'Nenhuma transportadora cadastrada.' : 'No hay transportadoras registradas.'}
              </div>
            ) : (
              <div className="carriers-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {carriers.map((carrier, index) => (
                  <div key={index} className="carrier-item" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px'
                  }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{carrier}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveCarrier(index)} 
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0 4px',
                        fontWeight: 'bold'
                      }}
                      title={locale === 'pt' ? 'Remover' : 'Eliminar'}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna 2: Nombre de la Bodega */}
        <div className="card settings-card">
          <div className="card-header-fiori">
            <h3>🏢 {locale === 'pt' ? 'Dados do Centro de Distribuição' : 'Datos del Centro de Distribución'}</h3>
            <p className="card-subtitle-fiori">
              {locale === 'pt' 
                ? 'Configure o nome oficial da adega/CD para a assinatura do auditor.' 
                : 'Configura el nombre oficial de la bodega/CD para la firma del auditor.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="input-group">
              <label className="form-label" style={{ fontWeight: '600' }}>
                {locale === 'pt' ? 'Nome da Adega (WMS / CD)' : 'Nombre de la Bodega (WMS / CD)'}
              </label>
              <input
                type="text"
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                placeholder="Ej: CD Logix Bogotá - Bodega 3"
                style={{ width: '100%', height: '36px', padding: '0 0.5rem', border: '1px solid #ccc', borderRadius: '4px', marginTop: '0.25rem' }}
              />
            </div>
            
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              borderLeft: '4px solid var(--primary)', 
              padding: '0.75rem 1rem', 
              borderRadius: '4px', 
              fontSize: '0.8rem', 
              color: '#1e40af', 
              marginTop: '1rem',
              lineHeight: '1.4'
            }}>
              ℹ️ {locale === 'pt' 
                ? 'O nome da adega será impresso diretamente abaixo da linha de assinatura do operador em todas las vias dos volumes e etiquetas de embalagem.' 
                : 'El nombre de la bodega se imprimirá directamente debajo de la línea de firma del operador en todas las etiquetas de bultos y packing lists.'}
            </div>
          </div>
        </div>
      </div>

      {/* Botón Guardar Centrado en la base */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <button 
          onClick={handleSaveConfig} 
          className="btn btn-primary" 
          style={{ 
            height: '40px', 
            padding: '0 2.5rem', 
            fontSize: '0.95rem', 
            fontWeight: '600', 
            boxShadow: '0 4px 12px rgba(40,95,148,0.2)',
            backgroundColor: 'var(--primary)',
            color: 'white'
          }}
          disabled={saving}
        >
          {saving 
            ? (locale === 'pt' ? 'Salvando Configuração...' : 'Guardando Configuración...') 
            : (locale === 'pt' ? 'Salvar Configuração' : 'Guardar Configuración')}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .settings-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          background-color: white;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }

        .card-header-fiori h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--accent);
          margin-bottom: 0.25rem;
        }

        .card-subtitle-fiori {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.3;
        }

        .carriers-list::-webkit-scrollbar {
          width: 6px;
        }
        .carriers-list::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .carriers-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        `
      }} />
    </div>
  );
};

export default Settings;
