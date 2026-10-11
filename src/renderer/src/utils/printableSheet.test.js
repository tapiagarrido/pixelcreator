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
