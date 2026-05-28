import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PickingAuditHistory = () => {
  const { t, locale } = useTranslation();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAuditId, setExpandedAuditId] = useState(null);
  
  // Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consolidación
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentCarrier, setShipmentCarrier] = useState('');
  const [shipmentNote, setShipmentNote] = useState('');
  const [creatingShipment, setCreatingShipment] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const res = await fetch('/api/views/view_picking_audits', {
        headers: {
          'Accept-Language': locale
        }
      });
      if (!res.ok) throw new Error('Error al cargar historial.');
      const data = await res.json();
      setAudits(data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedAuditId(expandedAuditId === id ? null : id);
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
    } catch {
      return dateString;
    }
  };

  // --- Lógica de Edición en Caliente ---

  const handleEditClick = async (audit) => {
    try {
      const res = await fetch(`/api/picking_audit/${audit.id}`, {
        headers: {
          'Accept-Language': locale
        }
      });
      if (!res.ok) throw new Error("No se pudo cargar el detalle de la auditoría.");
      const data = await res.json();
      setEditingAudit(data);
      setIsEditModalOpen(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePkgQtyChange = (itemIdx, pkgNum, val) => {
    const qty = Math.max(0, parseInt(val) || 0);
    const updated = { ...editingAudit };
    const item = updated.items[itemIdx];
    const key = `${item.item_code}:${item.order_line || ''}`;

    if (!updated.packages_assignment) updated.packages_assignment = {};
    if (!updated.packages_assignment[key]) updated.packages_assignment[key] = {};

    updated.packages_assignment[key][pkgNum] = qty;
    
    // Recalcular total escaneado para el artículo
    item.qty_scan = Object.values(updated.packages_assignment[key]).reduce((a, b) => a + b, 0);
    setEditingAudit(updated);
  };

  const handleAddPackage = () => {
    setEditingAudit(prev => ({
      ...prev,
      packages: (prev.packages || 0) + 1
    }));
  };

  const handleRemovePackage = () => {
    if (editingAudit.packages <= 1) return;
    const lastPkg = editingAudit.packages.toString();
    
    // Validar si tiene ítems
    let hasItems = false;
    if (editingAudit.packages_assignment) {
      Object.values(editingAudit.packages_assignment).forEach(pkgs => {
        if (pkgs[lastPkg] > 0) hasItems = true;
      });
    }

    if (hasItems) {
      toast.warning("El bulto contiene artículos. Distribúyelos antes de eliminarlo.");
      return;
    }

    setEditingAudit(prev => ({
      ...prev,
      packages: Math.max(1, prev.packages - 1)
    }));
  };

  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        order_number: editingAudit.order_number,
        despatch_number: editingAudit.despatch_number,
        customer_code: editingAudit.customer_code || '',
        customer_name: editingAudit.customer_name || 'N/A',
        status: editingAudit.status,
        username: localStorage.getItem('auditor_name') || 'Auditor',
        items: editingAudit.items.map(i => ({
          code: i.item_code,
          description: i.description,
          order_line: i.order_line || '',
          qty_req: i.qty_req,
          qty_scan: i.qty_scan
        })),
        packages: editingAudit.packages,
        packages_assignment: editingAudit.packages_assignment,
        packages_dimensions: editingAudit.packages_dimensions
      };

      const res = await fetch(`/api/update_picking_audit/${editingAudit.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept-Language': locale
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al actualizar');
      }

      const data = await res.json();
      toast.success(data.message || "Auditoría modificada correctamente.");
      setIsEditModalOpen(false);
      fetchAudits();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Lógica de Selección y Consolidación ---

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreateShipment = async () => {
    if (selectedIds.size === 0) return;
    setCreatingShipment(true);
    try {
      const auditorName = localStorage.getItem('auditor_name') || 'Auditor';
      const res = await fetch('/api/shipments/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept-Language': locale
        },
        body: JSON.stringify({
          audit_ids: [...selectedIds],
          carrier: shipmentCarrier.trim() || 'No asignada',
          note: shipmentNote.trim() || '',
          username: auditorName
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al crear envío consolidado.');
      }

      const data = await res.json();
      toast.success(data.message || "Consolidado creado con éxito.");
      setShowShipmentModal(false);
      setSelectedIds(new Set());
      setShipmentCarrier('');
      setShipmentNote('');
      navigate('/shipments');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreatingShipment(false);
    }
  };

  return (
    <div className="history-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
        </div>
      ) : audits.length === 0 ? (
        <div className="card text-center py-20" style={{ borderStyle: 'dashed' }}>
          <h3 style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>{t('emptyHistoryTitle')}</h3>
          <p>{t('emptyHistoryDesc')}</p>
        </div>
      ) : (
        <div className="table-container history-table-container">
          <table>
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="text-center" style={{ width: '50px' }}>{t('tableHeaderShipment')}</th>
                <th style={{ width: '40px' }}></th>
                <th>{t('tableHeaderId')}</th>
                <th>{t('tableHeaderOrder')}</th>
                <th>{t('tableHeaderDespatch')}</th>
                <th>{t('tableHeaderCustomer')}</th>
                <th>{t('tableHeaderAuditor')}</th>
                <th>{t('tableHeaderDate')}</th>
                <th className="text-center">{t('tableHeaderStatus')}</th>
                <th className="text-center">{t('tableHeaderActions')}</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => {
                const isSelected = selectedIds.has(audit.id);
                const isExpanded = expandedAuditId === audit.id;

                return (
                  <React.Fragment key={audit.id}>
                    <tr 
                      className={`hoverable cursor-pointer ${isExpanded ? 'row-expanded' : ''} ${isSelected ? 'row-selected' : ''}`}
                      onClick={() => toggleExpand(audit.id)}
                    >
                      <td className="text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(audit.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td className="text-center">
                        <span className="expand-arrow">{isExpanded ? '▼' : '▶'}</span>
                      </td>
                      <td className="text-mono">#{audit.id}</td>
                      <td><strong>{audit.order_number}</strong></td>
                      <td className="text-mono">{audit.despatch_number}</td>
                      <td className="truncate-cell" style={{ maxWidth: '200px' }}>
                        <span className="text-muted">[{audit.customer_code}]</span> {audit.customer_name}
                      </td>
                      <td className="profile-cell">{audit.username}</td>
                      <td className="text-mono text-xs text-muted">{formatDate(audit.timestamp)}</td>
                      <td className="text-center">
                        <span className={`badge ${
                          audit.status === 'Completo' || audit.status === 'Completado' 
                          ? 'badge-success' : 'badge-warning'
                        }`}>
                          {audit.status}
                        </span>
                      </td>
                      <td className="text-center" onClick={e => e.stopPropagation()}>
                        <div className="action-buttons">
                          {isToday(audit.timestamp) && (
                            <button 
                              onClick={() => handleEditClick(audit)}
                              className="btn-action-text edit"
                              title="Modificar auditoría"
                            >
                              {t('btnEdit')}
                            </button>
                          )}
                          <Link 
                            to={`/packing_list/print/${audit.id}`}
                            className="btn-action-text print"
                            title="Ver e Imprimir Packing List"
                          >
                            {t('btnPrint')}
                          </Link>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="expanded-detail-row">
                        <td colSpan="10" className="expanded-detail-cell">
                          <div className="expanded-card">
                            <h4>{t('expandedDetailTitle')}</h4>
                            <table>
                              <thead>
                                <tr>
                                  <th style={{ width: '60px' }}>{t('tableHeaderLine')}</th>
                                  <th>{t('tableHeaderItem')}</th>
                                  <th>{t('tableHeaderDesc')}</th>
                                  <th className="text-center" style={{ width: '80px' }}>{t('tableHeaderReq')}</th>
                                  <th className="text-center" style={{ width: '80px' }}>{t('tableHeaderScan')}</th>
                                  <th className="text-center" style={{ width: '80px' }}>{t('tableHeaderDiff')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {audit.items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="text-mono text-muted">{item.order_line}</td>
                                    <td className="sku-code">{item.item_code}</td>
                                    <td className="sku-desc">{item.description}</td>
                                    <td className="text-center text-mono">{item.qty_req}</td>
                                    <td className="text-center text-mono font-medium">{item.qty_scan}</td>
                                    <td className={`text-center text-mono font-medium ${
                                      item.difference === 0 ? 'text-success' : 'text-danger'
                                    }`}>
                                      {item.difference > 0 ? `+${item.difference}` : item.difference}
                                    </td>
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

      {/* Barra Inferior Flotante de Selección */}
      {selectedIds.size > 0 && (
        <div className="fixed-selection-bar">
          <span className="selection-count">{selectedIds.size} {t('tableHeaderShipment').toLowerCase()}s</span>
          <button 
            onClick={() => setShowShipmentModal(true)} 
            className="btn btn-primary btn-consolidate"
          >
            🚚 {t('consolidateBtn')}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="btn-cancel-selection">
            ✕ {locale === 'pt' ? 'Limpar' : 'Limpiar'}
          </button>
        </div>
      )}

      {/* Modal de Creación de Consolidado */}
      {showShipmentModal && (
        <div className="modal-overlay">
          <div className="modal-content shipment-create-modal">
            <div className="modal-header">
              <h3>{t('consolidateModalTitle')}</h3>
              <button onClick={() => setShowShipmentModal(false)} className="close-btn">✕</button>
            </div>
            <div className="modal-body">
              <p className="shipment-modal-desc">{t('consolidateModalDesc')}</p>
              
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">{t('carrierLabel')}</label>
                <input
                  type="text"
                  value={shipmentCarrier}
                  onChange={(e) => setShipmentCarrier(e.target.value)}
                  placeholder={t('carrierPlaceholder')}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">{t('notesLabel')}</label>
                <textarea
                  value={shipmentNote}
                  onChange={(e) => setShipmentNote(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowShipmentModal(false)} className="btn btn-secondary">
                  {t('cancelBtn')}
                </button>
                <button 
                  onClick={handleCreateShipment} 
                  className="btn btn-primary"
                  disabled={creatingShipment}
                >
                  {creatingShipment ? t('consolidatingModalBtn') : t('consolidateModalBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Auditoría */}
      {isEditModalOpen && editingAudit && (
        <div className="modal-overlay">
          <div className="modal-content edit-audit-modal">
            <div className="modal-header">
              <h3>📦 {t('editModalTitle')} #{editingAudit.id}</h3>
              <div className="modal-header-controls">
                <div className="pkg-edit-controls">
                  <span className="pkg-lbl">{t('assignTableHeaderPkg')}s: <strong>{editingAudit.packages}</strong></span>
                  <div className="pkg-pm-btns">
                    <button onClick={handleRemovePackage} className="pm-btn">−</button>
                    <button onClick={handleAddPackage} className="pm-btn">+</button>
                  </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="close-btn">✕</button>
              </div>
            </div>
            <div className="modal-body">
              <div className="audit-edit-meta">
                <span>{t('orderLabel')}: <strong>{editingAudit.order_number}</strong></span>
                <span>{t('customerLabel')}: <strong>{editingAudit.customer_name}</strong></span>
              </div>

              <div className="edit-table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>{t('tableHeaderLine')}</th>
                      <th>{t('tableHeaderItem')}</th>
                      <th className="text-center" style={{ width: '80px' }}>{t('tableHeaderReq')}</th>
                      <th className="text-left">{t('assignModalDesc')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingAudit.items.map((item, idx) => {
                      const itemKey = `${item.item_code}:${item.order_line || ''}`;
                      const assignments = editingAudit.packages_assignment?.[itemKey] || {};

                      return (
                        <tr key={idx}>
                          <td className="text-mono text-muted">{item.order_line}</td>
                          <td>
                            <strong>{item.item_code}</strong>
                            <div className="text-xs text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>{item.description}</div>
                          </td>
                          <td className="text-center text-mono font-medium">{item.qty_req}</td>
                          <td>
                            <div className="pkg-edit-grid">
                              {Array.from({ length: editingAudit.packages }).map((_, i) => (
                                <div key={i} className="pkg-edit-input-group">
                                  <span className="pkg-num-lbl">B{i + 1}</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={assignments[i + 1] || 0}
                                    onChange={(e) => handlePkgQtyChange(idx, i + 1, e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                  />
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="modal-actions">
                <button onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
                  {t('cancelBtn')}
                </button>
                <button 
                  onClick={handleSaveEdit} 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('editModalSaving') : t('editModalSave')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .history-container {
          display: flex;
          flex-direction: column;
        }

        .history-table-container {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: visible;
        }

        .row-expanded {
          background-color: #f8fafc;
        }

        .row-selected {
          background-color: #eff6ff !important;
        }

        .expand-arrow {
          font-size: 0.75rem;
          color: var(--text-muted);
          transition: var(--transition-fast);
        }

        .profile-cell {
          text-transform: capitalize;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .btn-action-text {
          background: transparent;
          border: none;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .btn-action-text.edit {
          color: var(--text-muted);
        }

        .btn-action-text.edit:hover {
          color: var(--primary);
        }

        .btn-action-text.print {
          color: var(--primary);
        }

        .btn-action-text.print:hover {
          color: var(--primary-hover);
        }

        /* Detalle Expandido */
        .expanded-detail-row {
          background-color: #f8fafc;
        }

        .expanded-detail-cell {
          padding: 1.5rem 3rem !important;
          border-bottom: 1.5px solid var(--border-color) !important;
        }

        .expanded-card {
          background-color: white;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 1.25rem;
          box-shadow: var(--shadow-sm);
        }

        .expanded-card h4 {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 0.5rem;
        }

        .expanded-card table {
          font-size: 0.8rem;
        }

        .expanded-card th {
          padding: 0.5rem 0.75rem;
        }

        .expanded-card td {
          padding: 0.5rem 0.75rem;
        }

        /* Barra de Selección Fija Inferior */
        .fixed-selection-bar {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background-color: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 0.75rem 2rem;
          border-radius: var(--radius-full);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
          z-index: 99;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          animation: bar-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes bar-enter {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .selection-count {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }

        .btn-consolidate {
          background-color: white;
          color: #0f172a;
          height: 34px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .btn-consolidate:hover {
          background-color: #f1f5f9;
        }

        .btn-cancel-selection {
          background: transparent;
          border: none;
          color: #f87171;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .btn-cancel-selection:hover {
          color: #ef4444;
        }

        /* ESTILOS DE MODAL EDICIÓN */
        .edit-audit-modal {
          max-width: 800px;
        }

        .modal-header-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .pkg-edit-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #f1f5f9;
          border: 1px solid var(--border-color);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .pkg-lbl {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .pkg-pm-btns {
          display: flex;
          gap: 0.25rem;
        }

        .pm-btn {
          width: 22px;
          height: 22px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          background-color: white;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pm-btn:hover {
          background-color: #f8fafc;
        }

        .audit-edit-meta {
          display: flex;
          gap: 1.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.5rem;
        }

        .edit-table-container {
          max-height: 360px;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          margin-bottom: 1.5rem;
        }

        .pkg-edit-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .pkg-edit-input-group {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          overflow: hidden;
          background-color: #f8fafc;
          height: 28px;
        }

        .pkg-num-lbl {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-muted);
          padding: 0 0.4rem;
        }

        .pkg-edit-input-group input {
          width: 38px;
          height: 26px !important;
          border: none !important;
          border-left: 1px solid var(--border-color) !important;
          border-radius: 0 !important;
          text-align: center;
          font-size: 0.8rem !important;
          font-weight: 600 !important;
          padding: 0 !important;
        }
      `}} />
    </div>
  );
};

export default PickingAuditHistory;
