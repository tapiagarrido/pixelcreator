import { hexToRgb } from './hamaPalette';

const FONT = "'Changa', Arial, sans-serif";
const PAD = 24;
const HEADER_H = 84;
const LEGEND_W = 340;
const LEGEND_ROW_H = 34;

// Tamano de celda: 28px en plantillas normales, menor en las muy grandes para no pasar el limite del canvas.
export const getSheetCellSize = (cols, rows) =>
  Math.max(12, Math.min(28, Math.floor(4000 / Math.max(cols, rows))));

// Numero de leyenda por color (1 = el mas usado), igual que el orden de `colorUsage`.
export const getLegendIndex = (colorUsage) =>
  new Map(colorUsage.map((color, index) => [color.id, index + 1]));

// Divide una grilla en tableros de boardSize x boardSize (los de los bordes pueden ser menores).
export const getBoardRegions = (cols, rows, boardSize) => {
  const regions = [];
  for (let row0 = 0; row0 < rows; row0 += boardSize) {
    for (let col0 = 0; col0 < cols; col0 += boardSize) {
      regions.push({
        col0,
        col1: Math.min(cols, col0 + boardSize),
        row0,
        row1: Math.min(rows, row0 + boardSize)
      });
    }
  }
  return regions;
};

/**
 * Recorta `info` a una region. La leyenda conserva la numeracion global
 * (para que el numero de cada color sea el mismo en todas las paginas)
 * pero con las cantidades de esa region.
 */
export const buildRegionInfo = (info, region) => {
  const { col0, col1, row0, row1 } = region;
  const cols = col1 - col0;
  const rows = row1 - row0;
  const indexById = getLegendIndex(info.colorUsage);
  const cells = [];
  const counts = new Map();

  for (let y = row0; y < row1; y++) {
    for (let x = col0; x < col1; x++) {
      const color = info.cells[y * info.widthBeads + x];
      cells.push(color);
      if (color) counts.set(color.id, (counts.get(color.id) || 0) + 1);
    }
  }

  const colorUsage = info.colorUsage
    .filter((color) => counts.has(color.id))
    .map((color) => ({ ...color, count: counts.get(color.id) }));

  return {
    ...info,
    cells,
    widthBeads: cols,
    heightBeads: rows,
    colorUsage,
    totalBeads: colorUsage.reduce((sum, color) => sum + color.count, 0),
    colOffset: col0,
    rowOffset: row0,
    legendIndex: indexById
  };
};

export const computeSheetLayout = (cols, rows, legendCount) => {
  const cell = getSheetCellSize(cols, rows);
  const gutter = cell;
  const gridW = cols * cell;
  const gridH = rows * cell;
  const legendH = LEGEND_ROW_H * (legendCount + 2) + 16;
  const gridX = PAD + gutter;
  const gridY = PAD + HEADER_H + gutter;
  const legendX = gridX + gridW + PAD;
  const width = legendX + LEGEND_W + PAD;
  const height = gridY - gutter + Math.max(gridH + gutter, legendH) + PAD;
  return { cell, gutter, gridW, gridH, gridX, gridY, legendX, width, height };
};

// Celda (indice en `info.cells`) bajo un punto en coordenadas del canvas de la hoja; -1 si no hay.
export const getCellIndexAt = (info, x, y) => {
  const L = computeSheetLayout(info.widthBeads, info.heightBeads, info.colorUsage.length);
  const col = Math.floor((x - L.gridX) / L.cell);
  const row = Math.floor((y - L.gridY) / L.cell);
  if (col < 0 || row < 0 || col >= info.widthBeads || row >= info.heightBeads) return -1;
  return row * info.widthBeads + col;
};

// Solo las celdas de color, sin coordenadas ni leyenda.
export const renderBeadsOnly = (info, cellPx = 24) => {
  const cols = info.widthBeads;
  const rows = info.heightBeads;
  const canvas = document.createElement('canvas');
  canvas.width = cols * cellPx;
  canvas.height = rows * cellPx;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 0.8;
  info.cells.forEach((color, index) => {
    if (!color) return;
    const x = (index % cols) * cellPx;
    const y = Math.floor(index / cols) * cellPx;
    ctx.fillStyle = color.hex;
    ctx.fillRect(x, y, cellPx, cellPx);
    ctx.strokeRect(x, y, cellPx, cellPx);
  });
  return canvas;
};

const textColorFor = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#111111' : '#FFFFFF';
};

/**
 * Dibuja la hoja de plantilla: coordenadas en los bordes, cuadricula punteada,
 * celdas de color (vacias en blanco) y una leyenda numerada con cantidad por color.
 * `info` es el resumen que entrega `buildBeadTemplate` mas el nombre de marca/paleta.
 */
