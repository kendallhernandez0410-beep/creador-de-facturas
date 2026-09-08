// Servicio para lectura y guardado directo en el archivo físico db.json

const API_VITE = '/api/invoices';
const API_JSON_SERVER = 'http://localhost:5000/invoices';
const STORAGE_KEY = 'autofix_invoices_db';

import initialDb from '../../db.json';

export const invoiceService = {
  // Obtener facturas desde db.json
  async getAll() {
    // 1. Intentar API local de Vite conectada directamente a db.json
    try {
      const res = await fetch(API_VITE);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      // Ignorar e intentar siguiente fuente
    }


    try {
      const res = await fetch(API_JSON_SERVER, { signal: AbortSignal.timeout(600) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      // JSON-Server no activo
    }

    // 3. Fallback a caché local o initialDb
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}

    const defaultInvoices = initialDb.invoices || [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultInvoices));
    return defaultInvoices;
  },

  // Obtener una factura por ID interno o número visible directamente desde db.json
  async getById(reference) {
    const normalizedReference = String(reference).trim().toLowerCase();
    const encodedId = encodeURIComponent(reference);

    try {
      const res = await fetch(`${API_VITE}/${encodedId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      // Intentar la fuente secundaria
    }

    try {
      const res = await fetch(`${API_JSON_SERVER}/${encodedId}`, {
        signal: AbortSignal.timeout(600),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      // JSON-Server no activo
    }

    const matchesReference = (invoice) =>
      String(invoice.id).trim().toLowerCase() === normalizedReference ||
      String(invoice.number).trim().toLowerCase() === normalizedReference;

    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const cachedInvoice = cached.find(matchesReference);
      if (cachedInvoice) {
        return cachedInvoice;
      }
    } catch (err) {}

    const initialInvoice = (initialDb.invoices || []).find(matchesReference);
    if (initialInvoice) {
      return initialInvoice;
    }

    const allInvoices = await this.getAll();
    return allInvoices.find(matchesReference) || null;
  },

  // Guardar nueva factura directamente en db.json
  async create(invoice) {
    let saved = false;

    // 1. Guardar en db.json a través del endpoint de Vite en tiempo real
    try {
      const res = await fetch(API_VITE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      });
      if (res.ok) {
        saved = true;
      }
    } catch (err) {
      console.warn('Aviso: endpoint /api/invoices no respondió, intentando canales secundarios.');
    }

    // 2. Si json-server está corriendo, sincronizarlo también
    try {
      await fetch(API_JSON_SERVER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
        signal: AbortSignal.timeout(600),
      });
    } catch (err) {}

    // 3. Mantener copia en localStorage
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = [invoice, ...cached.filter((inv) => String(inv.id) !== String(invoice.id))];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}

    return invoice;
  },

  // Eliminar factura de db.json
  async delete(id) {
    try {
      await fetch(`${API_VITE}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (err) {}

    try {
      await fetch(`${API_JSON_SERVER}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(600),
      });
    } catch (err) {}

    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const filtered = cached.filter((item) => String(item.id) !== String(id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {}
  },
};
