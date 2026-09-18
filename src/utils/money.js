export function formatPrice(cents, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// Thermal ESC/POS printers are more reliable with ASCII text than with €.
export function formatReceiptPrice(cents, currency = 'EUR') {
  return `${(cents / 100).toFixed(2).replace('.', ',')} ${currency}`;
}
