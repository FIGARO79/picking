import React, { useState, useEffect, useRef, useMemo } from 'react';
import ScannerModal from '../components/ScannerModal';
import DimensionScanner from '../components/DimensionScanner';
import { useTranslation } from '../context/LanguageContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/FluentPages.css';

// Efectos de sonido utilizando Web Audio API nativo
const playBeep = (freq, duration) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = freq;
    osc.type = freq > 600 ? 'sine' : 'square';

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.error("Audio error:", err);
  }
};

const playSuccess = () => playBeep(800, 0.1);
const playError = () => playBeep(220, 0.2);

const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const dateOnly = dateStr.split(' ')[0] || dateStr.split('T')[0];
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthStr = parts[1];
    const day = parseInt(parts[2], 10);
    return `${day}/${monthStr}/${year}`;
  }
  return dateStr;
};

const PickingAudit = () => {
  const { t, locale } = useTranslation();

  // --- Estados de Búsqueda/Carga ---
  const [orderNumber, setOrderNumber] = useState('');
  const [despatchNumber, setDespatchNumber] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [trackingData, setTrackingData] = useState([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState(null);

  // --- Estados de Auditoría en Curso ---
  const [auditActive, setAuditActive] = useState(false);
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [packagesCount, setPackagesCount] = useState('1');
  const [activePackage, setActivePackage] = useState(1);
  const [packageAssignments, setPackageAssignments] = useState({}); // { item_key: { pkg_num: qty } }
  const [packageDimensions, setPackageDimensions] = useState({}); // { pkg_num: { length, width, height, weight } }

  // --- Modales e Inputs ---
  const [itemCodeInput, setItemCodeInput] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [dimensionScannerOpen, setDimensionScannerOpen] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);
  const [tempQty, setTempQty] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [scanError, setScanError] = useState('');
  const scanErrorTimeoutRef = useRef(null);

  useEffect(() => {
    loadTrackingData();
    return () => {
      if (scanErrorTimeoutRef.current) clearTimeout(scanErrorTimeoutRef.current);
    };
  }, []);

  // -- Cálculo de Matriz por Cliente y Fecha (Estilo Logix) --
  const matrixData = useMemo(() => {
    if (!trackingData || trackingData.length === 0) {
      return { dates: [], rows: [], totals: {}, grandTotal: { orders: 0, lines: 0 } };
    }

    const datesSet = new Set();
    trackingData.forEach(tRow => {
      if (!tRow.print_date) return;
      const datePart = tRow.print_date.split(' ')[0] || tRow.print_date.split('T')[0];
      if (datePart) datesSet.add(datePart);
    });
    const sortedDates = Array.from(datesSet).sort();

    const rowsMap = {};
    trackingData.forEach(tRow => {
      if (!tRow.print_date) return;
      const datePart = tRow.print_date.split(' ')[0] || tRow.print_date.split('T')[0];
      if (!datePart) return;

      const custCode = tRow.customer_code || 'N/A';
      const custName = tRow.customer_name || 'Desconocido';
      const custKey = custCode;

      if (!rowsMap[custKey]) {
        rowsMap[custKey] = {
          customerCode: custCode,
          customerName: custName,
          dates: {}
        };
      }

      if (!rowsMap[custKey].dates[datePart]) {
        rowsMap[custKey].dates[datePart] = { orders: 0, lines: 0 };
      }

      rowsMap[custKey].dates[datePart].orders += 1;
      rowsMap[custKey].dates[datePart].lines += (parseInt(tRow.total_lines) || 0);
    });

    const rows = Object.values(rowsMap).map(row => {
      let rowTotalOrders = 0;
      let rowTotalLines = 0;
      Object.values(row.dates).forEach(d => {
        rowTotalOrders += d.orders;
        rowTotalLines += d.lines;
      });
      return {
        ...row,
        totalOrders: rowTotalOrders,
        totalLines: rowTotalLines
      };
    });

    const totals = {};
    sortedDates.forEach(d => {
      totals[d] = { orders: 0, lines: 0 };
    });

    rows.forEach(row => {
      sortedDates.forEach(d => {
        const cellData = row.dates[d] || { orders: 0, lines: 0 };
        totals[d].orders += cellData.orders;
        totals[d].lines += cellData.lines;
      });
    });

    let grandTotalOrders = 0;
    let grandTotalLines = 0;
    rows.forEach(row => {
      grandTotalOrders += row.totalOrders;
      grandTotalLines += row.totalLines;
    });

    return {
      dates: sortedDates,
      rows,
      totals,
      grandTotal: {
        orders: grandTotalOrders,
        lines: grandTotalLines
      }
    };
  }, [trackingData]);

  const toggleCustomerFilter = (custCode) => {
    setSelectedCustomerFilter(prev => prev === custCode ? null : custCode);
  };

  const filteredTracking = useMemo(() => {
    if (!selectedCustomerFilter) return trackingData;
    return trackingData.filter(tRow => tRow.customer_code === selectedCustomerFilter);
  }, [trackingData, selectedCustomerFilter]);

  const loadTrackingData = async () => {
    setLoadingTracking(true);
    try {
      const response = await fetch('/api/picking/tracking', {
        headers: { 'Accept-Language': locale }
      });
      if (response.ok) {
        const data = await response.json();
        setTrackingData(data || []);
      }
    } catch (e) {
      console.error("Error cargando tracking:", e);
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleLoadOrder = async () => {
    if (!orderNumber.trim() || !despatchNumber.trim()) {
      toast.warning("Ingresa el número de orden y despacho.");
      return;
    }

    setLoadingOrder(true);
    try {
      const response = await fetch(`/api/picking/order/${orderNumber.trim()}/${despatchNumber.trim()}`, {
        headers: { 'Accept-Language': locale }
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'No se pudo cargar el pedido.');
      }

      const data = await response.json();
      if (data && data.length > 0) {
        setCustomerCode(data[0]['Customer Code'] || 'N/A');
        setCustomerName(data[0]['Customer Name'] || 'N/A');
        
        const items = data.map(row => {
          const itemWeight = parseFloat(row['Item Weight'] || row['Item_Weight'] || row['item_weight'] || 0) || 0;
          return {
            code: row['Item Code'],
            description: row['Item Description'],
            order_line: row['Order Line'],
            qty_req: parseInt(row['Qty'] || 0),
            qty_scan: 0,
            difference: 0,
            item_weight: itemWeight
          };
        });
        
        setOrderItems(items);

        const initialAssignments = {};
        items.forEach(item => {
          const itemKey = `${item.code}:${item.order_line || ''}`;
          initialAssignments[itemKey] = { 1: 0 };
        });
        setPackageAssignments(initialAssignments);
        setPackagesCount('1');
        setActivePackage(1);
        setPackageDimensions({});
        setAuditActive(true);
        toast.success("Pedido cargado con éxito. ¡Comienza la auditoría!");
      } else {
        toast.error("El pedido no contiene ítems.");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleReset = () => {
    setAuditActive(false);
    setOrderItems([]);
    setOrderNumber('');
    setDespatchNumber('');
    setCustomerCode('');
    setCustomerName('');
    setPackageAssignments({});
    setPackageDimensions({});
    setPackagesCount('1');
    setActivePackage(1);
    setShowAssignmentModal(false);
    loadTrackingData();
  };

  const handleScan = (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    let idx = orderItems.findIndex(i => i.code === cleanCode && i.qty_scan < i.qty_req);
    if (idx === -1) {
      idx = orderItems.findIndex(i => i.code === cleanCode);
    }

    if (idx !== -1) {
      const item = orderItems[idx];
      setScannedItem({ ...item, index: idx });
      setTempQty(1);
      setShowQtyModal(true);
      setItemCodeInput('');
      setScanError('');
      playSuccess();
    } else {
      playError();
      setScanError(`Artículo no encontrado: ${cleanCode}`);
      if (scanErrorTimeoutRef.current) clearTimeout(scanErrorTimeoutRef.current);
      scanErrorTimeoutRef.current = setTimeout(() => setScanError(''), 4000);
      setItemCodeInput('');
    }
  };

  const confirmQuantity = () => {
    if (!scannedItem) return;

    let toAdd = parseInt(tempQty) || 0;
    if (toAdd <= 0) {
      setShowQtyModal(false);
      return;
    }

    const newItems = [...orderItems];
    const packageUpdates = {};
    let remaining = toAdd;

    for (let i = 0; i < newItems.length && remaining > 0; i++) {
      if (newItems[i].code === scannedItem.code && newItems[i].qty_scan < newItems[i].qty_req) {
        const needed = newItems[i].qty_req - newItems[i].qty_scan;
        const add = Math.min(needed, remaining);
        newItems[i].qty_scan += add;
        newItems[i].difference = newItems[i].qty_scan - newItems[i].qty_req;
        remaining -= add;

        const itemKey = `${newItems[i].code}:${newItems[i].order_line || ''}`;
        packageUpdates[itemKey] = (packageUpdates[itemKey] || 0) + add;
      }
    }

    if (remaining > 0) {
      const targetIdx = scannedItem.index;
      newItems[targetIdx].qty_scan += remaining;
      newItems[targetIdx].difference = newItems[targetIdx].qty_scan - newItems[targetIdx].qty_req;

      const itemKey = `${newItems[targetIdx].code}:${newItems[targetIdx].order_line || ''}`;
      packageUpdates[itemKey] = (packageUpdates[itemKey] || 0) + remaining;
    }

    setOrderItems(newItems);

    setPackageAssignments(prev => {
      const next = { ...prev };
      Object.entries(packageUpdates).forEach(([itemKey, qty]) => {
        const currentAssignments = next[itemKey] || {};
        const currentQty = currentAssignments[activePackage] || 0;
        next[itemKey] = {
          ...currentAssignments,
          [activePackage]: currentQty + qty
        };
      });
      return next;
    });

    setShowQtyModal(false);
    setScannedItem(null);
    toast.success("Cantidad asignada.");
  };

  const handleAssignmentChange = (itemKey, pkgNum, valStr) => {
    const val = parseInt(valStr) || 0;
    setPackageAssignments(prev => {
      const next = {
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          [pkgNum]: val
        }
      };

      const [code, line] = itemKey.split(':');
      const newItems = [...orderItems];
      const idx = newItems.findIndex(i => i.code === code && (i.order_line || '') === line);

      if (idx > -1) {
        const total = Object.values(next[itemKey]).reduce((sum, q) => sum + q, 0);
        newItems[idx].qty_scan = total;
        newItems[idx].difference = total - newItems[idx].qty_req;
        setOrderItems(newItems);
      }
      return next;
    });
  };

  const handleFinalize = () => {
    setShowAssignmentModal(true);
  };

  const submitAudit = async (statusOverride) => {
    const hasDiff = orderItems.some(i => i.qty_scan !== i.qty_req);
    const auditorName = localStorage.getItem('auditor_name') || 'Auditor';

    const payload = {
      order_number: orderNumber,
      despatch_number: despatchNumber,
      customer_code: customerCode,
      customer_name: customerName,
      status: statusOverride || (hasDiff ? 'Con Diferencia' : 'Completo'),
      username: auditorName,
      items: orderItems.map(i => ({
        code: i.code,
        description: i.description,
        order_line: i.order_line,
        qty_req: i.qty_req,
        qty_scan: i.qty_scan,
        item_weight: i.item_weight || 0
      })),
      packages: parseInt(packagesCount || 0),
      packages_assignment: packageAssignments,
      packages_dimensions: Object.entries(packageDimensions).map(([num, dims]) => ({
        package_number: parseInt(num),
        ...dims
      }))
    };

    try {
      const res = await fetch('/api/save_picking_audit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept-Language': locale
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Auditoría guardada con éxito.");
        handleReset();
        setShowConfirmModal(false);
        setShowAssignmentModal(false);
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Error al guardar la auditoría');
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  // --- RENDERIZADO DE PANTALLA ACTIVA ---
  if (auditActive) {
    const totalScanWeight = orderItems.reduce((acc, i) => acc + ((i.item_weight || 0) * (i.qty_scan || 0)), 0);
    const totalReqWeight = orderItems.reduce((acc, i) => acc + ((i.item_weight || 0) * (i.qty_req || 0)), 0);

    return (
      <div className="picking-audit-page space-y-6 max-w-5xl mx-auto">
        <ToastContainer position="top-right" autoClose={3000} />

        <div className="rounded border border-[#c8c6c4] bg-white p-6 shadow-xs">
          {/* Cabecera de Auditoría */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-[#edebe9] gap-4">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-[#111827]">
                {t('activeAuditTitle')}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-[#374151] mt-1.5 items-center">
                <span>{t('orderLabel')}: <strong className="font-mono text-[#0078d4] font-bold text-base">{orderNumber} / {despatchNumber}</strong></span>
                <span>{t('customerLabel')}: <strong className="text-[#111827]">{customerCode} - {customerName}</strong></span>
                <span className="bg-[#eff6fc] px-2.5 py-1 rounded border border-[#c8c6c4] text-[#111827]">
                  {t('totalWeightLabel')}: <strong className="font-mono text-[#0078d4] font-bold">{totalScanWeight.toFixed(3)} kg</strong>
                </span>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="cursor-pointer rounded border border-[#c8c6c4] px-3.5 py-1.5 text-xs font-semibold uppercase text-[#374151] transition-all hover:bg-[#e5e7eb] hover:text-[#111827]"
            >
              {t('exitBtn')}
            </button>
          </div>

          {/* Selector de Bulto Activo */}
          <div className="mb-4 p-3.5 bg-[#f9f9f9] rounded border border-[#c8c6c4] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase font-bold text-[#374151]">
                {t('activePkgLabel')}:
              </span>
              <div className="flex gap-2 flex-wrap items-center">
                {Array.from({ length: parseInt(packagesCount) || 1 }).map((_, i) => (
                  <div key={i + 1} className="relative">
                    <button
                      onClick={() => setActivePackage(i + 1)}
                      className={`w-9 h-9 rounded-full font-bold text-sm transition-all cursor-pointer ${
                        activePackage === i + 1
                          ? 'bg-[#0078d4] text-white shadow-xs'
                          : 'bg-white text-[#111827] border border-[#c8c6c4] hover:border-[#0078d4]'
                      }`}
                    >
                      {i + 1}
                    </button>
                    {activePackage === i + 1 && (
                      <button 
                        onClick={() => setDimensionScannerOpen(true)}
                        className="absolute -top-1 -right-1 bg-white border border-[#0078d4] rounded-full w-4 h-4 flex items-center justify-center text-[9px] text-[#0078d4] shadow-xs cursor-pointer hover:bg-[#eff6fc]"
                        title={t('dimTableBox')}
                      >
                        ✎
                      </button>
                    )}
                    {packageDimensions[i + 1] && (
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-[#0e620e] border border-white" />
                    )}
                  </div>
                ))}

                <div className="flex items-center gap-1.5 ml-2">
                  {(parseInt(packagesCount) || 1) > 1 && (
                    <button
                      onClick={() => {
                        const total = parseInt(packagesCount);
                        let assigned = false;
                        Object.values(packageAssignments).forEach(pkgs => {
                          if (pkgs[total] > 0) assigned = true;
                        });
                        if (assigned) {
                          toast.warning(`El bulto ${total} tiene artículos asignados.`);
                          return;
                        }
                        const nextCount = total - 1;
                        setPackagesCount(nextCount.toString());
                        if (activePackage > nextCount) setActivePackage(nextCount);
                      }}
                      className="w-8 h-8 rounded-full border border-[#c8c6c4] bg-white text-[#8a1f24] text-sm font-bold hover:bg-[#fee2e2] flex items-center justify-center cursor-pointer"
                      title={t('editModalRemovePkg')}
                    >
                      −
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const nextCount = (parseInt(packagesCount) || 1) + 1;
                      setPackagesCount(nextCount.toString());
                      setActivePackage(nextCount);
                      setPackageAssignments(prev => {
                        const updated = { ...prev };
                        Object.keys(updated).forEach(k => {
                          updated[k] = { ...updated[k], [nextCount]: 0 };
                        });
                        return updated;
                      });
                    }}
                    className="w-8 h-8 rounded-full border border-[#0078d4] bg-white text-[#0078d4] text-sm font-bold hover:bg-[#eff6fc] flex items-center justify-center cursor-pointer"
                    title={t('editModalAddPkg')}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <span className="text-sm text-[#374151]">
              {t('pkgAssigningText')} <strong className="text-[#0078d4] font-bold">Bulto {activePackage}</strong>
            </span>
          </div>

          {/* Banner de error de escaneo */}
          {scanError && (
            <div className="bg-[#fee2e2] border-l-4 border-[#8a1f24] text-[#8a1f24] px-4 py-2.5 rounded text-sm mb-4 flex justify-between items-center font-medium">
              <span>{scanError}</span>
              <button onClick={() => setScanError('')} className="font-bold text-base cursor-pointer">✕</button>
            </div>
          )}

          {/* Barra de Entrada de Escaneo */}
          <div className="mb-4">
            <label className="block text-xs md:text-sm font-bold uppercase tracking-wider text-[#111827] mb-1.5">
              {t('scanInputLabel')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={itemCodeInput}
                onChange={(e) => setItemCodeInput(e.target.value.toUpperCase())}
                placeholder={t('scanPlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleScan(itemCodeInput);
                  }
                }}
                autoFocus
                className="flex-grow rounded border border-[#605e5c] px-3.5 py-2 text-base font-mono text-[#111827] outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
              />
              <button
                onClick={() => setScannerOpen(true)}
                className="rounded border border-[#c8c6c4] bg-white px-3.5 py-2 text-xs font-semibold text-[#374151] hover:bg-[#e5e7eb] cursor-pointer"
                title="Cámara / Scanner"
              >
                QR
              </button>
              <button
                onClick={() => handleScan(itemCodeInput)}
                className="rounded bg-[#0078d4] px-5 py-2 text-xs md:text-sm font-bold uppercase text-white hover:bg-[#106ebe] transition-colors cursor-pointer shadow-xs"
              >
                {t('searchBtn')}
              </button>
            </div>
          </div>

          {/* Tabla de Artículos */}
          <div className="overflow-x-auto border border-[#c8c6c4] rounded mb-6">
            <table className="w-full text-left sap-table">
              <thead>
                <tr>
                  <th className="text-center w-14">{t('tableHeaderLine')}</th>
                  <th>{t('tableHeaderItem')}</th>
                  <th>{t('tableHeaderDesc')}</th>
                  <th className="text-center w-28">{t('tableHeaderScan')}</th>
                  <th className="text-center w-36">{t('tableHeaderWeight')}</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, idx) => {
                  const itemKey = `${item.code}:${item.order_line || ''}`;
                  const lineWeight = (item.item_weight || 0) * (item.qty_scan || 0);

                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-[#f3f9fd] ${item.qty_scan > 0 ? 'bg-[#f0fdf4]/30' : ''}`}
                    >
                      <td className="text-center font-mono text-sm font-medium text-[#374151]">{item.order_line}</td>
                      <td>
                        <span className="font-mono font-bold text-[#111827] text-sm">{item.code}</span>
                        <div className="flex gap-1.5 flex-wrap mt-0.5">
                          {Object.entries(packageAssignments[itemKey] || {})
                            .filter(([_, q]) => q > 0)
                            .map(([pNum, q]) => (
                              <span key={pNum} className="text-xs bg-[#f3f4f6] border border-[#c8c6c4] px-1.5 py-0.5 rounded text-[#374151] font-semibold">
                                B{pNum}: {q}
                              </span>
                            ))
                          }
                        </div>
                      </td>
                      <td className="text-sm text-[#111827] max-w-xs truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="text-center font-mono text-sm font-bold text-[#111827]">{item.qty_scan}</td>
                      <td className="text-center font-mono text-sm font-bold text-[#111827]">
                        {lineWeight.toFixed(3)} kg
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
                    {orderItems.reduce((sum, i) => sum + (i.qty_scan || 0), 0)}
                  </td>
                  <td className="text-center font-mono text-sm text-[#0078d4] font-bold">
                    {totalScanWeight.toFixed(3)} kg
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Botón Finalizar */}
          <div className="flex justify-end">
            <button
              onClick={handleFinalize}
              className="w-full sm:w-auto rounded bg-[#0078d4] px-6 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider text-white hover:bg-[#106ebe] transition-colors cursor-pointer shadow-xs"
            >
              {t('finalizeBtn')}
            </button>
          </div>
        </div>

        {/* Modales Flotantes */}
        {scannerOpen && (
          <ScannerModal
            title={t('scanInputLabel')}
            onScan={(code) => {
              setScannerOpen(false);
              handleScan(code);
            }}
            onClose={() => setScannerOpen(false)}
          />
        )}

        {dimensionScannerOpen && (
          <DimensionScanner
            packageNumber={activePackage}
            initialData={packageDimensions[activePackage]}
            onConfirm={(dims) => {
              setPackageDimensions(prev => ({
                ...prev,
                [activePackage]: dims
              }));
              setDimensionScannerOpen(false);
              toast.success(`Medidas de bulto ${activePackage} registradas.`);
            }}
            onClose={() => setDimensionScannerOpen(false)}
          />
        )}

        {/* Modal de Cantidad */}
        {showQtyModal && scannedItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded border border-[#c8c6c4] shadow-xl p-6 w-full max-w-sm border-t-4 border-t-[#0078d4]">
              <h3 className="text-base font-bold uppercase text-[#111827] mb-1">
                {t('qtyModalTitle')}: <span className="font-mono text-[#0078d4] font-bold">{scannedItem.code}</span>
              </h3>
              <p className="text-sm text-[#374151] mb-3 truncate">{scannedItem.description}</p>
              
              <div className="bg-[#f9f9f9] border border-[#c8c6c4] p-3 rounded mb-4 text-sm flex items-center justify-between">
                <span>{t('tableHeaderLine')}: <strong className="font-mono text-[#111827]">{scannedItem.order_line}</strong></span>
              </div>

              <div className="mb-4">
                <label className="block text-center text-xs md:text-sm font-bold uppercase text-[#111827] mb-1.5">
                  {t('qtyModalSub')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={tempQty}
                  onChange={(e) => setTempQty(e.target.value)}
                  className="w-full text-center text-3xl font-mono font-bold rounded border border-[#605e5c] py-2.5 focus:border-[#0078d4] outline-none text-[#111827]"
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmQuantity();
                    if (e.key === 'Escape') setShowQtyModal(false);
                  }}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button 
                  onClick={() => setShowQtyModal(false)}
                  className="rounded border border-[#c8c6c4] px-4 py-2 text-xs md:text-sm font-semibold text-[#374151] hover:bg-[#e5e7eb] hover:text-[#111827] cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  onClick={confirmQuantity}
                  className="rounded bg-[#0078d4] px-5 py-2 text-xs md:text-sm font-bold uppercase text-white hover:bg-[#106ebe] cursor-pointer shadow-xs"
                >
                  {t('qtyModalSub')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmación de Diferencias */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded border border-[#c8c6c4] shadow-xl p-6 w-full max-w-sm border-t-4 border-t-[#8a3b07]">
              <h3 className="text-base font-bold uppercase text-[#8a3b07] mb-2">
                {t('diffModalTitle')}
              </h3>
              <p className="text-sm text-[#111827] mb-4 leading-relaxed">
                {t('diffModalDesc')}
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="rounded border border-[#c8c6c4] px-4 py-2 text-xs md:text-sm font-semibold text-[#374151] hover:bg-[#e5e7eb] hover:text-[#111827] cursor-pointer"
                >
                  {t('diffGoBackBtn')}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setShowAssignmentModal(true);
                  }}
                  className="rounded bg-[#8a3b07] px-5 py-2 text-xs md:text-sm font-bold uppercase text-white hover:bg-[#723005] cursor-pointer shadow-xs"
                >
                  {t('diffContinueBtn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Distribución en Bultos */}
        {showAssignmentModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded border border-[#c8c6c4] shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border-t-4 border-t-[#0078d4]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold uppercase text-[#111827]">
                  {t('assignModalTitle')}
                </h3>
                <button onClick={() => setShowAssignmentModal(false)} className="text-base font-bold text-[#374151] hover:text-[#111827] cursor-pointer">✕</button>
              </div>
              <p className="text-sm text-[#374151] mb-4">
                {t('assignModalDesc')}
              </p>

              <div className="overflow-x-auto border border-[#c8c6c4] rounded mb-4">
                <table className="w-full text-sm sap-table">
                  <thead>
                    <tr>
                      <th className="w-14 text-center">{t('tableHeaderLine')}</th>
                      <th>{t('tableHeaderItem')}</th>
                      <th className="text-center w-24">{t('assignTableHeaderTotal')}</th>
                      {Array.from({ length: parseInt(packagesCount) || 1 }).map((_, i) => (
                        <th key={i} className="text-center w-24">{t('assignTableHeaderPkg')} {i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.filter(item => item.qty_scan > 0).map((item, idx) => {
                      const itemKey = `${item.code}:${item.order_line || ''}`;
                      const assignments = packageAssignments[itemKey] || {};

                      return (
                        <tr key={idx} className="hover:bg-[#f3f9fd]">
                          <td className="text-center font-mono font-medium text-[#374151]">{item.order_line}</td>
                          <td>
                            <span className="font-mono font-bold text-[#111827] text-sm">{item.code}</span>
                            <div className="text-xs text-[#374151] truncate max-w-xs">{item.description}</div>
                          </td>
                          <td className="text-center font-mono font-bold text-sm text-[#111827]">{item.qty_scan}</td>
                          {Array.from({ length: parseInt(packagesCount) || 1 }).map((_, i) => (
                            <td key={i} className="text-center py-1.5">
                              <input
                                type="number"
                                min="0"
                                className="w-16 text-center rounded border border-[#605e5c] py-1 text-sm font-mono font-bold text-[#111827]"
                                value={assignments[i + 1] || 0}
                                onChange={(e) => handleAssignmentChange(itemKey, i + 1, e.target.value)}
                                onFocus={(e) => e.target.select()}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="rounded border border-[#c8c6c4] px-4 py-2 text-xs md:text-sm font-semibold text-[#374151] hover:bg-[#e5e7eb] hover:text-[#111827] cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  onClick={() => submitAudit()}
                  className="rounded bg-[#0e620e] px-5 py-2 text-xs md:text-sm font-bold uppercase text-white hover:bg-[#0b4d0b] cursor-pointer shadow-xs"
                >
                  {t('saveAndFinalizeBtn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDERIZADO DE CARGA DE PEDIDO / SEGUIMIENTO (Estilo Logix) ---
  return (
    <div className="picking-audit-page space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Widget de Carga Directa */}
        <div className="lg:col-span-4 rounded border border-[#c8c6c4] bg-white p-6 shadow-xs">
          <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-[#111827] mb-1">
            {t('loadAuditTitle')}
          </h3>
          <p className="text-sm text-[#374151] mb-5">
            {t('loadAuditDesc')}
          </p>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-xs md:text-sm font-bold uppercase tracking-wider text-[#111827] mb-1.5">
                {t('orderInputLabel')}
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Ej: 0045628"
                onKeyDown={(e) => e.key === 'Enter' && handleLoadOrder()}
                className="w-full rounded border border-[#605e5c] p-2.5 text-sm font-mono text-[#111827] outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-bold uppercase tracking-wider text-[#111827] mb-1.5">
                {t('despatchInputLabel')}
              </label>
              <input
                type="text"
                value={despatchNumber}
                onChange={(e) => setDespatchNumber(e.target.value)}
                placeholder="Ej: 00"
                onKeyDown={(e) => e.key === 'Enter' && handleLoadOrder()}
                className="w-full rounded border border-[#605e5c] p-2.5 text-sm font-mono text-[#111827] outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
              />
            </div>
          </div>

          <button 
            onClick={handleLoadOrder} 
            disabled={loadingOrder}
            className="w-full rounded bg-[#0078d4] py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider text-white hover:bg-[#106ebe] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loadingOrder ? t('loadingAuditBtn') : t('startAuditBtn')}
          </button>
        </div>

        {/* Tabla de Seguimiento de Pedidos Recientes */}
        <div className="lg:col-span-8 rounded border border-[#c8c6c4] bg-white p-6 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-[#111827]">
              {t('recentOrdersTitle')}
            </h3>
            <button 
              onClick={loadTrackingData} 
              disabled={loadingTracking}
              className="rounded border border-[#c8c6c4] bg-white px-3 py-1.5 text-xs font-semibold text-[#374151] hover:bg-[#e5e7eb] hover:text-[#111827] cursor-pointer"
            >
              {t('updateBtn')}
            </button>
          </div>

          <div className="overflow-x-auto border border-[#c8c6c4] rounded max-h-[380px] overflow-y-auto">
            <table className="w-full text-left sap-table">
              <thead>
                <tr>
                  <th>{t('orderLabel')}</th>
                  <th>{t('menuShipments')}</th>
                  <th>{t('customerLabel')}</th>
                  <th className="text-center">{t('tableHeaderLine')}s</th>
                  <th 
                    className="cursor-pointer select-none" 
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  >
                    {t('tableHeaderDate')} {sortOrder === 'asc' ? '▲' : '▼'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingTracking ? (
                  <tr><td colSpan="5" className="text-center py-6 text-sm text-[#374151]">{t('loadingAuditBtn')}</td></tr>
                ) : filteredTracking.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-6 text-sm text-[#374151]">{t('auditsTableEmpty')}</td></tr>
                ) : (
                  [...filteredTracking]
                    .sort((a, b) => {
                      const dateA = new Date(a.print_date);
                      const dateB = new Date(b.print_date);
                      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                    })
                    .map((tRow, idx) => (
                      <tr 
                        key={idx} 
                        className={`cursor-pointer hover:bg-[#f3f9fd] ${tRow.is_audited ? 'bg-[#f0f0f0] opacity-75' : ''}`}
                        onClick={() => {
                          setOrderNumber(tRow.order_number);
                          setDespatchNumber(tRow.despatch_number);
                          toast.info(`Pedido ${tRow.order_number} seleccionado.`);
                        }}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#111827] text-sm">{tRow.order_number}</span>
                            {tRow.is_audited && (
                              <span className="bg-slate-200 text-slate-800 text-xs font-semibold px-1.5 py-0.5 rounded uppercase">
                                Auditado
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="font-mono text-sm text-[#374151]">{tRow.despatch_number}</td>
                        <td className="max-w-[220px] truncate text-sm text-[#111827]" title={`${tRow.customer_code} - ${tRow.customer_name}`}>
                          <span className="text-[#374151] font-medium">[{tRow.customer_code}]</span> {tRow.customer_name}
                        </td>
                        <td className="text-center font-mono font-bold text-[#0078d4] text-sm">{tRow.total_lines}</td>
                        <td className="font-mono text-sm text-[#374151]">{tRow.print_date}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Matriz de Resumen por Cliente y Fecha (Exacta como en Logix) */}
      <div className="rounded border border-[#c8c6c4] bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-[#111827]">
            Resumen por Cliente y Fecha
          </h3>
          {selectedCustomerFilter && (
            <button
              onClick={() => setSelectedCustomerFilter(null)}
              className="text-xs font-semibold text-[#0078d4] hover:underline cursor-pointer"
            >
              Limpiar filtro ({selectedCustomerFilter})
            </button>
          )}
        </div>

        {matrixData.dates.length === 0 ? (
          <div className="text-center py-6 text-sm text-[#374151] bg-[#f9f9f9] rounded border border-[#c8c6c4]">
            No hay información disponible para generar la matriz
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#c8c6c4] rounded max-h-[480px]">
            <table className="w-full text-left text-sm sap-table border-collapse min-w-[750px]">
              <thead>
                <tr>
                  <th className="py-1.5 px-2.5 border-b border-r border-[#c8c6c4]" style={{ background: '#f3f4f6', position: 'sticky', top: 0, zIndex: 12 }}>
                    Fecha
                  </th>
                  {matrixData.dates.map(date => (
                    <th
                      key={date}
                      className="py-1.5 px-2 text-center border-b border-r border-[#c8c6c4]"
                      colSpan={2}
                      style={{ background: '#f3f4f6', position: 'sticky', top: 0, zIndex: 12 }}
                    >
                      {formatDateLabel(date)}
                    </th>
                  ))}
                  <th
                    className="py-1.5 px-2 text-center border-b border-r border-[#c8c6c4]"
                    colSpan={2}
                    style={{ background: '#f3f4f6', position: 'sticky', top: 0, zIndex: 12 }}
                  >
                    Total General
                  </th>
                </tr>
                <tr>
                  <th className="py-1.5 px-2.5 border-b border-r border-[#c8c6c4] text-xs font-bold uppercase" style={{ background: '#f3f4f6', position: 'sticky', top: '33px', zIndex: 12 }}>
                    Cliente
                  </th>
                  {matrixData.dates.map(date => (
                    <React.Fragment key={date}>
                      <th className="py-1 px-2 text-center border-b border-r border-[#c8c6c4] text-xs font-bold uppercase w-16" style={{ background: '#f3f4f6', position: 'sticky', top: '33px', zIndex: 12 }}>
                        Ped
                      </th>
                      <th className="py-1 px-2 text-center border-b border-r border-[#c8c6c4] text-xs font-bold uppercase w-16" style={{ background: '#f3f4f6', position: 'sticky', top: '33px', zIndex: 12 }}>
                        Lín
                      </th>
                    </React.Fragment>
                  ))}
                  <th className="py-1 px-2 text-center border-b border-r border-[#c8c6c4] text-xs font-bold uppercase w-16" style={{ background: '#f3f4f6', position: 'sticky', top: '33px', zIndex: 12 }}>
                    Ped
                  </th>
                  <th className="py-1 px-2 text-center border-b border-r border-[#c8c6c4] text-xs font-bold uppercase w-16" style={{ background: '#f3f4f6', position: 'sticky', top: '33px', zIndex: 12 }}>
                    Lín
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrixData.rows.map((row) => {
                  const isFiltered = selectedCustomerFilter === row.customerCode;
                  return (
                    <tr
                      key={row.customerCode}
                      className={`border-b hover:bg-[#f3f9fd] cursor-pointer ${isFiltered ? 'bg-[#eff6fc]' : ''}`}
                      onClick={() => toggleCustomerFilter(row.customerCode)}
                    >
                      <td className="py-1.5 px-2.5 border-r border-[#c8c6c4]">
                        <span className="font-bold text-[#111827] text-sm">{row.customerCode}</span>
                        <span className="text-[#374151] text-xs ml-1.5 truncate max-w-[150px] inline-block align-bottom">{row.customerName}</span>
                      </td>
                      {matrixData.dates.map(date => {
                        const cell = row.dates[date];
                        return (
                          <React.Fragment key={date}>
                            <td className="py-1 px-2 text-center border-r border-[#c8c6c4] font-mono text-sm text-[#111827]">
                              {cell ? cell.orders : '-'}
                            </td>
                            <td className="py-1 px-2 text-center border-r border-[#c8c6c4] font-mono font-bold text-[#0078d4] text-sm">
                              {cell ? cell.lines : '-'}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="py-1 px-2 text-center border-r border-[#c8c6c4] font-mono font-bold text-sm bg-[#fafafa] text-[#111827]">
                        {row.totalOrders}
                      </td>
                      <td className="py-1 px-2 text-center border-r border-[#c8c6c4] font-mono font-bold text-sm text-[#0078d4] bg-[#fafafa]">
                        {row.totalLines}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f3f4f6] font-bold border-t-2 border-[#c8c6c4]">
                  <td className="py-2 px-2.5 border-r border-[#c8c6c4] text-right uppercase text-xs font-bold text-[#111827]">
                    Totales:
                  </td>
                  {matrixData.dates.map(date => (
                    <React.Fragment key={date}>
                      <td className="py-2 px-2 text-center border-r border-[#c8c6c4] font-mono text-sm font-bold text-[#111827]">
                        {matrixData.totals[date]?.orders || 0}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-[#c8c6c4] font-mono font-bold text-sm text-[#0078d4]">
                        {matrixData.totals[date]?.lines || 0}
                      </td>
                    </React.Fragment>
                  ))}
                  <td className="py-2 px-2 text-center border-r border-[#c8c6c4] font-mono text-sm font-bold text-[#111827]">
                    {matrixData.grandTotal.orders}
                  </td>
                  <td className="py-2 px-2 text-center border-r border-[#c8c6c4] font-mono text-sm font-bold text-[#0078d4]">
                    {matrixData.grandTotal.lines}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PickingAudit;
