export const HAMA_MIDI_BASE_PALETTE = [
  { id: 'white', name: 'Blanco', hex: '#F4F4F4' },
  { id: 'black', name: 'Negro', hex: '#1A1A1A' },
  { id: 'gray', name: 'Gris', hex: '#8A8A8A' },
  { id: 'dark-brown', name: 'Cafe Oscuro', hex: '#5B3A29' },
  { id: 'brown', name: 'Cafe', hex: '#8C5A3C' },
  { id: 'beige', name: 'Beige', hex: '#D8C4A3' },
  { id: 'dark-red', name: 'Rojo Oscuro', hex: '#7B1E1E' },
  { id: 'red', name: 'Rojo', hex: '#D53333' },
  { id: 'orange', name: 'Naranja', hex: '#EB7C2D' },
  { id: 'yellow', name: 'Amarillo', hex: '#F2D33B' },
  { id: 'dark-green', name: 'Verde Oscuro', hex: '#2F6C3A' },
  { id: 'green', name: 'Verde', hex: '#61A84C' },
  { id: 'mint', name: 'Menta', hex: '#A5D7B5' },
  { id: 'dark-blue', name: 'Azul Oscuro', hex: '#254A8A' },
  { id: 'blue', name: 'Azul', hex: '#3B7ED0' },
  { id: 'light-blue', name: 'Azul Claro', hex: '#89BFEF' },
  { id: 'purple', name: 'Morado', hex: '#7D4BA3' },
  { id: 'pink', name: 'Rosa', hex: '#EB9DC3' },
  { id: 'skin-light', name: 'Piel Clara', hex: '#F2C7A4' },
  { id: 'skin-dark', name: 'Piel Oscura', hex: '#C68D67' }
]

export const PERLER_BASIC_PALETTE = [
  { id: 'perler-white', name: 'White', hex: '#F4F4F2' },
  { id: 'perler-black', name: 'Black', hex: '#171717' },
  { id: 'perler-gray', name: 'Gray', hex: '#8B8F94' },
  { id: 'perler-charcoal', name: 'Charcoal', hex: '#51545C' },
  { id: 'perler-brown', name: 'Brown', hex: '#7F4A2F' },
  { id: 'perler-tan', name: 'Tan', hex: '#CCAE85' },
  { id: 'perler-red', name: 'Red', hex: '#C3262E' },
  { id: 'perler-raspberry', name: 'Raspberry', hex: '#8D2045' },
  { id: 'perler-orange', name: 'Orange', hex: '#EB6D22' },
  { id: 'perler-cheddar', name: 'Cheddar', hex: '#ECA430' },
  { id: 'perler-yellow', name: 'Yellow', hex: '#F0D437' },
  { id: 'perler-kiwi-lime', name: 'Kiwi Lime', hex: '#8DBA3E' },
  { id: 'perler-green', name: 'Green', hex: '#2E8D45' },
  { id: 'perler-emerald', name: 'Emerald', hex: '#1D6E58' },
  { id: 'perler-light-blue', name: 'Light Blue', hex: '#7ABCE3' },
  { id: 'perler-blue', name: 'Blue', hex: '#2F6BB1' },
  { id: 'perler-dark-blue', name: 'Dark Blue', hex: '#1E3E74' },
  { id: 'perler-purple', name: 'Purple', hex: '#6C4799' },
  { id: 'perler-pink', name: 'Pink', hex: '#F0A4C6' },
  { id: 'perler-peach', name: 'Peach', hex: '#F2C6A4' }
]

export const BUILTIN_BEAD_PALETTES = [
  {
    id: 'hama-midi-base',
    brand: 'hama',
    brandLabel: 'Hama',
    name: 'Hama Midi (base)',
    source: 'manual-base',
    colors: HAMA_MIDI_BASE_PALETTE
  },
  {
    id: 'perler-basic',
    brand: 'perler',
    brandLabel: 'Perler',
    name: 'Perler (basic)',
    source: 'manual-base',
    colors: PERLER_BASIC_PALETTE
  }
]

export const BEAD_BRANDS = Array.from(
  BUILTIN_BEAD_PALETTES.reduce((brandMap, palette) => {
    brandMap.set(palette.brand, { value: palette.brand, label: palette.brandLabel })
    return brandMap
  }, new Map()).values()
)

export const getPalettesByBrand = (brand) =>
  BUILTIN_BEAD_PALETTES.filter((palette) => palette.brand === brand)

export const getPaletteById = (paletteId) =>
  BUILTIN_BEAD_PALETTES.find((palette) => palette.id === paletteId)

const hexToRgb = (hex) => {
  const cleanHex = hex.replace('#', '')
  let expandedHex = cleanHex

  if (cleanHex.length === 3) {
    expandedHex = cleanHex
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
  }

  return {
    r: parseInt(expandedHex.substring(0, 2), 16),
    g: parseInt(expandedHex.substring(2, 4), 16),
    b: parseInt(expandedHex.substring(4, 6), 16)
  }
}

