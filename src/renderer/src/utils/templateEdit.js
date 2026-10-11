// Conteos de una plantilla a partir de sus celdas (cada celda es un color o null).
export const buildTemplateStats = (cells) => {
  const counter = new Map();
  let emptyCells = 0;

  cells.forEach((color) => {
    if (!color) {
      emptyCells += 1;
      return;
    }
    const entry = counter.get(color.id);
    if (entry) entry.count += 1;
    else
      counter.set(color.id, {
        id: color.id,
        code: color.code,
        name: color.name,
        hex: color.hex,
        count: 1
      });
  });

  const colorUsage = [...counter.values()].sort((a, b) => b.count - a.count);
  return { emptyCells, totalBeads: cells.length - emptyCells, colorUsage };
};

// Devuelve una copia con la celda cambiada, o el mismo arreglo si no hay cambio.
export const setCell = (cells, index, color) => {
  if (index < 0 || index >= cells.length) return cells;
  const current = cells[index];
  if ((current?.id ?? null) === (color?.id ?? null)) return cells;
  const next = cells.slice();
  next[index] = color;
  return next;
};

// Aplica unas celdas nuevas a la plantilla y recalcula los conteos.
export const withCells = (info, cells) => ({ ...info, cells, ...buildTemplateStats(cells) });
