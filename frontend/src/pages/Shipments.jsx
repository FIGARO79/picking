import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from '../components/Spinner';
import '../styles/FluentPages.css';

const Shipments = () => {
  const { t, locale } = useTranslation();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Estados de Edición de Consolidado
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [editCarrier, setEditCarrier] = useState('');
  const [editNote, setEditNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shipments/', {
        headers: { 'Accept-Language': locale }
      });
      if (!res.ok) throw new Error('Error al cargar envíos consolidados.');
      const data = await res.json();
      setShipments(data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (shipment) => {
    setEditingShipment(shipment);
    setEditCarrier(shipment.carrier || '');
    setEditNote(shipment.note || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingShipment) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/shipments/${editingShipment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale
        },
        body: JSON.stringify({
          carrier: editCarrier.trim(),
          note: editNote.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al actualizar despacho.');
      }
      
      const data = await res.json();
      toast.success(data.message || `Despacho #${editingShipment.id} actualizado con éxito.`);
      setIsEditModalOpen(false);
      fetchShipments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="shipments-page space-y-4 max-w-[1400px] mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Barra de Acciones */}
      <div className="flex justify-between items-center bg-white p-3 rounded border border-[#c8c6c4] shadow-xs">
        <div>
          <span className="text-sm md:text-base font-bold uppercase tracking-wider text-[#111827]">
            {t('menuShipments')}
          </span>
          <span className="text-sm text-[#374151] ml-2 font-medium">
            ({shipments.length} envíos)
          </span>
        </div>

        <button 
          onClick={fetchShipments} 
          className="rounded border border-[#c8c6c4] bg-white px-3.5 py-1.5 text-xs md:text-sm font-semibold text-[#374151] hover:bg-[#e5e7eb] hover:text-[#111827] transition-colors cursor-pointer"
        >
          {t('syncBtn')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded border border-[#c8c6c4]">
          <Spinner size="lg" label="Cargando envíos consolidados..." />
        </div>
      ) : shipments.length === 0 ? (
        <div className="bg-white rounded border border-[#c8c6c4] p-12 text-center shadow-xs">
          <h3 className="text-sm font-bold uppercase text-[#374151] mb-1">{t('emptyShipmentsTitle')}</h3>
          <p className="text-sm text-[#374151]">
            {t('emptyShipmentsDesc')}{' '}
            <Link to="/view_picking_audits" className="text-[#0078d4] font-semibold hover:underline">
              {t('emptyShipmentsLink')}
            </Link>.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded border border-[#c8c6c4] shadow-xs">
          <table className="w-full text-left sap-table">
            <thead>
              <tr>
                <th className="text-center w-8"></th>
                <th className="text-center w-20">{t('tableHeaderShipment')}</th>
                <th className="text-center">{t('tableHeaderDate')}</th>
                <th>{t('tableHeaderCustomer')}</th>
                <th>{t('tableHeaderAuditor')}</th>
                <th>{t('tableHeaderCarrier')}</th>
                <th className="text-center w-20">{t('tableHeaderOrdersCount')}</th>
                <th className="text-center w-24">{t('tableHeaderStatus')}</th>
                <th className="text-center w-28">{t('tableHeaderActions')}</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => {
                const isExpanded = expandedId === s.id;
                const isCancelled = s.status === 'cancelled';

                return (
                  <React.Fragment key={s.id}>
                    <tr 
                      className={`hover:bg-[#f3f9fd] cursor-pointer ${isExpanded ? 'bg-[#eff6fc]' : ''} ${isCancelled ? 'bg-[#fee2e2]/40 opacity-75' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    >
                      <td className="text-center text-xs text-[#374151] font-bold">
                        {isExpanded ? '▼' : '▶'}
                      </td>
                      <td className="text-center font-mono text-sm font-semibold text-[#374151]">#{s.id}</td>
                      <td className="text-center font-mono text-sm text-[#374151]">{formatDate(s.created_at)}</td>
                      <td className="text-sm truncate max-w-xs text-[#111827]">
                        {s.audits.length > 0 && (
                          <>
                            <span className="text-[#374151] font-semibold">[{s.audits[0].customer_code}]</span> {s.audits[0].customer_name}
                            {s.audits.length > 1 && (
                              <span className="ml-1 text-xs bg-[#e0f2fe] text-[#004e8c] font-bold px-1.5 py-0.5 rounded">
                                +{s.audits.length - 1}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="text-sm text-[#111827]">{s.username}</td>
                      <td className="text-sm font-semibold text-[#111827]">{s.carrier || '—'}</td>
                      <td className="text-center font-mono text-sm font-bold text-[#0078d4]">
                        {s.total_orders}
                      </td>
                      <td className="text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                          isCancelled ? 'bg-[#fee2e2] text-[#8a1f24]' : 'bg-[#dcfce7] text-[#0e620e]'
                        }`}>
                          {isCancelled ? t('badgeCancelled') : t('badgeActive')}
                        </span>
                      </td>
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2.5 text-sm">
                          {!isCancelled && (
                            <>
                              <Link 
                                to={`/packing_list/print/${s.id}?consolidated=true`}
                                className="text-[#0078d4] hover:underline font-semibold"
                                title="Ver e imprimir Packing List Consolidado"
                              >
                                {t('btnPrint')}
                              </Link>
                              <button 
                                onClick={() => handleEditClick(s)}
                                className="text-[#0078d4] hover:underline font-semibold cursor-pointer"
                                title="Editar despacho"
                              >
                                {t('btnEdit')}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Fila Detalle Expandida */}
                    {isExpanded && (
                      <tr className="bg-[#fafafa]">
                        <td colSpan="9" className="p-4 border-b border-[#c8c6c4]">
                          <div className="bg-white rounded border border-[#c8c6c4] p-4 shadow-xs">
                            <div className="mb-3">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-[#111827]">
                                {t('expandedShipmentTitle')} #{s.id}
                              </h4>
                              {s.note && (
                                <p className="text-sm text-[#374151] mt-1 p-2.5 bg-[#f9f9f9] border-l-3 border-[#0078d4] rounded">
                                  {t('expandedShipmentNote')}: <em>{s.note}</em>
                                </p>
                              )}
                            </div>
                            
                            <table className="w-full text-left sap-table">
                              <thead>
                                <tr>
                                  <th className="w-16">{t('expandedShipmentTableHeaderAudit')}</th>
                                  <th>{t('expandedShipmentTableHeaderOrder')}</th>
                                  <th className="w-16 text-center">{t('expandedShipmentTableHeaderDespatch')}</th>
                                  <th>{t('expandedShipmentTableHeaderCustCode')}</th>
                                  <th>{t('expandedShipmentTableHeaderCustName')}</th>
                                  <th className="text-center w-20">{t('expandedShipmentTableHeaderPkgs')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {s.audits.map((a, idx) => (
                                  <tr key={idx} className="hover:bg-[#f3f9fd]">
                                    <td className="font-mono text-sm text-[#374151]">#{a.audit_id}</td>
                                    <td><span className="font-mono font-bold text-[#111827] text-sm">{a.order_number}</span></td>
                                    <td className="font-mono text-center text-sm text-[#374151]">{a.despatch_number}</td>
                                    <td className="font-mono text-sm text-[#374151]">{a.customer_code}</td>
                                    <td className="text-sm text-[#111827]">{a.customer_name}</td>
                                    <td className="text-center font-mono text-sm font-bold text-[#111827]">{a.packages}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Edición de Consolidado */}
      {isEditModalOpen && editingShipment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#c8c6c4] shadow-xl p-6 w-full max-w-md border-t-4 border-t-[#0078d4]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold uppercase text-[#111827]">
                {locale === 'pt' ? 'Editar Envio Consolidado' : 'Editar Envío Consolidado'} #{editingShipment.id}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-base font-bold text-[#374151] hover:text-[#111827] cursor-pointer">✕</button>
            </div>
            
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs md:text-sm font-bold uppercase text-[#111827] mb-1.5">
                  {t('carrierLabel')}
                </label>
                <input
                  type="text"
                  className="w-full rounded border border-[#605e5c] p-2.5 text-sm font-medium text-[#111827] outline-none focus:border-[#0078d4]"
                  value={editCarrier}
                  onChange={(e) => setEditCarrier(e.target.value)}
                  placeholder={t('carrierPlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-xs md:text-sm font-bold uppercase text-[#111827] mb-1.5">
                  {t('notesLabel')}
                </label>
                <textarea
                  className="w-full rounded border border-[#605e5c] p-2.5 text-sm font-medium text-[#111827] outline-none focus:border-[#0078d4]"
                  rows={3}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2.5">
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="rounded border border-[#c8c6c4] px-4 py-2 text-xs md:text-sm font-semibold text-[#374151] hover:bg-[#e5e7eb] hover:text-[#111827] cursor-pointer"
                disabled={isSaving}
              >
                {t('cancelBtn')}
              </button>
              <button 
                onClick={handleSaveEdit} 
                className="rounded bg-[#0078d4] px-5 py-2 text-xs md:text-sm font-bold uppercase text-white hover:bg-[#106ebe] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                disabled={isSaving}
              >
                {isSaving ? (locale === 'pt' ? 'Salvando...' : 'Guardando...') : (locale === 'pt' ? 'Salvar Alterações' : 'Guardar Cambios')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shipments;
