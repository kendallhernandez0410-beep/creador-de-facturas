import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import InvoiceListPage from '../pages/InvoiceListPage.jsx';
import InvoiceFormPage from '../pages/InvoiceFormPage.jsx';
import InvoiceViewPage from '../pages/InvoiceViewPage.jsx';

export default function AppRoutes({ invoices, setInvoices }) {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors">
        <Navbar />
        
        <main className="flex-1 w-full pb-12">
          <Routes>
            <Route
              path="/"
              element={<InvoiceListPage invoices={invoices} setInvoices={setInvoices} />}
            />
            <Route
              path="/create"
              element={<InvoiceFormPage setInvoices={setInvoices} />}
            />
            <Route
              path="/invoice/:id"
              element={<InvoiceViewPage invoices={invoices} />}
            />
            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
