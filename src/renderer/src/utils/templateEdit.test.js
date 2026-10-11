import { describe, expect, it } from 'vitest';
import { buildTemplateStats, setCell, withCells } from './templateEdit';
import { buildShoppingListCsv } from './shoppingList';
import { getCellIndexAt, computeSheetLayout } from './printableSheet';

const red = { id: 'r', code: 'H05', name: 'Red', hex: '#B4060E' };
const blue = { id: 'b', code: 'H08', name: 'Blue, "dark"', hex: '#0000FF' };

describe('templateEdit', () => {
  it('cuenta colores, celdas vacias y total ordenado por uso', () => {
    const stats = buildTemplateStats([red, blue, blue, null]);
    expect(stats.totalBeads).toBe(3);
    expect(stats.emptyCells).toBe(1);
    expect(stats.colorUsage.map((c) => [c.id, c.count])).toEqual([
      ['b', 2],
      ['r', 1]
    ]);
  });

  it('setCell no muta y devuelve el mismo arreglo si no cambia nada', () => {
    const cells = [red, null];
    const next = setCell(cells, 1, blue);
    expect(next).not.toBe(cells);
    expect(cells[1]).toBeNull();
    expect(next[1]).toBe(blue);
    expect(setCell(cells, 0, red)).toBe(cells);
    expect(setCell(cells, 5, red)).toBe(cells);
  });

  it('withCells recalcula los conteos tras borrar una celda', () => {
    const info = withCells({ widthBeads: 2, heightBeads: 1 }, [red, blue]);
    const edited = withCells(info, setCell(info.cells, 0, null));
    expect(edited.totalBeads).toBe(1);
    expect(edited.emptyCells).toBe(1);
    expect(edited.colorUsage).toHaveLength(1);
  });
});

describe('shoppingList', () => {
  it('genera un CSV con BOM, escapa comillas y suma el total', () => {
    const info = withCells(
      { widthBeads: 2, heightBeads: 2, brandLabel: 'Hama', paletteName: 'Hama Midi' },
      [red, blue, blue, null]
    );
    const csv = buildShoppingListCsv(info);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('Marca,Hama');
    expect(csv).toContain('1,H08,"Blue, ""dark""",#0000FF,2');
    expect(csv).toContain('2,H05,Red,#B4060E,1');
    expect(csv).toContain(',,Total,,3');
  });
});

describe('getCellIndexAt', () => {
  it('encuentra la celda bajo un punto y -1 fuera de la cuadricula', () => {
    const info = { widthBeads: 4, heightBeads: 3, colorUsage: [] };
    const L = computeSheetLayout(4, 3, 0);
    expect(getCellIndexAt(info, L.gridX + 1, L.gridY + 1)).toBe(0);
    expect(getCellIndexAt(info, L.gridX + L.cell * 2 + 1, L.gridY + L.cell + 1)).toBe(6);
    expect(getCellIndexAt(info, L.gridX - 1, L.gridY + 1)).toBe(-1);
    expect(getCellIndexAt(info, L.gridX + L.cell * 4 + 1, L.gridY + 1)).toBe(-1);
  });
});
