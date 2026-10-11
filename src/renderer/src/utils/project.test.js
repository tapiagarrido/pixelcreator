import { describe, expect, it } from 'vitest';
import { parseProject, serializeProject } from './project';
import { DEFAULT_FILTERS } from './imageFilters';
import { buildTemplateStats } from './templateEdit';

const red = { id: 'r', code: 'H05', name: 'Red', hex: '#B4060E' };
const blue = { id: 'b', code: 'H08', name: 'Blue', hex: '#0000FF' };
const IMG = 'data:image/png;base64,AAAA';

const makeInfo = () => {
  const cells = [red, blue, null, blue];
  return {
    widthBeads: 2,
    heightBeads: 2,
    cells,
    paletteColors: [red, blue],
    paletteName: 'Hama Midi',
    brand: 'hama',
    brandLabel: 'Hama',
    source: 'beadcolors',
    ...buildTemplateStats(cells)
  };
};

const roundTrip = (overrides = {}) =>
  JSON.stringify({
    ...serializeProject({
      image: IMG,
      filters: { ...DEFAULT_FILTERS, blur: 3 },
      templateInfo: makeInfo(),
      showNumbers: true,
      boardSize: 50
    }),
    ...overrides
  });

describe('proyecto', () => {
  it('guardar y abrir devuelve el mismo estado', () => {
    const opened = parseProject(roundTrip());
    expect(opened.image).toBe(IMG);
    expect(opened.filters.blur).toBe(3);
    expect(opened.showNumbers).toBe(true);
    expect(opened.boardSize).toBe(50);
    const info = opened.templateInfo;
    expect(info.cells.map((c) => c?.id ?? null)).toEqual(['r', 'b', null, 'b']);
    expect(info.totalBeads).toBe(3);
    expect(info.emptyCells).toBe(1);
    expect(info.colorUsage[0]).toMatchObject({ id: 'b', count: 2 });
    expect(info.paletteName).toBe('Hama Midi');
  });

  it('guarda las celdas como indices, no como objetos repetidos', () => {
    const saved = serializeProject({
      image: IMG,
      filters: DEFAULT_FILTERS,
      templateInfo: makeInfo()
    });
    expect(saved.template.cells).toEqual([0, 1, -1, 1]);
  });

  it('incluye colores de celdas que no estan en la paleta guardada', () => {
    const info = { ...makeInfo(), paletteColors: [red] };
    const saved = serializeProject({ image: IMG, filters: DEFAULT_FILTERS, templateInfo: info });
    expect(saved.template.colors.map((c) => c.id)).toEqual(['r', 'b']);
  });

  it('permite un proyecto solo con imagen', () => {
    const text = JSON.stringify(
      serializeProject({ image: IMG, filters: DEFAULT_FILTERS, templateInfo: null })
    );
    expect(parseProject(text).templateInfo).toBeNull();
  });

  it('rechaza archivos invalidos con un mensaje claro', () => {
    expect(() => parseProject('no es json')).toThrow(/no es JSON/);
    expect(() => parseProject('{"app":"otra"}')).toThrow(/no es un proyecto de PixelCreator/);
    expect(() => parseProject(roundTrip({ version: 99 }))).toThrow(/versión más nueva/);
    expect(() => parseProject(roundTrip({ image: 'http://x/y.png' }))).toThrow(/imagen válida/);
  });

  it('rechaza plantillas corruptas', () => {
    const base = JSON.parse(roundTrip());
    const bad = (patch) => JSON.stringify({ ...base, template: { ...base.template, ...patch } });
    expect(() => parseProject(bad({ cells: [0, 1] }))).toThrow(/no coincide/);
    expect(() => parseProject(bad({ cells: [0, 1, 9, 1] }))).toThrow(/inexistentes/);
    expect(() => parseProject(bad({ widthBeads: 0 }))).toThrow(/dimensiones/);
    expect(() => parseProject(bad({ colors: [{ id: 'x', name: 'X', hex: 'rojo' }] }))).toThrow(
      /colores inválidos/
    );
  });

  it('ignora filtros no numericos y usa los valores por defecto', () => {
    const opened = parseProject(roundTrip({ filters: { brightness: 'mucho', blur: 4 } }));
    expect(opened.filters).toEqual({ ...DEFAULT_FILTERS, blur: 4 });
  });
});
