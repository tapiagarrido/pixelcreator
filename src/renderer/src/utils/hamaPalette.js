import beadPalettes from '../data/beadPalettes.json';

// Paletas reales por fabricante (ver scripts/gen-palettes.mjs)
export const BUILTIN_BEAD_PALETTES = beadPalettes;

export const BEAD_BRANDS = Array.from(
  BUILTIN_BEAD_PALETTES.reduce((brandMap, palette) => {
    brandMap.set(palette.brand, { value: palette.brand, label: palette.brandLabel });
    return brandMap;
  }, new Map()).values()
);

export const getPalettesByBrand = (brand) =>
  BUILTIN_BEAD_PALETTES.filter((palette) => palette.brand === brand);

export const getPaletteById = (paletteId) =>
  BUILTIN_BEAD_PALETTES.find((palette) => palette.id === paletteId);

export const hexToRgb = (hex) => {
  const cleanHex = hex.replace('#', '');
  let expandedHex = cleanHex;

  if (cleanHex.length === 3) {
    expandedHex = cleanHex
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
  }

  return {
    r: parseInt(expandedHex.substring(0, 2), 16),
    g: parseInt(expandedHex.substring(2, 4), 16),
    b: parseInt(expandedHex.substring(4, 6), 16)
  };
};

const calculateDistance = (colorA, colorB) => {
  const dr = colorA.r - colorB.r;
  const dg = colorA.g - colorB.g;
  const db = colorA.b - colorB.b;

  return dr * dr + dg * dg + db * db;
};

export const findClosestPaletteColor = (rgbColor, palette = BUILTIN_BEAD_PALETTES[0].colors) => {
  if (!palette || palette.length === 0) {
    return { id: 'empty-palette', name: 'Sin color', hex: '#000000' };
  }

  let bestMatch = palette[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const paletteColor of palette) {
    const paletteRgb = hexToRgb(paletteColor.hex);
    const distance = calculateDistance(rgbColor, paletteRgb);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = paletteColor;
    }
  }

  return bestMatch;
};

const clampToByte = (value) => Math.max(0, Math.min(255, Number.parseInt(value, 10)));

const componentToHex = (value) => clampToByte(value).toString(16).padStart(2, '0').toUpperCase();

const rgbToHex = (r, g, b) => `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const tryParseRgbString = (input) => {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const parts = input
    .split(/[\s,;]+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (parts.length < 3) {
    return null;
  }

  const [r, g, b] = parts;

  if ([r, g, b].some((component) => Number.isNaN(Number.parseInt(component, 10)))) {
    return null;
  }

  return rgbToHex(r, g, b);
};

const readColorName = (node, fallback) =>
  node.getAttribute('name') ||
  node.getAttribute('Name') ||
  node.getAttribute('colour') ||
  node.getAttribute('Colour') ||
  node.getAttribute('color') ||
  node.getAttribute('Color') ||
  node.getAttribute('description') ||
  fallback;

const readColorHex = (node) => {
  const hexCandidate =
    node.getAttribute('hex') ||
    node.getAttribute('Hex') ||
    node.getAttribute('HEX') ||
    node.getAttribute('html') ||
    node.getAttribute('HTML');

  if (hexCandidate) {
    const cleanHex = hexCandidate.replace('#', '').trim();
    if (/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
      return `#${cleanHex.toUpperCase()}`;
    }
  }

  const rgbCandidate =
    node.getAttribute('rgb') ||
    node.getAttribute('RGB') ||
    node.getAttribute('Rgb') ||
    node.getAttribute('value') ||
    node.getAttribute('Value');

  const parsedRgb = tryParseRgbString(rgbCandidate);
  if (parsedRgb) {
    return parsedRgb;
  }

  const red = node.getAttribute('r') || node.getAttribute('R') || node.getAttribute('red');
  const green = node.getAttribute('g') || node.getAttribute('G') || node.getAttribute('green');
  const blue = node.getAttribute('b') || node.getAttribute('B') || node.getAttribute('blue');

  if (red !== null && green !== null && blue !== null) {
    return rgbToHex(red, green, blue);
  }

  return null;
};

export const parseBeadPaletteXml = (xmlText) => {
  if (!xmlText || typeof xmlText !== 'string') {
    throw new Error('El XML esta vacio');
  }

  const parser = new DOMParser();
  const documentXml = parser.parseFromString(xmlText, 'text/xml');
  const parserErrors = documentXml.getElementsByTagName('parsererror');

  if (parserErrors.length > 0) {
    throw new Error('No se pudo parsear el XML');
  }

  const colorLikeNodes = Array.from(documentXml.getElementsByTagName('*')).filter((node) => {
    const tag = node.tagName.toLowerCase();
    return tag.includes('color') || tag.includes('colour') || tag === 'item';
  });

  const colors = [];

  colorLikeNodes.forEach((node, index) => {
    const hex = readColorHex(node);
    if (!hex) {
      return;
    }

    const name = readColorName(node, `Color ${index + 1}`);
    const idSeed = node.getAttribute('id') || node.getAttribute('ID') || name;
    colors.push({
      id: `${slugify(idSeed || `color-${index + 1}`)}-${index + 1}`,
      name,
      hex
    });
  });

  if (colors.length === 0) {
    throw new Error('El XML no contiene colores reconocibles');
  }

  return colors;
};

export const createCustomPaletteFromXml = ({
  xmlText,
  brand = 'custom',
  name = 'XML importado'
}) => {
  const colors = parseBeadPaletteXml(xmlText);
  return {
    id: `custom-${Date.now()}`,
    brand,
    brandLabel: brand === 'custom' ? 'Personalizada' : brand,
    name,
    source: 'xml',
    colors
  };
};
