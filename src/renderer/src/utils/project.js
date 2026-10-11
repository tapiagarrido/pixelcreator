import { DEFAULT_FILTERS } from './imageFilters';
import { buildTemplateStats } from './templateEdit';

export const PROJECT_VERSION = 1;
const MAX_BEADS_PER_SIDE = 500;
const HEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Convierte el estado de la pantalla en un objeto JSON guardable.
 * Las celdas se guardan como indices a la tabla `colors` (-1 = vacia) para que el archivo sea chico.
 */
export const serializeProject = ({ image, filters, templateInfo, showNumbers, boardSize }) => {
  const project = {
    app: 'pixelcreator',
    version: PROJECT_VERSION,
    savedAt: new Date().toISOString(),
    image,
    filters,
    settings: { showNumbers, boardSize },
    template: null
  };

  if (templateInfo) {
    const colors = [...(templateInfo.paletteColors || [])];
    const indexById = new Map(colors.map((color, index) => [color.id, index]));

    const cells = templateInfo.cells.map((color) => {
      if (!color) return -1;
      if (!indexById.has(color.id)) {
        indexById.set(color.id, colors.length);
        colors.push(color);
      }
      return indexById.get(color.id);
    });

    project.template = {
      widthBeads: templateInfo.widthBeads,
      heightBeads: templateInfo.heightBeads,
      paletteName: templateInfo.paletteName,
      brand: templateInfo.brand,
      brandLabel: templateInfo.brandLabel,
      source: templateInfo.source,
      colors,
      cells
    };
  }

  return project;
};

const fail = (message) => {
  throw new Error(message);
};

const parseTemplate = (template) => {
  const { widthBeads: cols, heightBeads: rows, colors, cells } = template;

  const validSize = (n) => Number.isInteger(n) && n >= 1 && n <= MAX_BEADS_PER_SIDE;
  if (!validSize(cols) || !validSize(rows))
    fail('El proyecto tiene dimensiones de plantilla inválidas');
  if (!Array.isArray(colors) || colors.length === 0) fail('El proyecto no tiene colores');
  if (
    colors.some(
      (c) => !c || typeof c.id !== 'string' || typeof c.name !== 'string' || !HEX.test(c.hex)
    )
  ) {
    fail('El proyecto tiene colores inválidos');
  }
  if (!Array.isArray(cells) || cells.length !== cols * rows) {
    fail('El proyecto tiene una cantidad de celdas que no coincide con su tamaño');
  }
  if (cells.some((i) => !Number.isInteger(i) || i < -1 || i >= colors.length)) {
    fail('El proyecto tiene celdas con colores inexistentes');
  }

  const cellColors = cells.map((i) => (i === -1 ? null : colors[i]));
  return {
    widthBeads: cols,
    heightBeads: rows,
    cells: cellColors,
    paletteColors: colors,
    paletteName: String(template.paletteName ?? ''),
    brand: template.brand,
    brandLabel: template.brandLabel,
    source: template.source,
    ...buildTemplateStats(cellColors)
  };
};

const parseFilters = (filters) => {
  const result = { ...DEFAULT_FILTERS };
  Object.keys(DEFAULT_FILTERS).forEach((key) => {
    const value = Number(filters?.[key]);
    if (Number.isFinite(value)) result[key] = value;
  });
  return result;
};

/** Valida el texto de un archivo de proyecto y lo convierte al estado de la pantalla. */
export const parseProject = (text) => {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    fail('El archivo no es un proyecto válido (no es JSON)');
  }

  if (!data || data.app !== 'pixelcreator') fail('El archivo no es un proyecto de PixelCreator');
  if (!Number.isInteger(data.version) || data.version > PROJECT_VERSION) {
    fail('El proyecto fue creado con una versión más nueva de la aplicación');
  }
  if (typeof data.image !== 'string' || !data.image.startsWith('data:image/')) {
    fail('El proyecto no contiene una imagen válida');
  }

  const boardSize = Number.parseInt(data.settings?.boardSize, 10);
  return {
    image: data.image,
    filters: parseFilters(data.filters),
    showNumbers: Boolean(data.settings?.showNumbers),
    boardSize: boardSize >= 1 && boardSize <= 200 ? boardSize : 29,
    templateInfo: data.template ? parseTemplate(data.template) : null
  };
};
