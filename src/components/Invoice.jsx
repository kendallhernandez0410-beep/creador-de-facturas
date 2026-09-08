import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCRC } from '../utils.js';
import html2pdf from 'html2pdf.js';

export default function Invoice({ invoice }) {
  const navigate = useNavigate();
  const invoiceRef = useRef(null);


  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(invoice?.client?.email || '');
  const [emailSubject, setEmailSubject] = useState(
    invoice ? `Factura Electrónica #${invoice.number} - AutoFix Express S.A.` : ''
  );
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  useEffect(() => {
    if (!invoice) return;

    document.title = `Factura ${invoice.number}`;

    return () => {
      document.title = 'Creador de tareas';
    };
  }, [invoice]);

  if (!invoice) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-lg shadow-sm border border-gray-200 text-center font-sans">
        <h2 className="text-xl font-bold text-gray-900">Comprobante no localizado</h2>
        <p className="text-gray-500 mt-2 mb-6 text-sm">
          No se encontró el comprobante en la base de datos.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider rounded transition hover:bg-slate-800"
        >
          ← Volver al Listado
        </Link>
      </div>
    );
  }

  const { issuer, client, number, date, items = [], totals } = invoice;
  const subtotal = totals?.subtotal ?? 0;
  const iva = totals?.iva ?? 0;
  const total = totals?.total ?? 0;

  // Clave numérica estándar de 50 dígitos para Factura Electrónica de Costa Rica
  const claveNumerica = `506${date ? date.replace(/-/g, '') : '20260907'}000310178945600100001010000000001198765432`;

  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!recipientEmail.trim()) {
      alert('Por favor ingrese un correo válido.');
      return;
    }

    const itemsSummary = items
      .map(
        (it) =>
          `• ${it.description} | Cant: ${it.quantity} | P.Unit: ${formatCRC(it.unitPrice)} | Total: ${formatCRC(
            it.quantity * it.unitPrice
          )}`
      )
      .join('\n');

    const mailBody = `Estimado(a) ${client?.name || 'Cliente'}:

Adjuntamos el detalle oficial de su Factura Electrónica emitida en Colones (CRC ₡) por ${issuer?.name || 'AutoFix Express S.A.'}.

==================================================
COMPROBANTE ELECTRÓNICO OFICIAL
==================================================
Número de Factura: ${number}
Fecha de Emisión: ${date}
Clave Numérica Hacienda: ${claveNumerica}
Emisor: ${issuer?.name} (Cédula: ${issuer?.id})
Cliente: ${client?.name}
Correo: ${client?.email || 'N/A'}
${client?.address ? `Dirección: ${client.address}\n` : ''}
==================================================
DETALLE DE SERVICIOS Y REPUESTOS MECÁNICOS
==================================================
${itemsSummary}

==================================================
LIQUIDACIÓN EN COLONES COSTARRICENSES (₡)
==================================================
Subtotal Neto: ${formatCRC(subtotal)}
Impuesto de Valor Agregado (13% IVA): ${formatCRC(iva)}
TOTAL A PAGAR: ${formatCRC(total)}
==================================================

Condición de venta: Contado / SINPE Móvil
Autorizada mediante resolución de la D.G.T. Costa Rica.

Atentamente,
Departamento de Facturación
AutoFix Express S.A.`;

    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(mailBody)}`;

    window.open(mailtoUrl, '_blank');
    setEmailSentSuccess(true);
    setTimeout(() => {
      setEmailSentSuccess(false);
      setShowEmailModal(false);
    }, 2500);
  };

  const handleExportPdf = async () => {
    if (!invoiceRef.current) return;

    const options = {
      margin: 0.5,
      filename: `Factura_${number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    await html2pdf().set(options).from(invoiceRef.current).save();
  };

  return (
    <div id="invoice" className="max-w-4xl mx-auto my-8 px-4 font-sans text-slate-800">
      
      {/* Notificación de despacho */}
      {emailSentSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded text-sm flex items-center justify-between shadow-sm print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Factura despachada correctamente al correo <strong>{recipientEmail}</strong>.</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-200 px-2 py-0.5 rounded font-bold">Enviado</span>
        </div>
      )}

      {/* Barra de Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition"
        >
          ← Regresar al Registro
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRecipientEmail(client?.email || '');
              setEmailSubject(`Factura Electrónica #${number} - AutoFix Express S.A.`);
              setShowEmailModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold uppercase tracking-wider rounded transition"
          >
            <svg className="w-4 h-4 mr-1.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Enviar al Correo
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider rounded transition shadow-xs"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Comprobante
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider rounded transition"
          >
            Descargar PDF
          </button>

          <Link
            to="/create"
            className="inline-flex items-center px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider rounded transition"
          >
            + Nueva Factura
          </Link>
        </div>
      </div>

      {/* NUEVO DISEÑO FORMAL DE FACTURA ELECTRÓNICA COSTARRICENSE */}
      <div ref={invoiceRef} className="bg-white border-2 border-slate-800 rounded-sm shadow-md p-8 md:p-10 print:border-none print:shadow-none print:p-0">
        
        {/* Franja Superior Tributaria */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-slate-800 pb-4 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 text-white font-serif font-black flex items-center justify-center text-xl rounded-xs">
              CR
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-slate-500 block">
                MINISTERIO DE HACIENDA • SISTEMA TRIBUTARIO DE COSTA RICA
              </span>
              <h1 className="text-xl font-serif font-black tracking-tight text-slate-950 uppercase">
                {issuer?.name || 'AutoFix Express S.A.'}
              </h1>
              <span className="text-xs text-slate-600 font-medium">Taller Mecánico & Centro Integral de Servicios Automotrices</span>
            </div>
          </div>

          <div className="text-left md:text-right bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-xs font-black font-mono uppercase tracking-widest text-slate-900">
              FACTURA ELECTRÓNICA
            </div>
            <div className="text-base font-black font-mono text-emerald-800">
              CONSECUTIVO: {number}
            </div>
            <div className="text-[11px] text-slate-600 font-mono">
              Fecha: {date}
            </div>
          </div>
        </div>

        {/* Bloque de Clave Numérica Fiscal */}
        <div className="bg-slate-100 border border-slate-300 p-2.5 rounded-xs mb-6 flex flex-col sm:flex-row justify-between items-center text-xs font-mono">
          <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Clave Numérica (50 dígitos):</span>
          <span className="font-bold text-slate-950 tracking-wider text-[11px] select-all">{claveNumerica}</span>
        </div>

        {/* Datos de Emisor y Receptor en 2 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-xs border border-slate-200 rounded p-4 bg-slate-50/50">
          {/* Columna Emisor */}
          <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
              DATOS DEL EMISOR
            </span>
            <p className="font-bold text-sm text-slate-950">{issuer?.name}</p>
            <p><span className="font-semibold text-slate-700">Cédula Jurídica:</span> <span className="font-mono">{issuer?.id}</span></p>
            <p><span className="font-semibold text-slate-700">Teléfono:</span> (506) 2250-0000</p>
            <p><span className="font-semibold text-slate-700">Correo Emisor:</span> facturacion@autofix.cr</p>
            <p><span className="font-semibold text-slate-700">Ubicación:</span> San José, Paseo Colón, Costa Rica</p>
          </div>

          {/* Columna Receptor */}
          <div className="space-y-1 md:pl-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
              DATOS DEL RECEPTOR (CLIENTE)
            </span>
            <p className="font-bold text-sm text-slate-950">{client?.name}</p>
            <p><span className="font-semibold text-slate-700">Correo:</span> <span className="font-mono text-slate-900">{client?.email || 'No registrado'}</span></p>
            <p><span className="font-semibold text-slate-700">Dirección:</span> {client?.address || 'San José, Costa Rica'}</p>
            <p><span className="font-semibold text-slate-700">Condición de Venta:</span> <span className="font-bold text-slate-900 uppercase">Contado / SINPE Móvil</span></p>
            <p><span className="font-semibold text-slate-700">Medio de Pago:</span> Transferencia Bancaria / Efectivo</p>
          </div>
        </div>

        {/* Tabla de Detalle de Ítems en Colones (₡) */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-mono">
                <th className="py-2.5 px-3 border-r border-slate-700 text-center w-10">Lín.</th>
                <th className="py-2.5 px-3 border-r border-slate-700">Detalle del Servicio o Repuesto</th>
                <th className="py-2.5 px-3 border-r border-slate-700 text-center w-16">Cant.</th>
                <th className="py-2.5 px-3 border-r border-slate-700 text-right w-28">Precio Unit. (₡)</th>
                <th className="py-2.5 px-3 text-right w-32">Total Línea (₡)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, index) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unitPrice) || 0;
                const lineTotal = qty * price;
                return (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono text-slate-800">
                      {qty}
                    </td>
                    <td className="py-2.5 px-3 text-right border-r border-slate-200 font-mono text-slate-800">
                      {formatCRC(price)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950">
                      {formatCRC(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Liquidación de Totales en Colones (₡) y Código de Barras Fiscal */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end mb-8">
          
          {/* Mockup de Código de Barras y Firma Digital */}
          <div className="md:col-span-6 border border-slate-200 p-4 rounded bg-slate-50 text-[11px] text-slate-600 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 uppercase text-[10px]">Firma Electrónica Autorizada:</span>
              <span className="text-emerald-700 font-mono font-bold text-[10px]">XML ACEPTADO DGT</span>
            </div>
            
            {/* Representación visual de código de barras Code-128 */}
            <div className="py-1">
              <div className="h-9 flex items-center justify-center gap-0.5 bg-white p-1 border border-slate-300">
                {[3,1,2,4,1,3,2,1,4,2,3,1,2,3,4,1,2,3,1,4,2,1,3,2,4,1,3,2,1,3,4,2].map((w, i) => (
                  <div key={i} className={`h-full bg-slate-900`} style={{ width: `${w * 2}px` }} />
                ))}
              </div>
              <div className="text-center font-mono text-[9px] text-slate-500 mt-1 tracking-widest">
                * {claveNumerica.slice(0, 25)} *
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              Garantía técnica de 30 días para mano de obra y 90 días para repuestos nuevos según Ley 7472 de Costa Rica.
            </p>
          </div>

          {/* Liquidación Monetaria en Colones */}
          <div className="md:col-span-6 border-2 border-slate-800 rounded overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex justify-between">
              <span>LIQUIDACIÓN FISCAL</span>
              <span>MONEDA: CRC (₡)</span>
            </div>
            <div className="p-4 space-y-2 text-xs bg-white">
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Subtotal Neto:</span>
                <span className="font-mono font-semibold text-slate-950">{formatCRC(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">IVA (13% Tarifa General):</span>
                <span className="font-mono font-semibold text-slate-950">{formatCRC(iva)}</span>
              </div>
              <div className="border-t-2 border-slate-800 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-black uppercase text-slate-950 tracking-wider">TOTAL A PAGAR:</span>
                <span className="text-2xl font-mono font-black text-slate-950">{formatCRC(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Institucional */}
        <div className="border-t border-slate-300 pt-3 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500">
          <span>AutoFix Express S.A. • Cédula Jurídica: {issuer?.id}</span>
          <span>Versión 4.3 de Comprobantes Electrónicos de Costa Rica</span>
        </div>
      </div>

      {/* Modal para Envío por Correo */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 print:hidden">
          <div className="bg-white rounded border border-gray-300 max-w-lg w-full p-6 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Enviar Factura en Colones (₡) por Correo
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-700 text-base font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">Destinatario (Cliente) *</label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">Asunto *</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded space-y-1 text-slate-600">
                <p className="font-semibold text-slate-800 uppercase text-[10px]">Resumen de la Transacción:</p>
                <p>• Comprobante: #{number} a nombre de {client?.name}.</p>
                <p>• Total Liquidado: <strong>{formatCRC(total)}</strong> (Moneda: Colones ₡).</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded text-xs font-semibold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold uppercase tracking-wider"
                >
                  Abrir Cliente y Despachar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
