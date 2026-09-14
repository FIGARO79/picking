import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from '../components/Spinner';
import '../styles/FluentPages.css';

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
  const [exporting, setExporting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/views/view_picking_audits', {
        headers: { 'Accept-Language': locale }
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

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export/picking_audits', {
        headers: { 'Accept-Language': locale }
      });
      if (!res.ok) throw new Error('Error al exportar a Excel.');
      
      const blob = await res.blob();
      let filename = `reporte_historico_picking_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const disposition = res.headers.get('content-disposition');
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(locale === 'pt' ? 'Exportado com sucesso!' : '¡Exportado con éxito!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
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

  // --- Edición en Caliente ---
  const handleEditClick = async (audit) => {
    try {
      const res = await fetch(`/api/picking_audit/${audit.id}`, {
        headers: { 'Accept-Language': locale }
      });
      if (!res.ok) throw new Error("No se pudo cargar el detalle.");
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
        status: editingAudit.status || 'Completo',
        username: localStorage.getItem('auditor_name') || 'Auditor',
        items: editingAudit.items.map(i => ({
          code: i.item_code,
          description: i.description,
          order_line: i.order_line || '',
          qty_req: i.qty_req,
          qty_scan: i.qty_scan,
          item_weight: i.item_weight || 0
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
    <div className="picking-audit-history-page space-y-4 max-w-[1400px] mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-white p-3 rounded border border-[#d2d0ce] shadow-xs">
        <div>
          <span className="text-sm md:text-base font-bold uppercase tracking-wider text-[#111827]">
            {t('menuHistory')}
          </span>
          <span className="text-sm text-[#374151] ml-2 font-medium">
            ({audits.length} registros)
          </span>
        </div>

        <button 
          onClick={handleExportExcel} 
          disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded border border-[#0e620e] bg-white px-3.5 py-1.5 text-xs md:text-sm font-semibold text-[#0e620e] hover:bg-[#dcfce7] transition-colors cursor-pointer"
        >
          {exporting ? t('editModalSaving') : t('exportExcelBtn')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded border border-[#c8c6c4]">
          <Spinner size="lg" label="Cargando historial de auditorías..." />
        </div>
      ) : audits.length === 0 ? (
        <div className="bg-white rounded border border-[#c8c6c4] p-12 text-center shadow-xs">
          <h3 className="text-sm font-bold uppercase text-[#374151] mb-1">{t('emptyHistoryTitle')}</h3>
          <p className="text-sm text-[#374151]">{t('emptyHistoryDesc')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded border border-[#c8c6c4] shadow-xs">
          <table className="w-full text-left sap-table">
            <thead>
              <tr>
                <th className="text-center w-10"></th>
                <th className="text-center w-8"></th>
                <th className="text-center w-16">{t('tableHeaderId')}</th>
                <th>{t('tableHeaderOrder')}</th>
                <th className="text-center w-16">{t('tableHeaderDespatch')}</th>
                <th>{t('tableHeaderCustomer')}</th>
                <th>{t('tableHeaderAuditor')}</th>
                <th className="text-center">{t('tableHeaderDate')}</th>
                <th className="text-center w-28">{t('tableHeaderNetWeight')}</th>
                <th className="text-center w-28">{t('tableHeaderGrossWeight')}</th>
                <th className="text-center w-28">{t('tableHeaderStatus')}</th>
                <th className="text-center w-28">{t('tableHeaderActions')}</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => {
                const isSelected = selectedIds.has(audit.id);
                const isExpanded = expandedAuditId === audit.id;

                return (
                  <React.Fragment key={audit.id}>
                    <tr 
                      className={`hover:bg-[#f3f9fd] cursor-pointer ${isExpanded ? 'bg-[#eff6fc]' : ''} ${isSelected ? 'bg-[#eff6fc]/60' : ''}`}
                      onClick={() => toggleExpand(audit.id)}
                    >
                      <td className="text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(audit.id)}
                          className="rounded border-[#605e5c] cursor-pointer w-4 h-4"
                        />
                      </td>
                      <td className="text-center text-xs text-[#374151] font-bold">
                        {isExpanded ? '▼' : '▶'}
                      </td>
                      <td className="text-center font-mono text-sm font-semibold text-[#374151]">#{audit.id}</td>
                      <td><span className="font-mono font-bold text-[#111827] text-sm">{audit.order_number}</span></td>
                      <td className="text-center font-mono text-sm text-[#374151]">{audit.despatch_number}</td>
                      <td className="text-sm truncate max-w-xs text-[#111827]" title={`${audit.customer_code} - ${audit.customer_name}`}>
                        <span className="text-[#374151] font-semibold">[{audit.customer_code}]</span> {audit.customer_name}
                      </td>
                      <td className="text-sm text-[#111827]">{audit.username}</td>
                      <td className="text-center font-mono text-sm text-[#374151]">{formatDate(audit.timestamp)}</td>
                      <td className="text-center font-mono text-sm font-bold text-[#111827]">
                        <div>{(audit.net_weight || 0).toFixed(3)} kg</div>
                        <div className="text-[11px] font-normal text-[#374151]">
                          Req: {(audit.req_weight || 0).toFixed(3)} kg
                        </div>
                      </td>
                      <td className="text-center font-mono text-sm font-bold text-[#0078d4]">
                        {(audit.gross_weight || 0).toFixed(3)} kg
                      </td>
                      <td className="text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                          audit.status === 'Completo' || audit.status === 'Completado' 
                            ? 'bg-[#dcfce7] text-[#0e620e]' 
                            : 'bg-[#fef3c7] text-[#8a3b07]'
                        }`}>
                          {audit.status}
                        </span>
                      </td>
                      <td className="text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2.5 text-sm">
                          {isToday(audit.timestamp) && (
                            <button 
                              onClick={() => handleEditClick(audit)}
                              className="text-[#0078d4] hover:underline font-semibold cursor-pointer"
                            >
                              {t('btnEdit')}
                            </button>
                          )}
                          <Link 
                            to={`/packing_list/print/${audit.id}`}
                            className="text-[#0078d4] hover:underline font-semibold"
                          >
                            {t('btnPrint')}
                          </Link>
                        </div>
                      </td>
                    </tr>

                    {/* Fila Detalle Expandida */}
                    {isExpanded && (
                      <tr className="bg-[#fafafa]">
                        <td colSpan="12" className="p-4 border-b border-[#c8c6c4]">
                          <div className="bg-white rounded border border-[#c8c6c4] p-5 shadow-xs space-y-4">
                            {/* Panel Superior: Tarjetas de Resumen de Pesos y Medidas */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                              {/* Tarjeta 1: Pesos de la Auditoría */}
                              <div className="lg:col-span-6 bg-[#f9f9f9] rounded border border-[#c8c6c4] p-4">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3 flex items-center gap-1.5">
                                  ⚖️ Resumen de Pesos
                                </h5>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="bg-white p-2.5 rounded border border-[#c8c6c4]">
                                    <div className="text-xs font-medium text-[#374151] uppercase mb-1">{t('grossWeightTitle')}</div>
                                    <div className="font-mono text-base font-bold text-[#0078d4]">
                                      {(audit.gross_weight || 0).toFixed(3)} kg
                                    </div>
                                    <div className="text-[10px] text-[#4b5563]">Báscula operador</div>
                                  </div>

                                  <div className="bg-white p-2.5 rounded border border-[#c8c6c4]">
                                    <div className="text-xs font-medium text-[#374151] uppercase mb-1">{t('netWeightTitle')}</div>
                                    <div className="font-mono text-base font-bold text-[#0e620e]">
                                      {(audit.net_weight || 0).toFixed(3)} kg
                                    </div>
                                    <div className="text-[10px] text-[#4b5563]">∑ unit. × escaneados</div>
                                  </div>

                                  <div className="bg-white p-2.5 rounded border border-[#c8c6c4]">
                                    <div className="text-xs font-medium text-[#374151] uppercase mb-1">{t('reqWeightTitle')}</div>
                                    <div className="font-mono text-base font-bold text-[#111827]">
                                      {(audit.req_weight || 0).toFixed(3)} kg
                                    </div>
                                    <div className="text-[10px] text-[#4b5563]">∑ unit. × requeridos</div>
                                  </div>
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-[#edebe9] text-xs flex justify-between items-center px-1 text-[#374151]">
                                  <span>{t('weightDifferenceTitle')} (Bruto - Neto):</span>
                                  <strong className="font-mono text-sm text-[#111827]">
                                    {((audit.gross_weight || 0) - (audit.net_weight || 0)).toFixed(3)} kg
                                  </strong>
                                </div>
                              </div>

                              {/* Tarjeta 2: Medidas y Dimensiones de Bultos */}
                              <div className="lg:col-span-6 bg-[#f9f9f9] rounded border border-[#c8c6c4] p-4">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3 flex items-center justify-between">
                                  <span>📦 {t('packageDimensionsTitle')}</span>
                                  <span className="text-xs font-semibold text-[#0078d4] bg-[#eff6fc] px-2 py-0.5 rounded border border-[#c8c6c4]">
                                    Total: {audit.packages || audit.packages_dimensions?.length || 1} Bulto(s)
                                  </span>
                                </h5>

                                {audit.packages_dimensions && audit.packages_dimensions.length > 0 ? (
                                  <div className="overflow-x-auto border border-[#c8c6c4] rounded bg-white">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="bg-[#f3f4f6] text-[#111827] border-b border-[#c8c6c4]">
                                          <th className="p-2 text-center font-bold">{t('assignTableHeaderPkg')}</th>
                                          <th className="p-2 text-center font-bold">Largo</th>
                                          <th className="p-2 text-center font-bold">Ancho</th>
                                          <th className="p-2 text-center font-bold">Alto</th>
                                          <th className="p-2 text-center font-bold">Volumen</th>
                                          <th className="p-2 text-center font-bold text-[#0078d4]">{t('tableHeaderGrossWeight')}</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {audit.packages_dimensions.map((dim, dIdx) => (
                                          <tr key={dIdx} className="border-b border-[#edebe9] text-center font-mono hover:bg-[#f9f9f9]">
                                            <td className="p-2 font-bold text-[#111827]">Bulto {dim.package_number}</td>
                                            <td className="p-2 text-[#374151]">{dim.length || 0} cm</td>
                                            <td className="p-2 text-[#374151]">{dim.width || 0} cm</td>
                                            <td className="p-2 text-[#374151]">{dim.height || 0} cm</td>
                                            <td className="p-2 text-[#374151]">
                                              {(((dim.length || 0) * (dim.width || 0) * (dim.height || 0)) / 1000).toFixed(1)} dm³
                                            </td>
                                            <td className="p-2 font-bold text-[#0078d4]">{(dim.weight || 0).toFixed(3)} kg</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="bg-white p-3 rounded border border-[#c8c6c4] text-xs text-[#374151] text-center">
                                    {t('noDimensionsRecorded')}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Tabla de Artículos Auditados */}
                            <div>
                              <h4 className="text-sm font-bold uppercase tracking-wider text-[#111827] mb-2.5">
                                {t('expandedDetailTitle')}
                              </h4>
                              <div className="overflow-x-auto border border-[#c8c6c4] rounded">
                                <table className="w-full text-left sap-table">
                                  <thead>
                                    <tr>
                                      <th className="w-14 text-center">{t('tableHeaderLine')}</th>
                                      <th>{t('tableHeaderItem')}</th>
                                      <th>{t('tableHeaderDesc')}</th>
                                      <th className="text-center w-16">{t('tableHeaderReq')}</th>
                                      <th className="text-center w-16">{t('tableHeaderScan')}</th>
                                      <th className="text-center w-16">{t('tableHeaderDiff')}</th>
                                      <th className="text-center w-24">{t('tableHeaderUnitWeight')}</th>
                                      <th className="text-center w-28">{t('tableHeaderNetWeight')}</th>
                                      <th className="text-center w-28">{t('tableHeaderReqWeight')}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {audit.items.map((item, idx) => {
                                      const itemWeight = item.item_weight || 0;
                                      const netLine = item.line_weight !== undefined ? item.line_weight : (itemWeight * (item.qty_scan || 0));
                                      const reqLine = item.req_line_weight !== undefined ? item.req_line_weight : (itemWeight * (item.qty_req || 0));

                                      return (
                                        <tr key={idx} className="hover:bg-[#f3f9fd]">
                                          <td className="text-center font-mono text-sm font-medium text-[#374151]">{item.order_line}</td>
                                          <td className="font-mono font-bold text-[#111827] text-sm">{item.item_code}</td>
                                          <td className="text-sm text-[#111827] max-w-xs truncate" title={item.description}>{item.description}</td>
                                          <td className="text-center font-mono text-sm font-bold text-[#111827]">{item.qty_req}</td>
                                          <td className="text-center font-mono text-sm font-bold text-[#111827]">{item.qty_scan}</td>
                                          <td className={`text-center font-mono text-sm font-bold ${
                                            item.difference === 0 ? 'text-[#0e620e]' : 'text-[#8a1f24]'
                                          }`}>
                                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                                          </td>
                                          <td className="text-center font-mono text-sm text-[#374151]">
                                            {itemWeight.toFixed(3)} kg
                                          </td>
                                          <td className="text-center font-mono text-sm font-bold text-[#0e620e]">
                                            {netLine.toFixed(3)} kg
                                          </td>
                                          <td className="text-center font-mono text-sm font-bold text-[#111827]">
                                            {reqLine.toFixed(3)} kg
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-[#f3f4f6] font-bold border-t-2 border-[#c8c6c4]">
                                      <td colSpan="3" className="text-right text-xs uppercase text-[#374151] px-4 py-2.5 font-bold">
                                        {t('tableHeaderTotal') || 'TOTALES'}:
                                      </td>
                                      <td className="text-center font-mono text-sm text-[#111827]">
                                        {audit.total_qty_req || audit.items.reduce((sum, i) => sum + (i.qty_req || 0), 0)}
                                      </td>
                                      <td className="text-center font-mono text-sm text-[#111827]">
                                        {audit.total_qty_scan || audit.items.reduce((sum, i) => sum + (i.qty_scan || 0), 0)}
                                      </td>
                                      <td className="text-center font-mono text-sm text-[#111827]">
                                        {audit.total_difference || audit.items.reduce((sum, i) => sum + ((i.qty_scan || 0) - (i.qty_req || 0)), 0)}
                                      </td>
                                      <td className="text-center text-xs text-[#6b7280] font-normal">-</td>
                                      <td className="text-center font-mono text-sm text-[#0e620e] font-bold">
                                        {(audit.net_weight || 0).toFixed(3)} kg
                                      </td>
                                      <td className="text-center font-mono text-sm text-[#111827] font-bold">
                                        {(audit.req_weight || 0).toFixed(3)} kg
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
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
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-[#c8c6c4] shadow-xl rounded-full px-6 py-2.5 flex items-center gap-4 z-50 animate-fade-in">
          <span className="text-sm font-bold text-[#111827]">
            {selectedIds.size} {t('tableHeaderShipment').toLowerCase()}s seleccionados
          </span>
          <button 
            onClick={() => setShowShipmentModal(true)} 
            className="rounded bg-[#0078d4] px-4 py-1.5 text-xs md:text-sm font-bold uppercase text-white hover:bg-[#106ebe] transition-colors cursor-pointer shadow-xs"
          >
            {t('consolidateBtn')}
          </button>
          <button 
            onClick={() => setSelectedIds(new Set())} 
            className="text-xs md:text-sm text-[#374151] hover:text-[#111827] font-semibold cursor-pointer"
          >
            {locale === 'pt' ? 'Limpar' : 'Limpiar'}
          </button>
        </div>
      )}

      {/* Modal de Consolidado */}
      {showShipmentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d2d0ce] shadow-xl p-6 w-full max-w-md border-t-4 border-t-[#0078d4]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold uppercase text-[#201f1e]">
                {t('consolidateModalTitle')}
              </h3>
              <button onClick={() => setShowShipmentModal(false)} className="text-sm font-bold text-[#605e5c] cursor-pointer">✕</button>
            </div>
            <p className="text-xs text-[#605e5c] mb-4">
              {t('consolidateModalDesc')}
            </p>
            
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#201f1e] mb-1">
                  {t('carrierLabel')}
                </label>
                <input
                  type="text"
                  value={shipmentCarrier}
                  onChange={(e) => setShipmentCarrier(e.target.value)}
                  placeholder={t('carrierPlaceholder')}
                  required
                  className="w-full rounded border border-[#8a8886] p-2 text-xs font-normal text-[#201f1e] outline-none focus:border-[#0078d4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#201f1e] mb-1">
                  {t('notesLabel')}
                </label>
                <textarea
                  value={shipmentNote}
                  onChange={(e) => setShipmentNote(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  rows={3}
                  className="w-full rounded border border-[#8a8886] p-2 text-xs font-normal text-[#201f1e] outline-none focus:border-[#0078d4]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowShipmentModal(false)} 
                className="rounded border border-[#d2d0ce] px-3 py-1.5 text-xs text-[#605e5c] hover:bg-[#f3f3f3] cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button 
                onClick={handleCreateShipment} 
                disabled={creatingShipment}
                className="rounded bg-[#0078d4] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#106ebe] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {creatingShipment ? t('consolidatingModalBtn') : t('consolidateModalBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Auditoría */}
      {isEditModalOpen && editingAudit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d2d0ce] shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border-t-4 border-t-[#0078d4]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold uppercase text-[#201f1e]">
                {t('editModalTitle')} #{editingAudit.id}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#605e5c]">{t('assignTableHeaderPkg')}s: <strong>{editingAudit.packages}</strong></span>
                  <button onClick={handleRemovePackage} className="w-6 h-6 rounded border border-[#d2d0ce] flex items-center justify-center font-bold hover:bg-[#fde7e9] text-[#a4262c] cursor-pointer">−</button>
                  <button onClick={handleAddPackage} className="w-6 h-6 rounded border border-[#0078d4] flex items-center justify-center font-bold hover:bg-[#eff6fc] text-[#0078d4] cursor-pointer">+</button>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-sm font-bold text-[#605e5c] cursor-pointer">✕</button>
              </div>
            </div>

            <div className="bg-[#f9f9f9] border border-[#d2d0ce] p-2.5 rounded mb-4 text-xs flex gap-4 text-[#605e5c]">
              <span>{t('orderLabel')}: <strong className="font-mono text-[#0078d4]">{editingAudit.order_number}</strong></span>
              <span>{t('customerLabel')}: <strong className="text-[#201f1e]">{editingAudit.customer_name}</strong></span>
            </div>

            <div className="overflow-x-auto border border-[#d2d0ce] rounded mb-4">
              <table className="w-full text-xs sap-table">
                <thead>
                  <tr>
                    <th className="w-14 text-center">{t('tableHeaderLine')}</th>
                    <th>{t('tableHeaderItem')}</th>
                    <th className="text-center w-16">{t('tableHeaderReq')}</th>
                    <th>{t('assignModalDesc')}</th>
                  </tr>
                </thead>
                <tbody>
                  {editingAudit.items.map((item, idx) => {
                    const itemKey = `${item.item_code}:${item.order_line || ''}`;
                    const assignments = editingAudit.packages_assignment?.[itemKey] || {};

                    return (
                      <tr key={idx} className="hover:bg-[#f3f9fd]">
                        <td className="text-center font-mono text-[#605e5c]">{item.order_line}</td>
                        <td>
                          <span className="font-mono font-medium text-[#201f1e]">{item.item_code}</span>
                          <div className="text-[11px] text-[#605e5c] truncate max-w-xs">{item.description}</div>
                        </td>
                        <td className="text-center font-mono font-semibold">{item.qty_req}</td>
                        <td>
                          <div className="flex gap-1.5 flex-wrap py-1">
                            {Array.from({ length: editingAudit.packages }).map((_, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <span className="text-[10px] text-[#605e5c]">B{i + 1}:</span>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-12 text-center rounded border border-[#8a8886] py-0.5 text-xs font-mono"
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

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="rounded border border-[#d2d0ce] px-3 py-1.5 text-xs text-[#605e5c] hover:bg-[#f3f3f3] cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button 
                onClick={handleSaveEdit} 
                disabled={isSubmitting}
                className="rounded bg-[#0078d4] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#106ebe] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSubmitting ? t('editModalSaving') : t('editModalSave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickingAuditHistory;
