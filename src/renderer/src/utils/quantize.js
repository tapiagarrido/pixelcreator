import { hexToRgb } from './hamaPalette';

// Cantidad de celdas del eje libre cuando el otro eje tiene `count` celdas.
// El epsilon evita que errores de coma flotante (58.00000000001) sumen una celda de mas.
export const cellsForAxis = (freeSize, referenceSize, count) =>
  Math.max(1, Math.ceil((freeSize * count) / referenceSize - 1e-6));

const MIN_COVERAGE = 0.5; // una celda con menos de 50% de pixeles opacos queda vacia
const ALPHA_THRESHOLD = 12;

const srgbToLinear = (value) => {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const labF = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

// sRGB -> CIE Lab (D65). La distancia en Lab se acerca mucho mas a la percepcion que en RGB.
export const rgbToLab = ({ r, g, b }) => {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) / 0.95047;
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175;
  const z = (lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041) / 1.08883;

  const fx = labF(x);
  const fy = labF(y);
  const fz = labF(z);

  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
};

const preparePalette = (colors) =>
  colors.map((color) => ({ color, lab: rgbToLab(hexToRgb(color.hex)) }));

export const closestColor = (lab, prepared) => {
  let best = prepared[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const entry of prepared) {
    const dl = lab.l - entry.lab.l;
    const da = lab.a - entry.lab.a;
    const db = lab.b - entry.lab.b;
    const distance = dl * dl + da * da + db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }

  return best.color;
};

// Promedio de una celda ponderado por alpha. Devuelve null si la celda esta (casi) vacia.
const averageCell = (data, imgWidth, x0, y0, x1, y1) => {
  let r = 0;
  let g = 0;
  let b = 0;
  let opaque = 0;
  const total = (x1 - x0) * (y1 - y0);

  for (let y = y0; y < y1; y++) {
    let i = (y * imgWidth + x0) * 4;
    for (let x = x0; x < x1; x++, i += 4) {
      if (data[i + 3] > ALPHA_THRESHOLD) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        opaque += 1;
      }
    }
  }

  if (opaque === 0 || opaque / total < MIN_COVERAGE) return null;
  return { r: r / opaque, g: g / opaque, b: b / opaque };
};

/**
 * Reduce los pixeles RGBA (`data`, como en ImageData) a una grilla de cellsW x cellsH.
 * Devuelve un arreglo por filas con el color promedio de cada celda, o null si esta vacia.
 */
export const computeCellGrid = (data, width, height, cellsW, cellsH) => {
  const grid = new Array(cellsW * cellsH);

  for (let cy = 0; cy < cellsH; cy++) {
    const y0 = Math.min(height - 1, Math.floor((cy * height) / cellsH));
    const y1 = Math.min(height, Math.max(y0 + 1, Math.round(((cy + 1) * height) / cellsH)));

    for (let cx = 0; cx < cellsW; cx++) {
      const x0 = Math.min(width - 1, Math.floor((cx * width) / cellsW));
      const x1 = Math.min(width, Math.max(x0 + 1, Math.round(((cx + 1) * width) / cellsW)));
      grid[cy * cellsW + cx] = averageCell(data, width, x0, y0, x1, y1);
    }
  }

  return grid;
};

const clampByte = (value) => Math.max(0, Math.min(255, value));

// Floyd-Steinberg sobre la grilla; las celdas vacias ni reciben ni propagan error.
const ditherGrid = (grid, cellsW, cellsH, prepared) => {
  const work = grid.map((cell) => (cell ? { ...cell } : null));
  const result = new Array(grid.length).fill(null);

  const spread = (x, y, error, weight) => {
    if (x < 0 || x >= cellsW || y >= cellsH) return;
    const target = work[y * cellsW + x];
    if (!target) return;
    target.r += error.r * weight;
    target.g += error.g * weight;
    target.b += error.b * weight;
  };

  for (let y = 0; y < cellsH; y++) {
    for (let x = 0; x < cellsW; x++) {
      const cell = work[y * cellsW + x];
      if (!cell) continue;

      const wanted = { r: clampByte(cell.r), g: clampByte(cell.g), b: clampByte(cell.b) };
      const color = closestColor(rgbToLab(wanted), prepared);
      const chosen = hexToRgb(color.hex);
      result[y * cellsW + x] = color;

      const error = { r: wanted.r - chosen.r, g: wanted.g - chosen.g, b: wanted.b - chosen.b };
      spread(x + 1, y, error, 7 / 16);
      spread(x - 1, y + 1, error, 3 / 16);
      spread(x, y + 1, error, 5 / 16);
      spread(x + 1, y + 1, error, 1 / 16);
    }
  }

  return result;
};

