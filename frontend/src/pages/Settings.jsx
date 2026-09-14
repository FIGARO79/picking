import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from '../components/Spinner';
import '../styles/FluentPages.css';

const Settings = ({ defaultTab = 'upload' }) => {
  const { t, locale } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(urlTab || defaultTab || 'upload');
  
  // Estados para Carga de Archivos
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Estados para Transportadoras y CEDIs
  const [warehouses, setWarehouses] = useState([]);
  const [newWarehouse, setNewWarehouse] = useState('');
  const [carriers, setCarriers] = useState([]);
  const [newCarrier, setNewCarrier] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    if (urlTab && (urlTab === 'upload' || urlTab === 'config')) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/config/');
      if (!res.ok) throw new Error('Error al cargar la configuración.');
      const data = await res.json();
      setWarehouses(data.warehouses || (data.warehouse_name ? [data.warehouse_name] : []));
      setCarriers(data.carriers || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingConfig(false);
    }
  };

  // --- Handlers de Carga de Archivos ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith('.csv')) {
        setFile(dropped);
      } else {
        toast.warning(locale === 'pt' ? 'Por favor selecione um arquivo CSV.' : 'Por favor selecciona un archivo CSV.');
      }
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
        throw new Error(error.detail || (locale === 'pt' ? 'Erro ao atualizar o arquivo' : 'Error al actualizar el archivo'));
      }

      const data = await response.json();
      toast.success(data.message || (locale === 'pt' ? 'Arquivo carregado com sucesso!' : '¡Archivo cargado con éxito!'));
      setFile(null);
    } catch (err) {
      toast.error(err.message || (locale === 'pt' ? 'Erro ao conectar ao servidor.' : 'Error al conectar con el servidor.'));
    } finally {
      setUploading(false);
    }
  };

  // --- Handlers de CEDIs y Transportadoras ---
  const handleAddWarehouse = (e) => {
    e.preventDefault();
    const cleanWarehouse = newWarehouse.trim();
    if (!cleanWarehouse) return;
    if (warehouses.includes(cleanWarehouse)) {
      toast.warning(locale === 'pt' ? 'Este Centro de Distribuição já existe.' : 'Este Centro de Distribución ya existe.');
      return;
    }
    setWarehouses([...warehouses, cleanWarehouse]);
    setNewWarehouse('');
  };

  const handleRemoveWarehouse = (index) => {
    setWarehouses(warehouses.filter((_, idx) => idx !== index));
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
    setCarriers(carriers.filter((_, idx) => idx !== index));
  };

  const handleSaveConfig = async () => {
    if (warehouses.length === 0) {
      toast.warning(locale === 'pt' ? 'Pelo menos um Centro de Distribuição é obrigatório.' : 'Al menos un Centro de Distribución es requerido.');
      return;
    }

    setSavingConfig(true);
    try {
      const res = await fetch('/api/config/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          warehouse_name: warehouses[0],
          warehouses: warehouses,
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
      setSavingConfig(false);
    }
  };

  return (
    <div className="settings-page max-w-5xl mx-auto space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Selector de Pestañas Estilo Windows Fluent UI */}
      <div className="flex border-b border-[#c8c6c4] bg-white rounded-t px-4 pt-2 gap-2 shadow-2xs">
        <button
          type="button"
          onClick={() => handleTabChange('upload')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'upload'
              ? 'border-[#0078d4] text-[#0078d4] bg-[#f9f9f9]'
              : 'border-transparent text-[#374151] hover:text-[#111827] hover:border-[#605e5c]'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>{t('tabUpload')}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('config')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'config'
              ? 'border-[#0078d4] text-[#0078d4] bg-[#f9f9f9]'
              : 'border-transparent text-[#374151] hover:text-[#111827] hover:border-[#605e5c]'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{t('tabConfig')}</span>
        </button>
      </div>

      {/* PESTAÑA 1: CARGA DE ARCHIVO (CSV PICKING) */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="rounded border border-[#c8c6c4] bg-white p-6 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-[#111827] mb-1">
                {t('uploadSectionTitle')}
              </h3>
              <p className="text-sm text-[#374151]">
                {t('uploadSectionDesc')}
              </p>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative rounded border-2 border-dashed p-10 text-center transition-all ${
                  dragOver 
                    ? 'border-[#0078d4] bg-[#eff6fc]' 
                    : 'border-[#c8c6c4] bg-[#f9f9f9] hover:border-[#0078d4] hover:bg-[#eff6fc]'
                }`}
              >
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange}
                  id="settings-picking-file-input" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <label htmlFor="settings-picking-file-input" className="cursor-pointer flex flex-col items-center gap-2.5">
                  <div className="w-14 h-14 rounded-full bg-white border border-[#c8c6c4] flex items-center justify-center text-[#0078d4] shadow-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  {file ? (
                    <div className="text-center">
                      <span className="text-sm font-bold text-[#0078d4] block">
                        {t('selectedFile')}: <strong>{file.name}</strong>
                      </span>
                      <span className="text-xs text-[#374151]">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-bold text-[#111827] block">
                        {t('dragDropInstruction')}
                      </span>
                      <span className="text-xs text-[#374151] mt-1 block">
                        Formato admitido: CSV (.csv) delimitado por comas o tabulaciones
                      </span>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-[#374151]">
                  {file && (
                    <button 
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-[#8a1f24] hover:underline cursor-pointer font-bold text-xs md:text-sm"
                    >
                      {locale === 'pt' ? 'Limpar seleção' : 'Descartar archivo'}
                    </button>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={!file || uploading}
                  className="inline-flex items-center gap-2 rounded bg-[#0078d4] px-6 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#106ebe] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                >
                  {uploading ? (
                    <>
                      <span className="spinner w-4 h-4 border-2 border-white border-t-transparent inline-block" />
                      {t('uploadingBtn')}
                    </>
                  ) : (
                    t('uploadBtn')
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Tarjeta Informativa de Estructura de Datos */}
          <div className="rounded border border-[#c8c6c4] bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-[#0078d4]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#111827]">
                {locale === 'pt' ? 'Informações sobre o arquivo 240' : 'Información sobre el archivo 240'}
              </h4>
            </div>
            <p className="text-sm text-[#374151] leading-relaxed">
              {locale === 'pt'
                ? 'O relatório AURRSGLBD0240 contém as ordens pendentes de separação com códigos de item, linhas de pedido e quantidades solicitadas. Ao carregar o arquivo, o sistema atualiza em tempo real as ordens disponíveis para auditoria sem reiniciar os serviços.'
                : 'El reporte AURRSGLBD0240 contiene las órdenes pendientes de alistamiento con los códigos de artículo, líneas de pedido y cantidades requeridas. Al cargar el archivo, el sistema actualiza en tiempo real las órdenes disponibles para auditoría sin requerir reinicio del servicio.'}
            </p>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CENTROS Y TRANSPORTADORAS */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {loadingConfig ? (
            <div className="flex justify-center py-20 bg-white rounded border border-[#c8c6c4]">
              <Spinner size="lg" label="Cargando configuración..." />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna 1: Transportadoras */}
                <div className="rounded border border-[#c8c6c4] bg-white p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-[#111827] mb-1">
                        {locale === 'pt' ? 'Gestão de Transportadoras' : 'Gestión de Transportadoras'}
                      </h3>
                      <p className="text-sm text-[#374151]">
                        {locale === 'pt' 
                          ? 'Adicione ou remova as empresas de transporte de carga.' 
                          : 'Agrega o elimina empresas encargadas del transporte de carga.'}
                      </p>
                    </div>

                    <form onSubmit={handleAddCarrier} className="space-y-3 mb-5">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-wider text-[#111827]">
                        {locale === 'pt' ? 'Nova Transportadora' : 'Nueva Transportadora'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCarrier}
                          onChange={(e) => setNewCarrier(e.target.value)}
                          placeholder="Ej: DHL Express, FedEx..."
                          className="flex-grow rounded border border-[#605e5c] p-2.5 text-sm font-medium text-[#111827] outline-none focus:border-[#0078d4]"
                        />
                        <button 
                          type="submit" 
                          className="rounded bg-[#0078d4] px-4 py-2 text-xs md:text-sm font-bold uppercase text-white hover:bg-[#106ebe] transition-colors cursor-pointer shadow-xs"
                        >
                          {locale === 'pt' ? 'Adicionar' : 'Agregar'}
                        </button>
                      </div>
                    </form>

                    <div>
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-wider text-[#111827] mb-2">
                        {locale === 'pt' ? 'Transportadoras Ativas' : 'Transportadoras Activas'}
                      </label>
                      {carriers.length === 0 ? (
                        <div className="rounded border border-dashed border-[#c8c6c4] p-6 text-center text-sm text-[#374151]">
                          {locale === 'pt' ? 'Nenhuma transportadora cadastrada.' : 'No hay transportadoras registradas.'}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                          {carriers.map((carrier, index) => (
                            <div 
                              key={index} 
                              className="flex justify-between items-center bg-[#f9f9f9] border border-[#c8c6c4] px-3.5 py-2 rounded text-sm"
                            >
                              <span className="font-semibold text-[#111827]">{carrier}</span>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveCarrier(index)} 
                                className="text-[#8a1f24] font-bold text-base hover:text-red-700 cursor-pointer"
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
                </div>

                {/* Columna 2: Centros de Distribución */}
                <div className="rounded border border-[#c8c6c4] bg-white p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-[#111827] mb-1">
                        {locale === 'pt' ? 'Gestão de Centros de Distribuição' : 'Gestión de Centros de Distribución'}
                      </h3>
                      <p className="text-sm text-[#374151]">
                        {locale === 'pt' 
                          ? 'Adicione ou remova os centros de distribuição ativos.' 
                          : 'Agrega o elimina los centros de distribución (CEDI) activos.'}
                      </p>
                    </div>

                    <form onSubmit={handleAddWarehouse} className="space-y-3 mb-5">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-wider text-[#111827]">
                        {locale === 'pt' ? 'Novo Centro de Distribuição' : 'Nuevo Centro de Distribución'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newWarehouse}
                          onChange={(e) => setNewWarehouse(e.target.value)}
                          placeholder="Ej: CD Logix Bogotá - Bodega 3"
                          className="flex-grow rounded border border-[#605e5c] p-2.5 text-sm font-medium text-[#111827] outline-none focus:border-[#0078d4]"
                        />
                        <button 
                          type="submit" 
                          className="rounded bg-[#0078d4] px-4 py-2 text-xs md:text-sm font-bold uppercase text-white hover:bg-[#106ebe] transition-colors cursor-pointer shadow-xs"
                        >
                          {locale === 'pt' ? 'Adicionar' : 'Agregar'}
                        </button>
                      </div>
                    </form>

                    <div>
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-wider text-[#111827] mb-2">
                        {locale === 'pt' ? 'Centros de Distribuição Ativos' : 'Centros de Distribución Activos'}
                      </label>
                      {warehouses.length === 0 ? (
                        <div className="rounded border border-dashed border-[#c8c6c4] p-6 text-center text-sm text-[#374151]">
                          {locale === 'pt' ? 'Nenhum centro de distribuição cadastrado.' : 'No hay centros de distribución registrados.'}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                          {warehouses.map((wh, index) => (
                            <div 
                              key={index} 
                              className="flex justify-between items-center bg-[#f9f9f9] border border-[#c8c6c4] px-3.5 py-2 rounded text-sm"
                            >
                              <span className="font-semibold text-[#111827]">{wh}</span>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveWarehouse(index)} 
                                className="text-[#8a1f24] font-bold text-base hover:text-red-700 cursor-pointer"
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

                  <div className="mt-4 p-3.5 bg-[#f0f7fe] border-l-4 border-[#0078d4] rounded text-sm text-[#004e8c] font-medium">
                    {locale === 'pt' 
                      ? 'O Centro de Distribuição selecionado na impressão será impresso abaixo da linha de assinatura do operador.' 
                      : 'El Centro de Distribución seleccionado en la impresión se imprimirá debajo de la línea de firma del operador.'}
                  </div>
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-center pt-2">
                <button 
                  onClick={handleSaveConfig} 
                  disabled={savingConfig}
                  className="rounded bg-[#0078d4] px-8 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider text-white hover:bg-[#106ebe] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {savingConfig 
                    ? (locale === 'pt' ? 'Salvando Configuração...' : 'Guardando Configuración...') 
                    : (locale === 'pt' ? 'Salvar Configuração' : 'Guardar Configuración')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
