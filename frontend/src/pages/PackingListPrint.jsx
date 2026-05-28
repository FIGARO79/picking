import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';

const PackingListPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, locale } = useTranslation();
  const isConsolidated = searchParams.get('consolidated') === 'true';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de Configuración de Bodega y Transportadoras
  const [warehouseName, setWarehouseName] = useState('');
  const [carriersList, setCarriersList] = useState([]);
  const [selectedCarrier, setSelectedCarrier] = useState('');

  useEffect(() => {
    fetchPackingListData();
    fetchConfig();
  }, [id, isConsolidated]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config/');
      if (res.ok) {
        const configData = await res.json();
        setWarehouseName(configData.warehouse_name || '');
        setCarriersList(configData.carriers || []);
      }
    } catch (e) {
      console.error("Error al cargar config para el print:", e);
    }
  };

  const fetchPackingListData = async () => {
    setLoading(true);
    try {
      const url = isConsolidated 
        ? `/api/shipments/${id}/packing_list`
        : `/api/picking/packing_list/${id}`;

      const res = await fetch(url, {
        headers: {
          'Accept-Language': locale
        }
      });
      if (!res.ok) throw new Error("Error al obtener los datos de embalaje.");
      const json = await res.json();
      setData(json);
      if (isConsolidated) {
        setSelectedCarrier(json.carrier || '');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Retardo pequeño para dar estabilidad al navegador antes del print dialog
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (loading) return <div className="print-loading">{locale === 'pt' ? 'Gerando etiquetas de embalagem...' : 'Generando etiquetas de empaque...'}</div>;
  if (error) return <div className="print-error">Error: {error}</div>;
  if (!data) return <div className="print-loading">{locale === 'pt' ? 'Não foram encontrados dados dos volumes.' : 'No se encontraron datos de bultos.'}</div>;

  // Si es un despacho consolidado, iteramos sobre sus múltiples órdenes consolidadas.
  // Si es individual, creamos una estructura equivalente de orden única para compartir el renderizado del bucle.
  const orders = isConsolidated ? data.orders : [data];

  return (
    <div className="print-layout">
      {/* Barra de Control Superior - Se oculta en el Print físico */}
      <div className="no-print print-control-bar">
        <div className="control-inner">
          <div className="control-info">
            <h2>{isConsolidated ? `${t('printTitleConsolidated')} #${id}` : t('printTitle')}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('tableHeaderCarrier')}:</span>
              {isConsolidated ? (
                <strong style={{ fontSize: '0.75rem' }}>{data.carrier || 'No asignado'}</strong>
              ) : (
                <select
                  value={selectedCarrier}
                  onChange={(e) => setSelectedCarrier(e.target.value)}
                  style={{
                    height: '28px',
                    padding: '0 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    color: '#333',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">{locale === 'pt' ? 'Nenhuma (Direto)' : 'Ninguna (Directo)'}</option>
                  {carriersList.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="control-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              ✕ {t('printCloseBtn')}
            </button>
            <button onClick={handlePrint} className="btn btn-primary print-trigger-btn">
              🖨️ {t('printExecuteBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor Físico Imprimible */}
      <div className="print-pages-container">
        {orders.map((order, orderIdx) => {
          const packages = order.packages || {};
          const sortedKeys = Object.keys(packages).sort((a, b) => parseInt(a) - parseInt(b));

          if (sortedKeys.length === 0) {
            return (
              <div key={orderIdx} className="print-order-empty card">
                <h3>{t('orderLabel')}: {order.order_number}</h3>
                <p>{locale === 'pt' ? 'Este pedido de picking não possui volumes registrados para embalagem.' : 'Esta orden de picking no tiene bultos registrados para embalaje.'}</p>
              </div>
            );
          }

          return sortedKeys.map((pkgNum, pkgIdx) => {
            const items = packages[pkgNum] || [];
            
            // Determinar si debemos forzar salto de página tras este bulto
            const isLastOfAll = orderIdx === orders.length - 1 && pkgIdx === sortedKeys.length - 1;
            const style = isLastOfAll ? {} : { pageBreakAfter: 'always' };

            return (
              <div key={`${orderIdx}-${pkgNum}`} className="print-page print-pure-black" style={style}>
                {/* Cabecera del Packing List */}
                <div className="print-header">
                  <div className="header-top">
                    <h1>PACKING LIST</h1>
                    <div className="header-page-number">
                      PÁG {pkgIdx + 1} / {sortedKeys.length}
                    </div>
                  </div>
                  <div className="header-carrier-row">
                    <span className="header-carrier-lbl">{locale === 'pt' ? 'Transportadora' : 'Transportadora'}:</span>
                    <span className="header-carrier-val">{selectedCarrier || (locale === 'pt' ? 'Direto' : 'Directo')}</span>
                  </div>
                  <div className="header-meta">
                    <span>{t('tableHeaderDate')}: {order.timestamp || new Date().toISOString().split('T')[0]}</span>
                    {isConsolidated && <span>{t('printTitleConsolidated')}: <strong>#{id}</strong></span>}
                  </div>
                </div>

                {/* Resumen Comercial de la Orden */}
                <div className="print-meta-grid">
                  <div className="meta-block">
                    <span className="meta-lbl">{t('tableHeaderCustomer')}</span>
                    <span className="meta-val" style={{ maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {order.customer_code ? `[${order.customer_code}] ` : ''}
                      {order.customer_name}
                    </span>
                  </div>
                  <div className="meta-block" style={{ textAlign: 'right' }}>
                    <span className="meta-lbl" style={{ textAlign: 'right' }}>{t('orderLabel')} / {t('tableHeaderDespatch')}</span>
                    <span className="meta-val" style={{ textAlign: 'right' }}>{order.order_number} / {order.despatch_number}</span>
                  </div>
                </div>

                {/* Cabecera del Bulto */}
                {(() => {
                  const dims = order.packages_dimensions?.[pkgNum];
                  const hasDims = dims && (dims.length > 0 || dims.width > 0 || dims.height > 0 || dims.weight > 0);
                  return (
                    <div className="print-pkg-header">
                      <div className="pkg-title-group">
                        <h3>{t('expandedDetailTablePkg')} #{pkgNum}</h3>
                        <span className="pkg-total-lbl">{t('printLabelPackages')}: {order.total_packages}</span>
                        {hasDims && (
                          <span className="pkg-dims-lbl" style={{ fontSize: '0.85rem', color: '#111', marginTop: '6px', fontWeight: '500' }}>
                            {locale === 'pt' ? 'Medidas' : 'Dimensiones'}: <strong>{dims.length}x{dims.width}x{dims.height} cm</strong> | {locale === 'pt' ? 'Peso' : 'Peso'}: <strong>{dims.weight} kg</strong>
                          </span>
                        )}
                      </div>
                      <span className="pkg-tag-badge">BOX-{pkgNum.padStart(3, '0')}</span>
                    </div>
                  );
                })()}

                {/* Tabla de Artículos del Bulto */}
                <table className="print-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>{t('tableHeaderLine')}</th>
                      <th style={{ width: '120px' }}>{t('printTableItemsSku')}</th>
                      <th>{t('printTableItemsDesc')}</th>
                      <th className="text-right" style={{ width: '80px' }}>{t('assignTableHeaderTotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-4 italic">{locale === 'pt' ? 'Volume vazio' : 'Bulto vacío'}</td></tr>
                    ) : (
                      items.map((item, iIdx) => (
                        <tr key={iIdx}>
                          <td className="text-mono text-muted">{item.order_line}</td>
                          <td className="text-mono"><strong>{item.item_code}</strong></td>
                          <td className="sku-desc">{item.description}</td>
                          <td className="text-right text-mono font-medium">{item.quantity}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pie de Página de Firma / Autoría */}
                <div className="print-footer">
                  <div className="signature-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <span className="signature-line"></span>
                    <span className="signature-lbl">{locale === 'pt' ? 'Assinatura do Auditor' : 'Firma del Auditor'}</span>
                    {warehouseName && (
                      <span className="warehouse-lbl" style={{ fontSize: '0.7rem', color: '#111', fontWeight: 'bold', marginTop: '2px', textTransform: 'uppercase' }}>
                        {warehouseName}
                      </span>
                    )}
                  </div>

                  <div className="print-app-tag">
                    <span>SISTEMA LOGIX - WMS</span>
                    <p>{locale === 'pt' ? 'Auditoria de picking e verificação de embalagem aprovada.' : 'Auditoría de picking y verificación de empaque aprobada.'}</p>
                  </div>
                </div>
              </div>
            );
          });
        })}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .print-loading {
          padding: 3rem;
          text-align: center;
          font-size: 1.1rem;
          color: var(--text-muted);
        }

        .print-error {
          padding: 3rem;
          color: var(--danger);
          text-align: center;
          font-weight: 500;
        }

        .print-control-bar {
          background-color: white;
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: var(--shadow-sm);
        }

        .control-inner {
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .control-info h2 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--accent);
          margin-bottom: 0.15rem;
        }

        .control-info p {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .control-actions {
          display: flex;
          gap: 0.75rem;
        }

        .print-trigger-btn {
          box-shadow: 0 4px 10px rgba(40,95,148,0.25);
        }

        /* Formato de Páginas Físicas */
        .print-pages-container {
          max-width: 800px;
          margin: 2rem auto;
          padding: 0 1.5rem;
        }

        .print-page {
          background-color: white;
          border: 1px solid #ccc;
          border-radius: var(--radius-sm);
          padding: 3rem;
          box-shadow: var(--shadow-md);
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          min-height: 297mm; /* Proporción A4 */
        }

        .print-header {
          border-bottom: 2px solid #000;
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 0.25rem;
        }

        .header-top h1 {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #000;
        }

        .header-page-number {
          font-size: 0.85rem;
          font-weight: 700;
          color: #000;
          border: 1px solid #000;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }

        .header-carrier-row {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
          margin-top: 0.2rem;
          margin-bottom: 0.15rem;
        }

        .header-carrier-lbl {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #555;
        }

        .header-carrier-val {
          font-size: 0.85rem;
          font-weight: 700;
          color: #000;
          text-transform: uppercase;
        }

        .header-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: #555;
        }

        .print-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #ddd;
          padding-bottom: 1rem;
        }

        .meta-block {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .meta-lbl {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #666;
          font-weight: 600;
        }

        .meta-val {
          font-size: 0.95rem;
          font-weight: 700;
          color: #000;
        }

        .print-pkg-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #f8fafc;
          border: 1px solid #ddd;
          padding: 1rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1.5rem;
        }

        .pkg-title-group {
          display: flex;
          flex-direction: column;
        }

        .pkg-title-group h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #000;
        }

        .pkg-total-lbl {
          font-size: 0.75rem;
          color: #555;
        }

        .pkg-tag-badge {
          font-family: var(--font-mono);
          font-size: 0.9rem;
          font-weight: 700;
          border: 2px solid #000;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
        }

        .print-items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 3rem;
        }

        .print-items-table th {
          background-color: transparent !important;
          color: #000;
          border-bottom: 1.5px solid #000;
          padding: 0.5rem 0;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .print-items-table td {
          padding: 0.65rem 0;
          border-bottom: 1px solid #eee;
          font-size: 0.85rem;
        }

        .print-items-table tr:last-child td {
          border-bottom: none;
        }

        .print-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-top: 1px solid #ddd;
          padding-top: 2rem;
          gap: 1rem;
        }

        .signature-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          flex: 0 0 auto;
        }

        .signature-line {
          width: 160px;
          border-bottom: 1px solid #000;
        }

        .signature-lbl {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #666;
          font-weight: 600;
        }

        .carrier-footer-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          flex: 0 0 auto;
        }

        .carrier-footer-lbl {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #666;
          font-weight: 600;
        }

        .carrier-footer-val {
          font-size: 0.9rem;
          font-weight: 700;
          color: #000;
          text-transform: uppercase;
        }

        .print-app-tag {
          text-align: right;
          flex: 0 0 auto;
        }

        .print-app-tag span {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .print-app-tag p {
          font-size: 0.65rem;
          color: #666;
        }

        /* AJUSTES FÍSICOS DE IMPRESIÓN */
        @page {
          size: auto;
          margin: 0mm; /* Desactiva cabeceras y pies de página nativos del navegador (URLs, ruta, fecha) */
        }

        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            background-color: white !important;
          }

          .print-pages-container {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          .print-page {
            border: none !important;
            box-shadow: none !important;
            padding: 15mm 20mm !important; /* Mantiene márgenes profesionales para el contenido dentro de la hoja */
            margin: 0 !important;
            min-height: 0 !important;
            page-break-after: always;
          }

          .print-pkg-header {
            background-color: transparent !important;
            border-color: #000 !important;
          }
          
          .print-items-table th {
            border-bottom: 1.5pt solid #000 !important;
          }
          
          .print-items-table td {
            border-bottom: 0.5pt solid #ccc !important;
          }
        }
      `}} />
    </div>
  );
};

export default PackingListPrint;
