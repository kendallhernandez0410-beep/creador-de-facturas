import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCRC } from '../utils.js';
import { invoiceService } from '../services/invoiceService.js';

export default function InvoiceList({ invoices, setInvoices }) {
  const navigate = useNavigate();
  const [emailNotification, setEmailNotification] = useState('');
  const [invoiceReference, setInvoiceReference] = useState('');
  const [visibleInvoices, setVisibleInvoices] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const invoicesToDisplay = visibleInvoices ?? invoices;

  const handleSearch = async (e) => {
    e.preventDefault();
    const reference = invoiceReference.trim();

    if (!reference) {
      setSearchError('Ingrese el ID o número de factura.');
      setVisibleInvoices([]);
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const invoice = await invoiceService.getById(reference);
      if (invoice) {
        setVisibleInvoices([invoice]);
      } else {
        setVisibleInvoices([]);
        setSearchError(`No se encontró una factura con el ID o número "${reference}".`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setInvoiceReference('');
    setVisibleInvoices(null);
    setSearchError('');
  };

  const handleDelete = async (e, id, number) => {
    e.stopPropagation();
    if (window.confirm(`¿Confirma anular y eliminar la factura #${number} de la base de datos?`)) {
      await invoiceService.delete(id);
      if (setInvoices) {
        setInvoices((prev) => prev.filter((inv) => String(inv.id) !== String(id)));
      }
    }
  };

  const handleQuickEmail = (e, invoice) => {
    e.stopPropagation();
    const recipient = invoice.client?.email || '';
    if (!recipient) {
      alert(`El cliente ${invoice.client?.name} no tiene correo registrado.`);
      navigate(`/invoice/${invoice.id}`);
      return;
    }

    const totalStr = formatCRC(invoice.totals?.total ?? 0);
    const subject = `Factura Electrónica #${invoice.number} - AutoFix Express S.A.`;
    const body = `Estimado(a) ${invoice.client?.name}:

Adjuntamos notificación oficial de su Factura Electrónica #${invoice.number} emitida en Colones (₡).
Fecha: ${invoice.date}
Monto Total: ${totalStr} CRC (incluye 13% IVA).

Atentamente,
AutoFix Express S.A.`;

    const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');

    setEmailNotification(`Cliente de correo abierto para comprobante #${invoice.number} (${recipient})`);
    setTimeout(() => setEmailNotification(''), 4000);
  };

  // Estado vacío formal
  if (!invoices || invoices.length === 0) {
    return (
      <div className="max-w-5xl mx-auto my-12 px-4">
        <div className="bg-white border-2 border-slate-800 rounded-sm shadow-sm p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 border border-slate-300 rounded flex items-center justify-center bg-slate-100 text-slate-800 font-mono text-xl font-bold">
            CR
          </div>
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
            No hay facturas registradas en la base de datos
          </h2>
          <p className="text-slate-500 max-w-md mx-auto mt-2 mb-6 text-xs">
            No hay comprobantes electrónicos activos registrados.
          </p>
          <Link
            to="/create"
            className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider rounded transition"
          >
            + Emitir Primera Factura
          </Link>
        </div>
      </div>
    );
  }

  const totalFacturado = invoicesToDisplay.reduce((sum, inv) => sum + (inv.totals?.total || 0), 0);
  const totalIva = invoicesToDisplay.reduce((sum, inv) => sum + (inv.totals?.iva || 0), 0);
  const promedioFactura = totalFacturado / invoicesToDisplay.length;

  return (
    <div className="max-w-6xl mx-auto my-8 px-4 space-y-6 font-sans">
      
      {/* Notificación de envío */}
      {emailNotification && (
        <div className="p-3 bg-slate-900 text-white text-xs font-mono rounded flex justify-between items-center shadow">
          <span>✓ {emailNotification}</span>
          <button onClick={() => setEmailNotification('')} className="text-slate-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* Título de Sección y Botón de Emisión */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-serif text-slate-950 uppercase tracking-wide">
              Registro de Facturas Electrónicas
            </h1>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold rounded-xs">
              SISTEMA ACTIVO
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprobantes de servicios mecánicos y repuestos en Colones Costarricenses (₡ CRC).
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xs transition shadow-xs"
        >
          + Emitir Factura
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
        <label className="flex-1 text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Buscar factura por ID o número
          <input
            value={invoiceReference}
            onChange={(e) => setInvoiceReference(e.target.value)}
            placeholder="Ejemplo: FAC-003 o fac-002"
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xs text-sm font-mono font-normal normal-case tracking-normal focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </label>
        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold uppercase tracking-wider rounded-xs transition"
        >
          {isSearching ? 'Buscando...' : 'Buscar'}
        </button>
        {visibleInvoices !== null && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold uppercase tracking-wider rounded-xs transition"
          >
            Ver todas
          </button>
        )}
      </form>

      {searchError && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xs">
          {searchError}
        </p>
      )}

      {/* Indicadores Financieros en Colones (₡) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xs border-2 border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Comprobantes</span>
          <p className="text-xl font-mono font-bold text-slate-900 mt-1">{invoicesToDisplay.length} docs</p>
        </div>
        <div className="bg-white p-4 rounded-xs border border-slate-300 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">IVA 13% Recaudado (₡)</span>
          <p className="text-lg font-mono font-bold text-slate-700 mt-1">{formatCRC(totalIva)}</p>
        </div>
        <div className="bg-white p-4 rounded-xs border border-slate-300 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Liquidado (₡)</span>
          <p className="text-lg font-mono font-bold text-emerald-800 mt-1">{formatCRC(totalFacturado)}</p>
        </div>
        <div className="bg-white p-4 rounded-xs border border-slate-300 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Promedio x Operación (₡)</span>
          <p className="text-lg font-mono font-bold text-slate-800 mt-1">{formatCRC(promedioFactura)}</p>
        </div>
      </div>

      {/* Tabla Oficial de Facturas */}
      <div className="bg-white border-2 border-slate-800 rounded-xs shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 border-r border-slate-700">Consecutivo</th>
                <th className="py-3 px-4 border-r border-slate-700">Cliente / Receptor</th>
                <th className="py-3 px-4 border-r border-slate-700">Fecha Emisión</th>
                <th className="py-3 px-4 border-r border-slate-700 text-center">Estado Tributario</th>
                <th className="py-3 px-4 border-r border-slate-700 text-right">Total en Colones (₡)</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoicesToDisplay.map((invoice) => {
                const totalAmount = invoice.totals?.total ?? 0;
                return (
                  <tr
                    key={invoice.id}
                    onClick={() => navigate(`/invoice/${invoice.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 border-r border-slate-200 font-mono font-bold text-slate-950">
                      {invoice.number}
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200">
                      <div className="font-semibold text-slate-950">{invoice.client?.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{invoice.client?.email || 'Sin correo'}</div>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200 text-slate-700 font-mono">
                      {invoice.date}
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200 text-center">
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase tracking-wide rounded-xs">
                        Aceptada DGT
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200 text-right font-mono font-bold text-slate-950 text-sm">
                      {formatCRC(totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/invoice/${invoice.id}`}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xs text-[11px] font-semibold transition uppercase tracking-wider"
                        >
                          Ver
                        </Link>
                        
                        <button
                          type="button"
                          onClick={(e) => handleQuickEmail(e, invoice)}
                          title="Enviar factura por correo electrónico"
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xs text-[11px] font-semibold transition uppercase tracking-wider flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Correo
                        </button>

                        {setInvoices && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, invoice.id, invoice.number)}
                            title="Eliminar factura"
                            className="p-1 text-slate-400 hover:text-red-700 rounded-xs transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
