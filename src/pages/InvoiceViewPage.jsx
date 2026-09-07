import React from 'react';
import { useParams } from 'react-router-dom';
import Invoice from '../components/Invoice.jsx';

export default function InvoiceViewPage({ invoices }) {
  const { id } = useParams();
  const foundInvoice = invoices.find((inv) => String(inv.id) === String(id));

  return <Invoice invoice={foundInvoice} />;
}
