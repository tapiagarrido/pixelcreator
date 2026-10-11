import { describe, expect, it } from 'vitest';
import {
  BEAD_BRANDS,
  BUILTIN_BEAD_PALETTES,
  findClosestPaletteColor,
  getPalettesByBrand
} from './hamaPalette';

describe('paletas integradas', () => {
  it('incluye las marcas esperadas con colores reales', () => {
    expect(BEAD_BRANDS.map((b) => b.value)).toEqual(['hama', 'perler', 'nabbi', 'artkal']);
    const hama = getPalettesByBrand('hama')[0];
    expect(hama.colors.length).toBeGreaterThanOrEqual(90);
    expect(hama.colors.find((c) => c.code === 'H01')?.name).toBe('White');
  });

  it('cada color tiene id unico, codigo, nombre y hex valido', () => {
    BUILTIN_BEAD_PALETTES.forEach((palette) => {
      const ids = new Set(palette.colors.map((c) => c.id));
      expect(ids.size).toBe(palette.colors.length);
      palette.colors.forEach((c) => {
        expect(c.code).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.hex).toMatch(/^#[0-9A-F]{6}$/);
      });
    });
  });

  it('findClosestPaletteColor devuelve el color exacto de la paleta', () => {
    const perler = getPalettesByBrand('perler')[0];
    const target = perler.colors[10];
    const rgb = {
      r: parseInt(target.hex.slice(1, 3), 16),
      g: parseInt(target.hex.slice(3, 5), 16),
      b: parseInt(target.hex.slice(5, 7), 16)
    };
    expect(findClosestPaletteColor(rgb, perler.colors).id).toBe(target.id);
  });

  it('marca como especiales los beads translucidos y glow', () => {
    const hama = getPalettesByBrand('hama')[0];
    expect(hama.colors.find((c) => c.name === 'Transparent Yellow')?.special).toBe(true);
    expect(hama.colors.find((c) => c.code === 'H01')?.special).toBeUndefined();
  });
});
