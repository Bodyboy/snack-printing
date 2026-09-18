import { formatReceiptPrice } from './money';

const ALIGN = { LEFT: 0, CENTER: 1, RIGHT: 2 };

export function buildReceipt({
  storeName = 'POINT DWICH',
  lines,
  total,
  orderNumber,
  currency = 'EUR',
  footer = 'Bon appetit !',
}) {
  const steps = [
    {
      type: 'text',
      value: `${storeName}\n`,
      options: { widthtimes: 2, heigthtimes: 1, fonttype: 1, align: ALIGN.CENTER },
    },
    {
      type: 'text',
      value: `COMMANDE N°${orderNumber}\n${new Date().toLocaleString('fr-FR')}\n`,
      options: { align: ALIGN.CENTER },
    },
    { type: 'divider' },
  ];

  lines.forEach((line) => {
    steps.push({
      type: 'column',
      widths: [4, 18, 10],
      aligns: [ALIGN.LEFT, ALIGN.LEFT, ALIGN.RIGHT],
      values: [`${line.qty}x`, line.name, formatReceiptPrice(line.qty * line.price, currency)],
      options: {},
    });
  });

  steps.push(
    { type: 'divider' },
    {
      type: 'column',
      widths: [18, 14],
      aligns: [ALIGN.LEFT, ALIGN.RIGHT],
      values: ['TOTAL', formatReceiptPrice(total, currency)],
      options: { widthtimes: 1, heigthtimes: 1 },
    },
    { type: 'text', value: `\n${footer}\n`, options: { align: ALIGN.CENTER } },
    { type: 'feed', lines: 2 },
    { type: 'cut' }
  );

  return steps;
}
