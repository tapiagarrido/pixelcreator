import { describe, expect, it } from 'vitest';
import {
  cellsForAxis,
  computeCellGrid,
  quantizeGrid,
  rgbToLab,
  selectPaletteSubset
} from './quantize';

const palette = [
  { id: 'black', name: 'Negro', hex: '#000000' },
  { id: 'white', name: 'Blanco', hex: '#FFFFFF' },
  { id: 'red', name: 'Rojo', hex: '#FF0000' },
  { id: 'blue', name: 'Azul', hex: '#0000FF' }
];

// Construye datos RGBA a partir de una lista de colores [r,g,b,a] por pixel.
const makeData = (pixels) => Uint8ClampedArray.from(pixels.flat());
const px = (r, g, b, a = 255) => [r, g, b, a];

describe('rgbToLab', () => {
  it('convierte blanco, negro y rojo a valores Lab conocidos', () => {
    expect(rgbToLab({ r: 255, g: 255, b: 255 }).l).toBeCloseTo(100, 1);
    expect(rgbToLab({ r: 0, g: 0, b: 0 }).l).toBeCloseTo(0, 1);
    const red = rgbToLab({ r: 255, g: 0, b: 0 });
    expect(red.l).toBeCloseTo(53.24, 1);
    expect(red.a).toBeCloseTo(80.09, 1);
    expect(red.b).toBeCloseTo(67.2, 1);
  });
});

