import { describe, expect, it } from 'vitest';
import { computeSheetLayout, getLegendIndex, getSheetCellSize } from './printableSheet';

describe('printableSheet', () => {
  it('usa 28px por celda en plantillas normales y reduce en las muy grandes', () => {
    expect(getSheetCellSize(29, 29)).toBe(28);
    expect(getSheetCellSize(500, 500)).toBe(12);
    expect(getSheetCellSize(116, 116)).toBe(28);
  });

  it('numera la leyenda desde 1 segun el orden de uso', () => {
    const index = getLegendIndex([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(index.get('a')).toBe(1);
    expect(index.get('c')).toBe(3);
  });

  it('el layout deja espacio a la leyenda cuando tiene muchos colores', () => {
    const small = computeSheetLayout(10, 10, 3);
    const tall = computeSheetLayout(10, 10, 40);
    expect(tall.height).toBeGreaterThan(small.height);
    expect(small.legendX).toBe(small.gridX + small.gridW + 24);
  });
});

describe('tableros', () => {
  it('divide la grilla en tableros, con bordes menores', async () => {
    const { getBoardRegions } = await import('./printableSheet');
    expect(getBoardRegions(29, 29, 29)).toHaveLength(1);
    const regions = getBoardRegions(60, 30, 29);
    expect(regions).toHaveLength(6); // 3 columnas x 2 filas
    expect(regions[2]).toEqual({ col0: 58, col1: 60, row0: 0, row1: 29 });
    expect(regions[5]).toEqual({ col0: 58, col1: 60, row0: 29, row1: 30 });
  });

  it('buildRegionInfo conserva la numeracion global y cuenta solo la region', async () => {
    const { buildRegionInfo } = await import('./printableSheet');
    const red = { id: 'r', hex: '#f00', name: 'Rojo' };
    const blue = { id: 'b', hex: '#00f', name: 'Azul' };
    // 4x2: fila 0 = r r b b ; fila 1 = r b b null
    const info = {
      widthBeads: 4,
      heightBeads: 2,
      cells: [red, red, blue, blue, red, blue, blue, null],
      colorUsage: [
        { ...blue, count: 4 },
        { ...red, count: 3 }
      ]
    };
    const region = buildRegionInfo(info, { col0: 2, col1: 4, row0: 0, row1: 2 });
    expect(region.widthBeads).toBe(2);
    expect(region.cells.map((c) => c?.id ?? null)).toEqual(['b', 'b', 'b', null]);
    expect(region.colorUsage).toEqual([{ ...blue, count: 3 }]);
    expect(region.totalBeads).toBe(3);
    expect(region.legendIndex.get('b')).toBe(1); // global: azul es el mas usado
    expect(region.legendIndex.get('r')).toBe(2);
    expect(region.colOffset).toBe(2);
  });
});