export const renderPrintableSheet = (info, { showNumbers = false, title = 'Plantilla de beads' } = {}) => {
  const { cells, widthBeads: cols, heightBeads: rows, colorUsage } = info;
  const colOffset = info.colOffset || 0;
  const rowOffset = info.rowOffset || 0;
  // En una region la numeracion viene de la plantilla completa
  const indexById = info.legendIndex || getLegendIndex(colorUsage);
  const L = computeSheetLayout(cols, rows, colorUsage.length);

  const canvas = document.createElement('canvas');
  canvas.width = L.width;
  canvas.height = L.height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, L.width, L.height);

  // Encabezado: marca y paleta de beads a usar
  ctx.fillStyle = '#111111';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText(title, PAD, PAD);
  ctx.font = `20px ${FONT}`;
  ctx.fillText(
    `Beads: ${info.brandLabel || info.brand || '-'} · Paleta: ${info.paletteName}`,
    PAD,
    PAD + 40
  );
  ctx.fillText(
    `${cols} × ${rows} celdas · ${info.totalBeads} beads · ${colorUsage.length} colores`,
    PAD,
    PAD + 64
  );

  // Coordenadas
  ctx.fillStyle = '#222222';
  ctx.font = `${Math.round(L.cell * 0.42)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let x = 0; x < cols; x++) {
    ctx.fillText(String(colOffset + x + 1), L.gridX + x * L.cell + L.cell / 2, L.gridY - L.gutter / 2);
  }
  for (let y = 0; y < rows; y++) {
    ctx.fillText(String(rowOffset + y + 1), L.gridX - L.gutter / 2, L.gridY + y * L.cell + L.cell / 2);
  }

  // Celdas
  ctx.font = `bold ${Math.round(L.cell * 0.45)}px ${FONT}`;
  cells.forEach((color, index) => {
    if (!color) return;
    const x = L.gridX + (index % cols) * L.cell;
    const y = L.gridY + Math.floor(index / cols) * L.cell;
    ctx.fillStyle = color.hex;
    ctx.fillRect(x, y, L.cell, L.cell);
    if (showNumbers) {
      ctx.fillStyle = textColorFor(color.hex);
      ctx.fillText(String(indexById.get(color.id)), x + L.cell / 2, y + L.cell / 2 + 1);
    }
  });

  // Cuadricula punteada y borde
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  for (let x = 0; x <= cols; x++) {
    const px = L.gridX + x * L.cell + 0.5;
    ctx.moveTo(px, L.gridY);
    ctx.lineTo(px, L.gridY + L.gridH);
  }
  for (let y = 0; y <= rows; y++) {
    const py = L.gridY + y * L.cell + 0.5;
    ctx.moveTo(L.gridX, py);
    ctx.lineTo(L.gridX + L.gridW, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#111111';
  ctx.strokeRect(L.gridX + 0.5, L.gridY + 0.5, L.gridW, L.gridH);

  // Leyenda
  const top = L.gridY - L.gutter;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#111111';
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText('Colores', L.legendX, top + LEGEND_ROW_H / 2);
  ctx.textAlign = 'right';
  ctx.fillText('Cant.', L.legendX + LEGEND_W, top + LEGEND_ROW_H / 2);

  colorUsage.forEach((color, i) => {
    const y = top + LEGEND_ROW_H * (i + 1);
    const box = LEGEND_ROW_H - 6;
    ctx.fillStyle = color.hex;
    ctx.fillRect(L.legendX, y + 3, box, box);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    ctx.strokeRect(L.legendX + 0.5, y + 3.5, box, box);

    ctx.textAlign = 'center';
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = textColorFor(color.hex);
    ctx.fillText(String(indexById.get(color.id)), L.legendX + box / 2, y + LEGEND_ROW_H / 2 + 1);

    ctx.textAlign = 'left';
    ctx.font = `17px ${FONT}`;
    ctx.fillStyle = '#111111';
    ctx.fillText(color.code ? `${color.code}  ${color.name}` : color.name, L.legendX + box + 10, y + LEGEND_ROW_H / 2 + 1);

    ctx.textAlign = 'right';
    ctx.fillText(String(color.count), L.legendX + LEGEND_W, y + LEGEND_ROW_H / 2 + 1);
  });

  const totalY = top + LEGEND_ROW_H * (colorUsage.length + 1) + 8;
  ctx.strokeStyle = '#111111';
  ctx.beginPath();
  ctx.moveTo(L.legendX, totalY);
  ctx.lineTo(L.legendX + LEGEND_W, totalY);
  ctx.stroke();
  ctx.font = `bold 18px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('Total', L.legendX, totalY + LEGEND_ROW_H / 2);
  ctx.textAlign = 'right';
  ctx.fillText(String(info.totalBeads), L.legendX + LEGEND_W, totalY + LEGEND_ROW_H / 2);

  return canvas;
};
