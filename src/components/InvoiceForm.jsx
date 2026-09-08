import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateTotals, formatCRC } from '../utils.js';
import { invoiceService } from '../services/invoiceService.js';

export default function InvoiceForm({ setInvoices }) {
  const navigate = useNavigate();

  // Estados del formulario con useState (Requerimiento estricto)
  const [issuerName, setIssuerName] = useState('AutoFix Express S.A.');
  const [issuerId, setIssuerId] = useState('3-101-789456');
  
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  
  const [invoiceNumber, setInvoiceNumber] = useState(() => `FAC-00${Math.floor(3 + Math.random() * 9)}`);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Lista dinámica de ítems con useState en Colones (₡)
  const [items, setItems] = useState([
    { description: 'Cambio de Aceite Sintético 5W-30 y Filtro', quantity: 1, unitPrice: 32000 },
    { description: 'Alineación y Balanceo Computarizado', quantity: 1, unitPrice: 25000 }
  ]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejador de cambios por fila
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === 'description' ? value : value;
    setItems(updated);
  };

  // Agregar fila interactiva
  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  // Eliminar fila interactiva
  const removeItem = (index) => {
    if (items.length <= 1) {
      alert('La factura debe tener como mínimo una línea de detalle.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Previsualización de totales en vivo
  const previewTotals = calculateTotals(items);

  // Validación básica requerida
  const validate = () => {
    const newErrors = {};

    if (!issuerName.trim()) newErrors.issuerName = 'Nombre del emisor obligatorio.';
    if (!issuerId.trim()) newErrors.issuerId = 'Cédula o ID fiscal obligatorio.';
    if (!clientName.trim()) newErrors.clientName = 'Nombre del cliente obligatorio.';
    if (!clientEmail.trim()) newErrors.clientEmail = 'Correo de facturación obligatorio.';
    if (!invoiceNumber.trim()) newErrors.invoiceNumber = 'Número consecutivo obligatorio.';
    if (!invoiceDate) newErrors.invoiceDate = 'Fecha de emisión obligatoria.';

    if (items.length === 0) {
      newErrors.generalItems = 'Debe incluir al menos un ítem.';
    }

    items.forEach((item, idx) => {
      if (!item.description.trim()) {
        newErrors[`desc_${idx}`] = 'Descripción requerida.';
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        newErrors[`qty_${idx}`] = 'Cantidad debe ser > 0.';
      }
      const price = Number(item.unitPrice);
      if (isNaN(price) || price <= 0) {
        newErrors[`price_${idx}`] = 'Precio debe ser > 0 en Colones.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardado en db.json y estado
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const calculatedTotals = calculateTotals(items);
    const newInvoice = {
      id: `fac-${Date.now()}`,
      number: invoiceNumber.trim(),
      date: invoiceDate,
      currency: 'CRC',
      currencySymbol: '₡',
      issuer: {
        name: issuerName.trim(),
        id: issuerId.trim(),
        phone: '(506) 2250-0000',
        email: 'facturacion@autofix.cr',
        address: 'San José, Paseo Colón, Costa Rica'
      },
      client: {
        name: clientName.trim(),
        email: clientEmail.trim(),
        address: clientAddress.trim()
      },
      items: items.map((it) => ({
        description: it.description.trim(),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice)
      })),
      totals: calculatedTotals
    };

    // Guardar mediante invoiceService (sincroniza con db.json / json-server y caché)
    await invoiceService.create(newInvoice);

    if (setInvoices) {
      setInvoices((prev) => [newInvoice, ...prev]);
    }

    setIsSubmitting(false);
    navigate(`/invoice/${newInvoice.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto my-8 px-4 font-sans text-slate-800">
      <div className="mb-6 border-b border-slate-200 pb-3 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold font-serif text-slate-950 uppercase tracking-wide">
            Emisión de Factura Electrónica (Colones ₡)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro con almacenamiento directo en base de datos (Moneda: CRC ₡).
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-950"
        >
          ← Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border-2 border-slate-800 rounded-sm shadow-sm p-8 space-y-7">
        
        {/* Sección 1: Emisor */}
        <fieldset className="border border-slate-300 p-4 rounded-xs">
          <legend className="px-2 text-xs font-bold uppercase tracking-widest text-slate-800 font-mono">
            1. Identificación del Emisor
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Razón Social *
              </label>
              <input
                type="text"
                value={issuerName}
                onChange={(e) => setIssuerName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xs text-xs text-slate-900 focus:outline-none focus:border-slate-800 ${
                  errors.issuerName ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
              {errors.issuerName && <p className="text-red-600 text-[11px] mt-1">{errors.issuerName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Cédula Jurídica / ID Fiscal *
              </label>
              <input
                type="text"
                value={issuerId}
                onChange={(e) => setIssuerId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xs text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-800 ${
                  errors.issuerId ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
              {errors.issuerId && <p className="text-red-600 text-[11px] mt-1">{errors.issuerId}</p>}
            </div>
          </div>
        </fieldset>

        {/* Sección 2: Receptor / Cliente */}
        <fieldset className="border border-slate-300 p-4 rounded-xs">
          <legend className="px-2 text-xs font-bold uppercase tracking-widest text-slate-800 font-mono">
            2. Información del Receptor (Cliente)
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className={`w-full px-3 py-2 border rounded-xs text-xs text-slate-900 focus:outline-none focus:border-slate-800 ${
                  errors.clientName ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
              {errors.clientName && <p className="text-red-600 text-[11px] mt-1">{errors.clientName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="juan.perez@email.com"
                className={`w-full px-3 py-2 border rounded-xs text-xs text-slate-900 focus:outline-none focus:border-slate-800 ${
                  errors.clientEmail ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
              {errors.clientEmail && <p className="text-red-600 text-[11px] mt-1">{errors.clientEmail}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Dirección / Provincia
              </label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="San José, Costa Rica"
                className="w-full px-3 py-2 border border-slate-300 rounded-xs text-xs text-slate-900 focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>
        </fieldset>

        {/* Sección 3: Parámetros del Comprobante */}
        <fieldset className="border border-slate-300 p-4 rounded-xs">
          <legend className="px-2 text-xs font-bold uppercase tracking-widest text-slate-800 font-mono">
            3. Datos de Emisión y Moneda
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Número Consecutivo *
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xs text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-800 ${
                  errors.invoiceNumber ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
              {errors.invoiceNumber && <p className="text-red-600 text-[11px] mt-1">{errors.invoiceNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Fecha de Emisión *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xs text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800 ${
                  errors.invoiceDate ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
              {errors.invoiceDate && <p className="text-red-600 text-[11px] mt-1">{errors.invoiceDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Moneda Oficial
              </label>
              <div className="w-full px-3 py-2 border border-slate-300 rounded-xs text-xs font-mono font-bold bg-slate-100 text-slate-900">
                CRC (₡) - Colones
              </div>
            </div>
          </div>
        </fieldset>

        {/* Sección 4: Ítems Dinámicos en Colones */}
        <fieldset className="border border-slate-300 p-4 rounded-xs">
          <div className="flex justify-between items-center mb-3">
            <legend className="px-2 text-xs font-bold uppercase tracking-widest text-slate-800 font-mono">
              4. Detalle de Repuestos y Servicios Mecánicos
            </legend>
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xs transition"
            >
              + Añadir Línea
            </button>
          </div>

          <div className="space-y-2 mt-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xs border border-slate-200 bg-slate-50 grid grid-cols-1 md:grid-cols-12 gap-3 items-end text-xs"
              >
                <div className="md:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Descripción del Trabajo / Repuesto *
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    placeholder="Ej: Cambio de frenos, líquido, etc."
                    className={`w-full px-2.5 py-1.5 border rounded-xs text-xs bg-white text-slate-900 focus:outline-none focus:border-slate-800 ${
                      errors[`desc_${idx}`] ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                    }`}
                  />
                  {errors[`desc_${idx}`] && <p className="text-red-600 text-[10px] mt-0.5">{errors[`desc_${idx}`]}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-xs text-xs font-mono text-center bg-white text-slate-900 focus:outline-none focus:border-slate-800 ${
                      errors[`qty_${idx}`] ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                    }`}
                  />
                  {errors[`qty_${idx}`] && <p className="text-red-600 text-[10px] mt-0.5">{errors[`qty_${idx}`]}</p>}
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Precio Unitario (₡ Colones) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    placeholder="25000"
                    className={`w-full px-2.5 py-1.5 border rounded-xs text-xs font-mono text-right bg-white text-slate-900 focus:outline-none focus:border-slate-800 ${
                      errors[`price_${idx}`] ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                    }`}
                  />
                  {errors[`price_${idx}`] && <p className="text-red-600 text-[10px] mt-0.5">{errors[`price_${idx}`]}</p>}
                </div>

                <div className="md:col-span-1 flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    title="Eliminar fila"
                    className="text-slate-400 hover:text-red-700 font-bold p-1 text-sm transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        {/* Liquidación en Colones en Tiempo Real */}
        <div className="bg-slate-900 text-white rounded-xs p-5 flex flex-col md:flex-row justify-between items-center text-xs">
          <div className="text-slate-300 mb-3 md:mb-0">
            <span className="font-mono font-bold uppercase block text-[10px] text-emerald-400">
              Cálculo Automático de IVA (13% Costa Rica):
            </span>
            <span className="text-[11px]">Todos los valores se almacenan en la base de datos local.</span>
          </div>

          <div className="flex items-center gap-6 font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Subtotal:</span>
              <span className="font-bold text-white text-sm">{formatCRC(previewTotals.subtotal)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">IVA (13%):</span>
              <span className="font-bold text-white text-sm">{formatCRC(previewTotals.iva)}</span>
            </div>
            <div className="border-l border-slate-700 pl-5">
              <span className="text-emerald-400 font-bold text-[10px] block uppercase">Total a Liquidar:</span>
              <span className="font-black text-emerald-400 text-lg">{formatCRC(previewTotals.total)}</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xs text-xs font-semibold uppercase tracking-wider transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xs text-xs font-bold uppercase tracking-widest transition shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Emitir y Guardar Factura'}
          </button>
        </div>
      </form>
    </div>
  );
}
