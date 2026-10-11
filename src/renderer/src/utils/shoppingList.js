const BOM = String.fromCharCode(0xfeff);

const escapeCsv = (value) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// CSV con los beads necesarios por color. Incluye BOM para que Excel respete las tildes.
export const buildShoppingListCsv = (info) => {
  const rows = [['N', 'Código', 'Color', 'Hex', 'Cantidad']];
  info.colorUsage.forEach((color, index) => {
    rows.push([index + 1, color.code || '', color.name, color.hex, color.count]);
  });
  rows.push(['', '', 'Total', '', info.totalBeads]);

  const header = [
    ['Marca', info.brandLabel || info.brand || ''],
    ['Paleta', info.paletteName || ''],
    ['Tamaño', `${info.widthBeads} x ${info.heightBeads}`],
    []
  ];

  const lines = [...header, ...rows].map((row) => row.map(escapeCsv).join(','));
  return `${BOM}${lines.join('\r\n')}\r\n`;
};
