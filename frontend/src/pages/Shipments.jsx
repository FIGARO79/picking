import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
        headers: {
          'Accept-Language': locale
        }
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
    <div className="shipments-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="shipments-action-bar no-print">
        <button onClick={fetchShipments} className="btn btn-secondary">
          🔄 {t('syncBtn')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
        </div>
      ) : shipments.length === 0 ? (
        <div className="card text-center py-20 animate-fade-in" style={{ borderStyle: 'dashed' }}>
          <h3 style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>{t('emptyShipmentsTitle')}</h3>
          <p>
            {t('emptyShipmentsDesc')}{' '}
            <Link to="/view_picking_audits" style={{ color: 'var(--primary)', fontWeight: '600' }}>
              {t('emptyShipmentsLink')}
            </Link>.
          </p>
        </div>
      ) : (
        <div className="table-container shipments-table-container">
          <table>
            <thead>
              <tr className="bg-zinc-900 text-white">
                <th style={{ width: '40px' }}></th>
                <th>{t('tableHeaderShipment')}</th>
                <th>{t('tableHeaderDate')}</th>
                <th>{t('tableHeaderCustomer')}</th>
                <th>{t('tableHeaderAuditor')}</th>
                <th>{t('tableHeaderCarrier')}</th>
                <th className="text-center">{t('tableHeaderOrdersCount')}</th>
                <th className="text-center">{t('tableHeaderStatus')}</th>
                <th className="text-center">{t('tableHeaderActions')}</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => {
                const isExpanded = expandedId === s.id;
                const isCancelled = s.status === 'cancelled';

                return (
                  <React.Fragment key={s.id}>
                    <tr 
                      className={`hoverable cursor-pointer ${isExpanded ? 'row-expanded' : ''} ${isCancelled ? 'row-cancelled' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    >
                      <td className="text-center">
                        <span className="expand-arrow">{isExpanded ? '▼' : '▶'}</span>
                      </td>
                      <td className="text-mono">#{s.id}</td>
                      <td className="text-mono text-xs text-muted">{formatDate(s.created_at)}</td>
                      <td className="truncate-cell" style={{ maxWidth: '220px' }}>
                        {s.audits.length > 0 && (
                          <>
                            <span className="text-muted">[{s.audits[0].customer_code}]</span> {s.audits[0].customer_name}
                            {s.audits.length > 1 && (
                              <span className="pkg-more-badge">+{s.audits.length - 1}</span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="profile-cell">{s.username}</td>
                      <td><strong>{s.carrier || '—'}</strong></td>
                      <td className="text-center font-medium">
                        <span className="orders-count-badge">{s.total_orders}</span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${
                          isCancelled ? 'badge-danger' : 'badge-success'
                        }`}>
                          {isCancelled ? t('badgeCancelled') : t('badgeActive')}
                        </span>
                      </td>
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="action-buttons">
                          {!isCancelled && (
                            <>
                              <Link 
                                to={`/packing_list/print/${s.id}?consolidated=true`}
                                className="btn-action-text print"
                                title="Ver e imprimir Packing List Consolidado"
                              >
                                {t('btnPrint')}
                              </Link>
                              <button 
                                onClick={() => handleEditClick(s)}
                                className="btn-action-text edit"
                                title="Editar despacho"
                              >
                                {t('btnEdit')}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="expanded-detail-row">
                        <td colSpan="9" className="expanded-detail-cell">
                          <div className="expanded-card">
                            <div className="expanded-card-header">
                              <h4>{t('expandedShipmentTitle')} #{s.id}</h4>
                              {s.note && (
                                <p className="shipment-notes-p">{t('expandedShipmentNote')}: <em>{s.note}</em></p>
                              )}
                            </div>
                            
                            <table>
                              <thead>
                                <tr>
                                  <th>{t('expandedShipmentTableHeaderAudit')}</th>
                                  <th>{t('expandedShipmentTableHeaderOrder')}</th>
                                  <th>{t('expandedShipmentTableHeaderDespatch')}</th>
                                  <th>{t('expandedShipmentTableHeaderCustCode')}</th>
                                  <th>{t('expandedShipmentTableHeaderCustName')}</th>
                                  <th className="text-center">{t('expandedShipmentTableHeaderPkgs')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {s.audits.map((a, idx) => (
                                  <tr key={idx}>
                                    <td className="text-mono">#{a.audit_id}</td>
                                    <td><strong>{a.order_number}</strong></td>
                                    <td className="text-mono">{a.despatch_number}</td>
                                    <td className="text-mono text-muted">{a.customer_code}</td>
                                    <td className="sku-desc">{a.customer_name}</td>
                                    <td className="text-center font-medium">{a.packages}</td>
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
        <div className="modal-overlay">
          <div className="modal-card animate-scale-in" style={{ maxWidth: '450px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent)' }}>
                {locale === 'pt' ? 'Editar Envio Consolidado' : 'Editar Envío Consolidado'} #{editingShipment.id}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#666' }}>✕</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.35rem' }}>
                  {t('carrierLabel')}
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%', height: '36px', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={editCarrier}
                  onChange={(e) => setEditCarrier(e.target.value)}
                  placeholder={t('carrierPlaceholder')}
                />
              </div>
              
              <div className="input-group">
                <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.35rem' }}>
                  {t('notesLabel')}
                </label>
                <textarea
                  className="form-control"
                  style={{ width: '100%', minHeight: '80px', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                />
              </div>
            </div>
            
            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="btn btn-secondary"
                disabled={isSaving}
              >
                {t('cancelBtn')}
              </button>
              <button 
                onClick={handleSaveEdit} 
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                disabled={isSaving}
              >
                {isSaving ? (locale === 'pt' ? 'Salvando...' : 'Guardando...') : (locale === 'pt' ? 'Salvar Alterações' : 'Guardar Cambios')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .shipments-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .shipments-action-bar {
          display: flex;
          justify-content: flex-end;
        }

        .shipments-table-container {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }

        .row-expanded {
          background-color: #f8fafc;
        }

        .row-cancelled {
          background-color: #fef2f2;
          opacity: 0.65;
        }

        .pkg-more-badge {
          font-size: 0.6rem;
          font-weight: 700;
          background-color: var(--primary-light);
          color: var(--primary);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          margin-left: 0.5rem;
        }

        .orders-count-badge {
          background-color: #f1f5f9;
          border: 1px solid var(--border-color);
          padding: 0.15rem 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 4px;
          color: var(--text-main);
        }

        .btn-action-text.delete {
          color: var(--danger);
        }

        .btn-action-text.delete:hover {
          color: #dc2626;
        }

        .expanded-card-header {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 0.5rem;
        }

        .expanded-card-header h4 {
          border-bottom: none !important;
          padding-bottom: 0 !important;
          margin-bottom: 0 !important;
        }

        .shipment-notes-p {
          font-size: 0.75rem;
          color: var(--text-muted);
          background-color: #f8fafc;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          border-left: 3px solid var(--primary);
        }
      `}} />
    </div>
  );
};

export default Shipments;
