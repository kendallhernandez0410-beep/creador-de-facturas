import React, { useState, useEffect } from 'react';
import AppRoutes from './routes/AppRoutes.jsx';
import { invoiceService } from './services/invoiceService.js';
import initialDb from '../db.json';

export default function App() {
  // Estado principal inicializado con la estructura formal de db.json
  const [invoices, setInvoices] = useState(() => {
    try {
      const cached = localStorage.getItem('autofix_invoices_db');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error inicializando estado:', e);
    }
    return initialDb.invoices || [];
  });

  // Cargar de db.json / json-server al montar
  useEffect(() => {
    let isMounted = true;
    invoiceService.getAll().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setInvoices(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return <AppRoutes invoices={invoices} setInvoices={setInvoices} />;
}
