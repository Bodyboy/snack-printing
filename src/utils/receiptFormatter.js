// src/utils/receiptFormatter.js
//
// Turns a cart (list of { name, qty, price }) into the neutral
// "print steps" list consumed by PrinterService.sendToPrinter().
// Keeping this separate from PrinterService means you can preview
// or unit-test the receipt content without touching Bluetooth at all.

const ALIGN = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
};

export function buildReceipt({
  storeName = 'SNACK DIRECT',
  lines,
  total,
  orderNumber,
  currency = 'DA',
  footer = 'Bon appetit !',
}) {
  const steps = [];

  steps.push({
    type: 'text',
    value: `${storeName}\n`,
    options: { widthtimes: 1, heigthtimes: 1, fonttype: 1, align: ALIGN.CENTER },
  });

  steps.push({
    type: 'text',
    value: `Commande n°${orderNumber}\n${new Date().toLocaleString('fr-FR')}\n`,
    options: { align: ALIGN.CENTER },
  });

  steps.push({ type: 'divider' });

  lines.forEach((line) => {
    steps.push({
      type: 'column',
      widths: [4, 20, 8],
      aligns: [ALIGN.LEFT, ALIGN.LEFT, ALIGN.RIGHT],
      values: [`${line.qty}x`, line.name, `${line.qty * line.price} ${currency}`],
      options: {},
    });
  });

  steps.push({ type: 'divider' });

  steps.push({
    type: 'column',
    widths: [20, 12],
    aligns: [ALIGN.LEFT, ALIGN.RIGHT],
    values: ['TOTAL', `${total} ${currency}`],
    options: { widthtimes: 1, heigthtimes: 1 },
  });

  steps.push({
    type: 'text',
    value: `\n${footer}\n`,
    options: { align: ALIGN.CENTER },
  });

  steps.push({ type: 'feed', lines: 2 });
  steps.push({ type: 'cut' });

  return steps;
}