const calculateDistance = (colorA, colorB) => {
  const dr = colorA.r - colorB.r
  const dg = colorA.g - colorB.g
  const db = colorA.b - colorB.b

  return dr * dr + dg * dg + db * db
}

export const findClosestPaletteColor = (rgbColor, palette = HAMA_MIDI_BASE_PALETTE) => {
  if (!palette || palette.length === 0) {
    return { id: 'empty-palette', name: 'Sin color', hex: '#000000' }
  }

  let bestMatch = palette[0]
  let bestDistance = Number.POSITIVE_INFINITY

  for (const paletteColor of palette) {
    const paletteRgb = hexToRgb(paletteColor.hex)
    const distance = calculateDistance(rgbColor, paletteRgb)

    if (distance < bestDistance) {
      bestDistance = distance
      bestMatch = paletteColor
    }
  }

  return bestMatch
}

const clampToByte = (value) => Math.max(0, Math.min(255, Number.parseInt(value, 10)))

const componentToHex = (value) => clampToByte(value).toString(16).padStart(2, '0').toUpperCase()

const rgbToHex = (r, g, b) => `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const tryParseRgbString = (input) => {
  if (!input || typeof input !== 'string') {
    return null
  }

  const parts = input
    .split(/[\s,;]+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  if (parts.length < 3) {
    return null
  }

  const [r, g, b] = parts

  if ([r, g, b].some((component) => Number.isNaN(Number.parseInt(component, 10)))) {
    return null
  }

  return rgbToHex(r, g, b)
}

const readColorName = (node, fallback) =>
  node.getAttribute('name') ||
  node.getAttribute('Name') ||
  node.getAttribute('colour') ||
  node.getAttribute('Colour') ||
  node.getAttribute('color') ||
  node.getAttribute('Color') ||
  node.getAttribute('description') ||
  fallback

const readColorHex = (node) => {
  const hexCandidate =
    node.getAttribute('hex') ||
    node.getAttribute('Hex') ||
    node.getAttribute('HEX') ||
    node.getAttribute('html') ||
    node.getAttribute('HTML')

  if (hexCandidate) {
    const cleanHex = hexCandidate.replace('#', '').trim()
    if (/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
      return `#${cleanHex.toUpperCase()}`
    }
  }

  const rgbCandidate =
    node.getAttribute('rgb') ||
    node.getAttribute('RGB') ||
    node.getAttribute('Rgb') ||
    node.getAttribute('value') ||
    node.getAttribute('Value')

  const parsedRgb = tryParseRgbString(rgbCandidate)
  if (parsedRgb) {
    return parsedRgb
  }

  const red = node.getAttribute('r') || node.getAttribute('R') || node.getAttribute('red')
  const green = node.getAttribute('g') || node.getAttribute('G') || node.getAttribute('green')
  const blue = node.getAttribute('b') || node.getAttribute('B') || node.getAttribute('blue')

  if (red !== null && green !== null && blue !== null) {
    return rgbToHex(red, green, blue)
  }

  return null
}

export const parseBeadPaletteXml = (xmlText) => {
  if (!xmlText || typeof xmlText !== 'string') {
    throw new Error('El XML esta vacio')
  }

  const parser = new DOMParser()
  const documentXml = parser.parseFromString(xmlText, 'text/xml')
  const parserErrors = documentXml.getElementsByTagName('parsererror')

  if (parserErrors.length > 0) {
    throw new Error('No se pudo parsear el XML')
  }

  const colorLikeNodes = Array.from(documentXml.getElementsByTagName('*')).filter((node) => {
    const tag = node.tagName.toLowerCase()
    return tag.includes('color') || tag.includes('colour') || tag === 'item'
  })

  const colors = []

  colorLikeNodes.forEach((node, index) => {
    const hex = readColorHex(node)
    if (!hex) {
      return
    }

    const name = readColorName(node, `Color ${index + 1}`)
    const idSeed = node.getAttribute('id') || node.getAttribute('ID') || name
    colors.push({
      id: `${slugify(idSeed || `color-${index + 1}`)}-${index + 1}`,
      name,
      hex
    })
  })

  if (colors.length === 0) {
    throw new Error('El XML no contiene colores reconocibles')
  }

  return colors
}

export const createCustomPaletteFromXml = ({
  xmlText,
  brand = 'custom',
  name = 'XML importado'
}) => {
  const colors = parseBeadPaletteXml(xmlText)
  return {
    id: `custom-${Date.now()}`,
    brand,
    brandLabel: brand === 'custom' ? 'Personalizada' : brand,
    name,
    source: 'xml',
    colors
  }
}
