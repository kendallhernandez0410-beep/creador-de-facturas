import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Invoice from '../components/Invoice.jsx';
import { invoiceService } from '../services/invoiceService.js';

export default function InvoiceViewPage({ invoices }) {
  const { id } = useParams();
  const [foundInvoice, setFoundInvoice] = useState(() =>
    invoices.find((invoice) => String(invoice.id) === String(id)),
  );

  useEffect(() => {
    let isMounted = true;

    invoiceService.getById(id).then((invoice) => {
      if (isMounted) {
        setFoundInvoice(invoice);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return <Invoice invoice={foundInvoice} />;
}
