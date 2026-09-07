// Cálculo de totales según fórmula tributaria (IVA 13% Costa Rica)
export function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
  
  const iva = Math.round(subtotal * 0.13 * 100) / 100;
  const total = Math.round((subtotal + iva) * 100) / 100;
  
  return { subtotal, iva, total };
}

// Formateador estándar de moneda en Colones costarricenses (₡)
export function formatCRC(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
