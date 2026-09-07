import React from 'react';
import InvoiceList from '../components/InvoiceList.jsx';

export default function InvoiceListPage({ invoices, setInvoices }) {
  return <InvoiceList invoices={invoices} setInvoices={setInvoices} />;
}
