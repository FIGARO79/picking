import React, { useState, useEffect, useRef } from 'react';
import ScannerModal from '../components/ScannerModal';
import DimensionScanner from '../components/DimensionScanner';
import { useTranslation } from '../context/LanguageContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

// Iconos SVG modernos y premium para mejorar la UI
const ExitIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const MeasureIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.3 8.11 16.3 3.1a2 2 0 0 0-2.82 0L3.1 13.5a2 2 0 0 0 0 2.82l5 5a2 2 0 0 0 2.82 0L21.3 10.93a2 2 0 0 0 0-2.82Z"></path>
    <line x1="8.5" y1="5.5" x2="10.5" y2="7.5"></line>
    <line x1="11.5" y1="8.5" x2="13.5" y2="10.5"></line>
    <line x1="14.5" y1="11.5" x2="16.5" y2="13.5"></line>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const QRIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
    <line x1="7" y1="7" x2="7" y2="7.01"></line>
    <line x1="17" y1="7" x2="17" y2="7.01"></line>
    <line x1="17" y1="17" x2="17" y2="17.01"></line>
    <line x1="7" y1="17" x2="7" y2="17.01"></line>
  </svg>
);

const ScannerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
    <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
    <line x1="8" y1="6" x2="8" y2="18"></line>
    <line x1="12" y1="6" x2="12" y2="18"></line>
    <line x1="16" y1="6" x2="16" y2="18"></line>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const PackageCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const PickingAudit = () => {
  const { t, locale } = useTranslation();
  // --- Estados de Búsqueda/Carga ---
  const [orderNumber, setOrderNumber] = useState('');
  const [despatchNumber, setDespatchNumber] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [trackingData, setTrackingData] = useState([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');

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

  const loadTrackingData = async () => {
    setLoadingTracking(true);
    try {
      const response = await fetch('/api/picking/tracking', {
        headers: {
          'Accept-Language': locale
        }
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
        headers: {
          'Accept-Language': locale
        }
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'No se pudo cargar el pedido.');
      }

      const data = await response.json();
      if (data && data.length > 0) {
        setCustomerCode(data[0]['Customer Code'] || 'N/A');
        setCustomerName(data[0]['Customer Name'] || 'N/A');
        
        const items = data.map(row => ({
          code: row['Item Code'],
          description: row['Item Description'],
          order_line: row['Order Line'],
          qty_req: parseInt(row['Qty'] || 0),
          qty_scan: 0,
          difference: 0
        }));
        
        setOrderItems(items);

        // Inicializar asignaciones vacías
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

  // --- Lógica de Escaneo/Conteo ---

  const handleScan = (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    // Buscar ítem disponible (primero no completados)
    let idx = orderItems.findIndex(i => i.code === cleanCode && i.qty_scan < i.qty_req);
    if (idx === -1) {
      idx = orderItems.findIndex(i => i.code === cleanCode);
    }

    if (idx > -1) {
      const item = orderItems[idx];
      setScannedItem({ ...item, index: idx });
      setTempQty(1);
      setShowQtyModal(true);
      setItemCodeInput('');
      playSuccess();
      setScanError('');
    } else {
      playError();
      setItemCodeInput('');
      setScanError(locale === 'pt' 
        ? `O SKU '${cleanCode}' não pertence a este pedido.`
        : `El SKU '${cleanCode}' no pertenece a este pedido.`
      );
      if (scanErrorTimeoutRef.current) clearTimeout(scanErrorTimeoutRef.current);
      scanErrorTimeoutRef.current = setTimeout(() => {
        setScanError('');
      }, 6000);
    }
  };

  const confirmQuantity = () => {
    if (!scannedItem) return;
    const qtyToAdd = parseInt(tempQty) || 0;
    if (qtyToAdd <= 0) {
      setShowQtyModal(false);
      return;
    }

    const newItems = [...orderItems];
    let remaining = qtyToAdd;
    const packageUpdates = {};

    // 1. Distribuir primero en las líneas que requieren cantidad
    for (let i = 0; i < newItems.length && remaining > 0; i++) {
      if (newItems[i].code === scannedItem.code && newItems[i].qty_scan < newItems[i].qty_req) {
        const needed = newItems[i].qty_req - newItems[i].qty_scan;
        const toAdd = Math.min(needed, remaining);

        newItems[i].qty_scan += toAdd;
        newItems[i].difference = newItems[i].qty_scan - newItems[i].qty_req;
        remaining -= toAdd;

        const itemKey = `${newItems[i].code}:${newItems[i].order_line || ''}`;
        packageUpdates[itemKey] = (packageUpdates[itemKey] || 0) + toAdd;
      }
    }

    // 2. Si sobra, asignar el exceso a la primera línea/índice del ítem escaneado
    if (remaining > 0) {
      const targetIdx = scannedItem.index;
      newItems[targetIdx].qty_scan += remaining;
      newItems[targetIdx].difference = newItems[targetIdx].qty_scan - newItems[targetIdx].qty_req;

      const itemKey = `${newItems[targetIdx].code}:${newItems[targetIdx].order_line || ''}`;
      packageUpdates[itemKey] = (packageUpdates[itemKey] || 0) + remaining;
    }

    setOrderItems(newItems);

    // Actualizar asignación al bulto activo
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

    // Alerta visual de exceso
    const hasOver = newItems.some(i => i.qty_scan > i.qty_req);
    if (hasOver) {
      playError();
      toast.warning("¡Exceso de cantidad detectado en uno o más ítems!");
    } else {
      toast.success("Cantidad asignada correctamente.");
    }
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

      // Recalcular qty_scan e items
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
    const hasDiff = orderItems.some(i => i.qty_scan !== i.qty_req);
    if (hasDiff) {
      setShowConfirmModal(true);
    } else {
      setShowAssignmentModal(true);
    }
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
        qty_scan: i.qty_scan
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
        toast.success(data.message || "Auditoría guardada con éxito en el servidor.");
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

  // --- Renderizado de Pantalla Activa ---
  if (auditActive) {
    return (
      <div className="audit-active-container">
        <ToastContainer position="top-right" autoClose={3000} />

        <div className="card audit-card">
          <div className="audit-header">
            <div className="audit-title-group">
              <h2 className="audit-title">{t('activeAuditTitle')}</h2>
              <div className="audit-metadata">
                <span>{t('orderLabel')}: <strong>{orderNumber} / {despatchNumber}</strong></span>
                <span>{t('customerLabel')}: <strong>{customerCode} - {customerName}</strong></span>
              </div>
            </div>
            <button onClick={handleReset} className="cancel-exit-btn">
              {t('exitBtn')}
            </button>
          </div>

          {/* Selector de Bultos Activos */}
          <div className="package-selector-bar">
            <span className="selector-title">{t('activePkgLabel')}:</span>
            <div className="package-buttons">
              {Array.from({ length: parseInt(packagesCount) || 1 }).map((_, i) => (
                <div key={i + 1} className="pkg-btn-wrapper">
                  <button
                    onClick={() => setActivePackage(i + 1)}
                    className={`pkg-btn ${activePackage === i + 1 ? 'active' : ''}`}
                  >
                    {i + 1}
                  </button>
                  {activePackage === i + 1 && (
                    <button 
                       onClick={() => setDimensionScannerOpen(true)}
                       className="pkg-measure-btn"
                       title={t('dimTableBox')}
                    >
                      <EditIcon />
                    </button>
                  )}
                  {packageDimensions[i + 1] && (
                    <span className="pkg-has-dims" title="Medidas guardadas"></span>
                  )}
                </div>
              ))}

              <div className="pkg-controls">
                {(parseInt(packagesCount) || 1) > 1 && (
                  <button
                    onClick={() => {
                      const total = parseInt(packagesCount);
                      // Verificar que no tenga ítems asignados
                      let assigned = false;
                      Object.values(packageAssignments).forEach(pkgs => {
                        if (pkgs[total] > 0) assigned = true;
                      });
                      if (assigned) {
                        toast.warning(`El bulto ${total} tiene artículos. Redistribúyelos primero.`);
                        return;
                      }
                      const nextCount = total - 1;
                      setPackagesCount(nextCount.toString());
                      if (activePackage > nextCount) setActivePackage(nextCount);
                    }}
                    className="pkg-control-btn remove"
                    title={t('editModalRemovePkg')}
                  >
                    <MinusIcon />
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
                  className="pkg-control-btn add"
                  title={t('editModalAddPkg')}
                >
                  <PlusIcon />
                </button>
              </div>
            </div>
            <div className="pkg-info-text">
              {t('pkgAssigningText')} <em>{activePackage}.</em>
            </div>
          </div>

          {scanError && (
            <div className="scan-error-banner" style={{
              backgroundColor: '#fdebfa',
              borderLeft: '4px solid var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              animation: 'slideDown 0.25s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <span style={{ fontSize: '0.9rem', color: '#8b0000', fontWeight: '600' }}>{scanError}</span>
              </div>
              <button 
                onClick={() => setScanError('')} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#8b0000', 
                  fontSize: '1rem', 
                  cursor: 'pointer',
                  padding: '0 4px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Campo de Escaneo Activo */}
          <div className="scan-bar">
            <div className="scan-input-container">
              <label className="form-label">{t('scanInputLabel')}</label>
              <div className="scan-input-wrapper">
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
                />
                <button onClick={() => setScannerOpen(true)} className="scan-trigger-btn">
                  <QRIcon />
                </button>
                <button onClick={() => handleScan(itemCodeInput)} className="btn btn-primary scan-search-btn">
                  {t('searchBtn')}
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Artículos de la Orden */}
          <div className="table-container audit-items-table">
            <table>
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '60px' }}>{t('tableHeaderLine')}</th>
                  <th>{t('tableHeaderItem')}</th>
                  <th>{t('tableHeaderDesc')}</th>
                  <th className="text-center" style={{ width: '80px' }}>{t('tableHeaderReq')}</th>
                  <th className="text-center" style={{ width: '80px' }}>{t('tableHeaderScan')}</th>
                  <th className="text-center" style={{ width: '80px' }}>{t('tableHeaderDiff')}</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, idx) => {
                  const itemKey = `${item.code}:${item.order_line || ''}`;
                  const diff = item.qty_scan - item.qty_req;
                  const isOk = item.qty_scan === item.qty_req;
                  const isExcess = item.qty_scan > item.qty_req;

                  return (
                    <tr 
                      key={idx} 
                      className={`hoverable ${isOk ? 'row-complete' : isExcess ? 'row-excess' : ''}`}
                    >
                      <td className="text-center text-mono text-muted">{item.order_line}</td>
                      <td>
                        <span className="sku-code">{item.code}</span>
                        <div className="pkg-distributions">
                          {Object.entries(packageAssignments[itemKey] || {})
                            .filter(([_, q]) => q > 0)
                            .map(([pNum, q]) => (
                              <span key={pNum} className="pkg-dist-badge">B{pNum}: {q}</span>
                            ))
                          }
                        </div>
                      </td>
                      <td className="sku-desc">{item.description}</td>
                      <td className="text-center text-mono">{item.qty_req}</td>
                      <td className="text-center text-mono font-medium">{item.qty_scan}</td>
                      <td className={`text-center text-mono font-medium ${diff === 0 ? 'text-success' : 'text-danger'}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button onClick={handleFinalize} className="btn btn-primary finalize-audit-btn">
            {t('finalizeBtn')}
          </button>
        </div>

        {/* Modales Flotantes de la Auditoría */}
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

        {showQtyModal && scannedItem && (
          <div className="modal-overlay">
            <div className="modal-content qty-modal">
              <div className="modal-header">
                <h3>{t('qtyModalTitle')}: {scannedItem.code}</h3>
              </div>
              <div className="modal-body">
                <p className="qty-item-desc">{scannedItem.description}</p>
                <div className="qty-stats">
                  <span>{t('tableHeaderLine')}: <strong>{scannedItem.order_line}</strong></span>
                  <span>{t('tableHeaderScan')}: <strong>{scannedItem.qty_scan} / {scannedItem.qty_req}</strong></span>
                </div>
                
                <div className="qty-input-group">
                  <label className="form-label text-center">{t('qtyModalSub')}</label>
                  <input
                    type="number"
                    min="1"
                    value={tempQty}
                    onChange={(e) => setTempQty(e.target.value)}
                    className="qty-main-input"
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmQuantity();
                      if (e.key === 'Escape') setShowQtyModal(false);
                    }}
                    autoFocus
                  />
                </div>

                <div className="modal-actions">
                  <button onClick={() => setShowQtyModal(false)} className="btn btn-secondary">
                    {t('cancelBtn')}
                  </button>
                  <button onClick={confirmQuantity} className="btn btn-primary">
                    {t('qtyModalSub')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Diferencias */}
        {showConfirmModal && (
          <div className="modal-overlay">
            <div className="modal-content diff-confirm-modal">
              <div className="modal-header">
                <h3>{t('diffModalTitle')}</h3>
              </div>
              <div className="modal-body">
                <p className="diff-alert-text">{t('diffModalDesc')}</p>
                <div className="modal-actions">
                  <button onClick={() => setShowConfirmModal(false)} className="btn btn-secondary">
                    {t('diffGoBackBtn')}
                  </button>
                  <button 
                    onClick={() => {
                      setShowConfirmModal(false);
                      setShowAssignmentModal(true);
                    }} 
                    className="btn btn-danger"
                  >
                    {t('diffContinueBtn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Asignación Final de Bultos */}
        {showAssignmentModal && (
          <div className="modal-overlay">
            <div className="modal-content assignment-modal">
              <div className="modal-header">
                <h3>{t('assignModalTitle')}</h3>
                <button onClick={() => setShowAssignmentModal(false)} className="close-btn">✕</button>
              </div>
              <div className="modal-body">
                <p className="assign-desc">{t('assignModalDesc')}</p>
                
                <div className="assignment-table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>{t('tableHeaderLine')}</th>
                        <th>{t('tableHeaderItem')}</th>
                        <th className="text-center" style={{ width: '80px' }}>{t('assignTableHeaderTotal')}</th>
                        {Array.from({ length: parseInt(packagesCount) || 1 }).map((_, i) => (
                          <th key={i} className="text-center" style={{ width: '80px' }}>{t('assignTableHeaderPkg')} {i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.filter(item => item.qty_scan > 0).map((item, idx) => {
                        const itemKey = `${item.code}:${item.order_line || ''}`;
                        const assignments = packageAssignments[itemKey] || {};
                        const totalAssigned = Object.values(assignments).reduce((sum, q) => sum + q, 0);

                        return (
                          <tr key={idx}>
                            <td className="text-mono text-muted">{item.order_line}</td>
                            <td>
                              <span className="sku-code">{item.code}</span>
                              <div className="sku-desc text-xs" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{item.description}</div>
                            </td>
                            <td className="text-center text-mono font-medium">{item.qty_scan}</td>
                            {Array.from({ length: parseInt(packagesCount) || 1 }).map((_, i) => (
                              <td key={i} className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  className="assignment-pkg-input"
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

                <div className="modal-actions">
                  <button onClick={() => setShowAssignmentModal(false)} className="btn btn-secondary">
                    {t('cancelBtn')}
                  </button>
                  <button onClick={() => submitAudit()} className="btn btn-success" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                    {t('saveAndFinalizeBtn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  {/* --- Renderizado de Carga de Pedido / Seguimiento --- */}
  return (
    <div className="picking-audit-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="picking-loader-grid">
        {/* Widget de Carga Directa */}
        <div className="card load-order-card">
          <h3>{t('loadAuditTitle')}</h3>
          <p className="card-subtitle">{t('loadAuditDesc')}</p>

          <div className="form-grid">
            <div className="input-group">
              <label className="form-label">{t('orderInputLabel')}</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Ej: 0045628"
                onKeyDown={(e) => e.key === 'Enter' && handleLoadOrder()}
              />
            </div>
            <div className="input-group">
              <label className="form-label">{t('despatchInputLabel')}</label>
              <input
                type="text"
                value={despatchNumber}
                onChange={(e) => setDespatchNumber(e.target.value)}
                placeholder="Ej: 00"
                onKeyDown={(e) => e.key === 'Enter' && handleLoadOrder()}
              />
            </div>
          </div>

          <button 
            onClick={handleLoadOrder} 
            className="btn btn-primary load-btn"
            disabled={loadingOrder}
          >
            {loadingOrder ? t('loadingAuditBtn') : t('startAuditBtn')}
          </button>
        </div>

        {/* Tabla de Seguimiento de Pedidos del CSV */}
        <div className="card tracking-card">
          <div className="tracking-header">
            <h3>{t('recentOrdersTitle')}</h3>
            <button onClick={loadTrackingData} className="btn-refresh" disabled={loadingTracking}>
              {t('updateBtn')}
            </button>
          </div>

          <div className="table-container tracking-table">
            <table>
              <thead>
                <tr>
                  <th>{t('orderLabel')}</th>
                  <th>{t('menuShipments')}</th>
                  <th>{t('customerLabel')}</th>
                  <th className="text-center">{t('tableHeaderLine')}s</th>
                  <th 
                    className="sortable" 
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  >
                    {t('tableHeaderDate')} {sortOrder === 'asc' ? '▲' : '▼'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingTracking ? (
                  <tr><td colSpan="5" className="text-center py-8 text-muted">{t('loadingAuditBtn')}</td></tr>
                ) : trackingData.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-muted">{t('auditsTableEmpty')}</td></tr>
                ) : (
                  [...trackingData]
                    .sort((a, b) => {
                      const dateA = new Date(a.print_date);
                      const dateB = new Date(b.print_date);
                      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                    })
                    .map((tRow, idx) => (
                      <tr 
                        key={idx} 
                        className={`hoverable cursor-pointer ${tRow.is_audited ? 'row-audited' : ''}`}
                        onClick={() => {
                          setOrderNumber(tRow.order_number);
                          setDespatchNumber(tRow.despatch_number);
                          toast.info(`Pedido ${tRow.order_number} seleccionado.`);
                        }}
                      >
                        <td>
                          <div className="order-cell">
                            <strong>{tRow.order_number}</strong>
                            {tRow.is_audited && <span className="audited-badge">AUDITADO</span>}
                          </div>
                        </td>
                        <td className="text-mono">{tRow.despatch_number}</td>
                        <td className="truncate-cell" title={`${tRow.customer_code} - ${tRow.customer_name}`}>
                          <span className="text-muted">[{tRow.customer_code}]</span> {tRow.customer_name}
                        </td>
                        <td className="text-center font-medium">{tRow.total_lines}</td>
                        <td className="text-mono text-xs text-muted">{tRow.print_date}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .picking-audit-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .picking-loader-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .picking-loader-grid {
            grid-template-columns: 380px 1fr;
          }
        }

        .load-order-card {
          padding: 1.75rem;
          height: fit-content;
        }

        .load-order-card h3 {
          margin-bottom: 0.25rem;
        }

        .card-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }

        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .load-btn {
          width: 100%;
          height: 44px;
          font-weight: 600;
        }

        .tracking-card {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
        }

        .tracking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .btn-refresh {
          background: transparent;
          border: 1px solid var(--border-color);
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .btn-refresh:hover {
          background: #f8fafc;
          color: var(--text-main);
          border-color: #cbd5e1;
        }

        .tracking-table {
          max-height: 480px;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
        }

        .order-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .audited-badge {
          background-color: #e2e8f0;
          color: var(--text-muted);
          font-size: 0.55rem;
          font-weight: 700;
          padding: 0.1rem 0.3rem;
          border-radius: 3px;
        }

        .row-audited {
          background-color: #f8fafc;
          opacity: 0.75;
        }

        .sortable {
          cursor: pointer;
          user-select: none;
        }

        .sortable:hover {
          color: var(--primary);
        }

        .truncate-cell {
          max-width: 250px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ESTILOS DE AUDITORÍA ACTIVA */
        .audit-active-container {
          max-width: 1000px;
          margin: 0 auto;
          width: 100%;
        }

        .audit-card {
          padding: 2rem;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }

        .audit-header {
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: center !important;
          border-bottom: 1.5px solid #edf2f7;
          padding-bottom: 1.25rem;
          margin-bottom: 1.5rem;
          gap: 1rem !important;
        }

        .audit-title-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .audit-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .audit-metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.85rem;
          color: #475569;
        }

        .cancel-exit-btn {
          height: 40px !important;
          background-color: white !important;
          border: 1.5px solid #285f94 !important;
          color: #285f94 !important;
          border-radius: var(--radius-sm) !important;
          font-weight: 600 !important;
          padding: 0 1.25rem !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s ease !important;
          flex-shrink: 0 !important;
          margin: 0 !important;
          box-shadow: none !important;
          transform: none !important;
        }

        .cancel-exit-btn:hover {
          background-color: #285f94 !important;
          color: white !important;
        }

        .package-selector-bar {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-lg);
          padding: 0.85rem 1.5rem;
          margin-bottom: 1.5rem;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 1rem !important;
          flex-wrap: wrap !important;
        }

        .selector-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.05em;
          margin-right: 0.5rem;
        }

        .package-buttons {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 0.75rem !important;
        }

        .pkg-btn-wrapper {
          position: relative;
          padding: 4px;
        }

        .pkg-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: white;
          border: 1.5px solid #285f94;
          color: #285f94;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pkg-btn:hover {
          background-color: #f1f5f9;
          transform: scale(1.05);
        }

        .pkg-btn.active {
          background-color: #1e4a74;
          border-color: #1e4a74;
          color: white;
        }

        .pkg-measure-btn {
          position: absolute;
          top: -3px;
          right: -10px;
          background-color: white;
          border: 1.2px solid #285f94;
          width: 24px;
          height: 14px;
          border-radius: 9999px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
          transition: var(--transition-fast);
          z-index: 5;
          padding: 0;
          color: #285f94;
        }

        .pkg-measure-btn:hover {
          transform: scale(1.1);
          background-color: #e8eff6;
        }

        .pkg-measure-btn svg {
          width: 8px;
          height: 8px;
        }

        .pkg-has-dims {
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: var(--success);
          border: 1px solid white;
        }

        .pkg-controls {
          display: flex !important;
          flex-direction: row !important;
          gap: 0.5rem !important;
        }

        .pkg-control-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
          border: 1.5px solid #285f94;
          background-color: white;
          color: #285f94;
        }

        .pkg-control-btn:hover {
          transform: scale(1.05);
          background-color: #e8eff6;
        }

        .pkg-control-btn.remove {
          border-color: #fca3a3;
          background-color: #fef2f2;
          color: var(--danger);
        }

        .pkg-control-btn.remove:hover {
          background-color: var(--danger);
          color: white;
          border-color: var(--danger);
        }

        .pkg-info-text {
          font-size: 0.85rem;
          color: #64748b;
          margin-left: auto;
        }

        .pkg-info-text em {
          font-weight: 600;
          font-style: italic;
        }

        .scan-bar {
          margin-bottom: 1.5rem;
          width: 100%;
        }

        .scan-input-container {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .scan-input-container label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        .scan-input-wrapper {
          display: grid !important;
          grid-template-columns: 1fr 44px auto !important;
          gap: 0.5rem !important;
          align-items: center !important;
          width: 100% !important;
        }

        .scan-input-wrapper input {
          width: 100% !important;
          height: 44px !important;
          font-family: var(--font-mono);
          font-size: 1rem;
          font-weight: 500;
          border-radius: var(--radius-sm) !important;
          border: 1px solid #cbd5e1 !important;
          padding: 0 1rem !important;
          margin: 0 !important;
          min-width: 0 !important;
        }

        .scan-input-wrapper input::placeholder {
          color: #94a3b8;
        }

        .scan-trigger-btn, .scan-search-btn {
          height: 44px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          border-radius: var(--radius-sm) !important;
          border: 1.5px solid #285f94 !important;
          background-color: white !important;
          color: #285f94 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          margin: 0 !important;
        }

        .scan-trigger-btn {
          width: 44px !important;
          padding: 0 !important;
        }

        .scan-search-btn {
          padding: 0 1.25rem !important;
        }

        .scan-trigger-btn:hover, .scan-search-btn:hover {
          background-color: #285f94 !important;
          color: white !important;
        }

        .audit-items-table {
          margin-bottom: 1.5rem;
          max-height: 440px;
          overflow-y: auto;
        }

        .audit-items-table th {
          background-color: #3a5370 !important;
          color: white !important;
          font-weight: 600;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }

        .row-complete {
          background-color: #f0fdf4;
        }

        .row-excess {
          background-color: #fef2f2;
        }

        .sku-code {
          font-weight: 600;
          font-family: var(--font-mono);
          color: var(--accent);
        }

        .pkg-distributions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-top: 0.25rem;
        }

        .pkg-dist-badge {
          font-size: 0.65rem;
          font-weight: 600;
          background-color: #f1f5f9;
          border: 1px solid var(--border-color);
          padding: 0.05rem 0.3rem;
          border-radius: 4px;
          color: var(--text-muted);
        }

        .finalize-audit-btn {
          width: 100%;
          height: 48px;
          font-size: 1rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          background-color: #285f94;
          border: none;
          color: white;
          cursor: pointer;
          transition: var(--transition-normal);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: none;
        }

        .finalize-audit-btn:hover {
          background-color: #1e4a74;
        }

        .finalize-audit-btn:active {
          transform: translateY(1px);
        }

        .audit-header .btn-secondary {
          border-color: rgba(239, 68, 68, 0.2) !important;
          color: var(--danger) !important;
          background-color: #fef2f2 !important;
          font-weight: 600 !important;
          transition: var(--transition-fast) !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .audit-header .btn-secondary:hover {
          background-color: var(--danger) !important;
          color: white !important;
          border-color: var(--danger) !important;
        }


        /* ESTILOS DE MODALES INTERNOS */
        .qty-modal {
          max-width: 360px;
          border-top: 4px solid var(--primary);
        }

        .qty-item-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .qty-stats {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          background-color: #f8fafc;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1.5rem;
          border: 1px solid var(--border-color);
        }

        .qty-input-group {
          margin-bottom: 1.5rem;
        }

        .qty-main-input {
          text-align: center;
          font-size: 1.75rem !important;
          font-weight: 600 !important;
          height: 60px !important;
          border: 2px solid var(--primary) !important;
          border-radius: var(--radius-sm) !important;
        }

        .diff-confirm-modal {
          max-width: 380px;
          border-top: 4px solid var(--danger);
        }

        .diff-alert-text {
          font-size: 0.875rem;
          color: var(--text-main);
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .assignment-modal {
          max-width: 720px;
        }

        .assign-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
        }

        .assignment-table-container {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          margin-bottom: 1.5rem;
        }

        .assignment-pkg-input {
          width: 64px;
          height: 32px !important;
          text-align: center;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          padding: 0 !important;
        }
      `}} />
    </div>
  );
};

export default PickingAudit;