/**
 * Asigna un color de la paleta a cada celda de la grilla (null = celda vacia).
 * - maxColors > 0: se queda con los N colores de la paleta mas usados y re-mapea todo a ellos.
 * - dither: difunde el error de cuantizacion (Floyd-Steinberg) para simular tonos intermedios.
 */
export const quantizeGrid = (grid, cellsW, cellsH, colors, { maxColors = 0, dither = false } = {}) => {
  let prepared = preparePalette(colors);
  if (prepared.length === 0) return grid.map(() => null);

  const nearest = (cell, palette) => (cell ? closestColor(rgbToLab(cell), palette) : null);

  if (maxColors > 0 && maxColors < prepared.length) {
    const counts = new Map();
    grid.forEach((cell) => {
      const color = nearest(cell, prepared);
      if (color) counts.set(color.id, (counts.get(color.id) || 0) + 1);
    });

    if (counts.size > maxColors) {
      const keep = new Set(
        [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, maxColors)
          .map(([id]) => id)
      );
      prepared = prepared.filter((entry) => keep.has(entry.color.id));
    }
  }

  if (dither) return ditherGrid(grid, cellsW, cellsH, prepared);
  return grid.map((cell) => nearest(cell, prepared));
};

/**
 * Convierte `sourceCanvas` en una grilla de beads.
 * Lee siempre del canvas original y dibuja en otro canvas, para que las celdas
 * ya pintadas no contaminen a las vecinas.
 */
export const buildBeadTemplate = (
  sourceCanvas,
  { cellsW, cellsH, palette, borderWidth = 0.8, maxColors = 0, dither = false }
) => {
  const { width, height } = sourceCanvas;
  const { data } = sourceCanvas
    .getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, width, height);

  const grid = computeCellGrid(data, width, height, cellsW, cellsH);
  const assigned = quantizeGrid(grid, cellsW, cellsH, palette.colors, { maxColors, dither });

  const cellPx = Math.max(6, Math.min(24, Math.floor(1600 / Math.max(cellsW, cellsH))));
  const out = document.createElement('canvas');
  out.width = cellsW * cellPx;
  out.height = cellsH * cellPx;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = borderWidth;

  const counter = new Map();
  let emptyCells = 0;

  assigned.forEach((color, index) => {
    if (!color) {
      emptyCells += 1;
      return;
    }
    const cx = index % cellsW;
    const cy = Math.floor(index / cellsW);
    ctx.fillStyle = color.hex;
    ctx.fillRect(cx * cellPx, cy * cellPx, cellPx, cellPx);
    ctx.strokeRect(cx * cellPx, cy * cellPx, cellPx, cellPx);
    counter.set(color.id, (counter.get(color.id) || 0) + 1);
  });

  const colorUsage = Array.from(counter.entries())
    .map(([id, count]) => {
      const info = palette.colors.find((color) => color.id === id);
      return { id, code: info?.code, name: info?.name || id, hex: info?.hex || '#000000', count };
    })
    .sort((a, b) => b.count - a.count);

  return {
    dataUrl: out.toDataURL('image/png'),
    stats: {
      widthBeads: cellsW,
      heightBeads: cellsH,
      totalBeads: cellsW * cellsH - emptyCells,
      emptyCells,
      colorUsage,
      cells: assigned
    }
  };
};