describe('computeCellGrid', () => {
  it('promedia cada celda', () => {
    // 2x1 pixeles -> 1 celda: promedio de negro y blanco
    const data = makeData([px(0, 0, 0), px(255, 255, 255)]);
    const [cell] = computeCellGrid(data, 2, 1, 1, 1);
    expect(cell).toEqual({ r: 127.5, g: 127.5, b: 127.5 });
  });

  it('separa las celdas segun la posicion', () => {
    const data = makeData([px(255, 0, 0), px(0, 0, 255)]);
    const grid = computeCellGrid(data, 2, 1, 2, 1);
    expect(grid[0]).toEqual({ r: 255, g: 0, b: 0 });
    expect(grid[1]).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('deja vacias las celdas totalmente transparentes', () => {
    const data = makeData([
      px(10, 10, 10, 0),
      px(20, 20, 20, 0),
      px(200, 0, 0, 255),
      px(200, 0, 0, 255)
    ]);
    const grid = computeCellGrid(data, 4, 1, 2, 1);
    expect(grid[0]).toBeNull();
    expect(grid[1]).toEqual({ r: 200, g: 0, b: 0 });
  });

  it('acepta celdas con al menos 50% de cobertura y descarta las demas', () => {
    const half = makeData([px(0, 0, 0, 0), px(200, 0, 0, 255)]);
    expect(computeCellGrid(half, 2, 1, 1, 1)[0]).toEqual({ r: 200, g: 0, b: 0 });

    const quarter = makeData([px(0, 0, 0, 0), px(0, 0, 0, 0), px(0, 0, 0, 0), px(200, 0, 0, 255)]);
    expect(computeCellGrid(quarter, 4, 1, 1, 1)[0]).toBeNull();
  });
});

describe('quantizeGrid', () => {
  it('asigna el color mas cercano de la paleta', () => {
    const grid = [{ r: 250, g: 10, b: 10 }, { r: 20, g: 20, b: 20 }, null];
    const result = quantizeGrid(grid, 3, 1, palette);
    expect(result.map((c) => c?.id ?? null)).toEqual(['red', 'black', null]);
  });

  it('limita la cantidad de colores usados', () => {
    const grid = [
      { r: 0, g: 0, b: 0 },
      { r: 0, g: 0, b: 0 },
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 0, b: 255 }
    ];
    const result = quantizeGrid(grid, 7, 1, palette, { maxColors: 2 });
    const used = new Set(result.map((c) => c.id));
    expect(used.size).toBe(2);
    expect(used).toEqual(new Set(['black', 'white']));
  });

  it('con dithering mezcla colores para aproximar un tono intermedio', () => {
    const gray = { r: 128, g: 128, b: 128 };
    const grid = new Array(16).fill(gray);
    const bw = palette.slice(0, 2);

    const plain = quantizeGrid(grid, 4, 4, bw);
    expect(new Set(plain.map((c) => c.id)).size).toBe(1);

    const dithered = quantizeGrid(grid, 4, 4, bw, { dither: true });
    const whites = dithered.filter((c) => c.id === 'white').length;
    expect(whites).toBeGreaterThan(4);
    expect(whites).toBeLessThan(12);
  });

  it('el dithering respeta las celdas vacias', () => {
    const grid = [{ r: 128, g: 128, b: 128 }, null, { r: 128, g: 128, b: 128 }];
    const result = quantizeGrid(grid, 3, 1, palette.slice(0, 2), { dither: true });
    expect(result[1]).toBeNull();
    expect(result[0]).not.toBeNull();
  });

  it('devuelve celdas vacias si la paleta esta vacia', () => {
    expect(quantizeGrid([{ r: 1, g: 2, b: 3 }], 1, 1, [])).toEqual([null]);
  });
});

describe('cellsForAxis', () => {
  it('no suma una celda por error de coma flotante', () => {
    expect(cellsForAxis(400, 400, 58)).toBe(58);
    expect(cellsForAxis(300, 300, 29)).toBe(29);
  });

  it('redondea hacia arriba cuando la proporcion no es exacta', () => {
    expect(cellsForAxis(300, 200, 10)).toBe(15);
    expect(cellsForAxis(301, 200, 10)).toBe(16);
  });
});

describe('seleccion de colores con limite', () => {
  const grays = [40, 80, 120, 160, 200, 240].map((v) => ({
    id: `g${v}`,
    name: `Gris ${v}`,
    hex: `#${v.toString(16).padStart(2, '0').repeat(3).toUpperCase()}`
  }));
  const redColor = { id: 'red', name: 'Rojo', hex: '#FF0000' };
  const colors = [...grays, redColor];

  // Degradado de grises (200 celdas por tono) y una zona roja mas chica (150 celdas)
  const gradient = grays.flatMap((g) =>
    Array.from({ length: 200 }, () => ({
      r: parseInt(g.hex.slice(1, 3), 16),
      g: parseInt(g.hex.slice(1, 3), 16),
      b: parseInt(g.hex.slice(1, 3), 16)
    }))
  );
  const grid = [...gradient, ...Array.from({ length: 150 }, () => ({ r: 255, g: 0, b: 0 }))];

  it('conserva un color poco frecuente pero muy distinto', () => {
    const result = quantizeGrid(grid, grid.length, 1, colors, { maxColors: 3 });
    const used = new Set(result.map((c) => c.id));
    expect(used.size).toBeLessThanOrEqual(3);
    expect(used.has('red')).toBe(true); // quedarse con los 3 mas usados lo habria perdido
  });

  it('respeta el maximo y reparte los grises a lo largo del rango', () => {
    const subset = selectPaletteSubset(
      grid,
      colors.map((color) => ({
        color,
        lab: rgbToLab({
          r: parseInt(color.hex.slice(1, 3), 16),
          g: parseInt(color.hex.slice(3, 5), 16),
          b: parseInt(color.hex.slice(5, 7), 16)
        })
      })),
      4
    );
    expect(subset).toHaveLength(4);
    const ids = subset.map((entry) => entry.color.id);
    expect(ids).toContain('red');
    const greyIds = ids.filter((id) => id !== 'red');
    expect(greyIds.some((id) => ['g40', 'g80'].includes(id))).toBe(true);
    expect(greyIds.some((id) => ['g200', 'g240'].includes(id))).toBe(true);
  });

  it('con una paleta menor que el maximo devuelve todo', () => {
    const result = quantizeGrid(grid, grid.length, 1, colors, { maxColors: 50 });
    expect(new Set(result.map((c) => c.id)).size).toBeGreaterThan(3);
  });
});
