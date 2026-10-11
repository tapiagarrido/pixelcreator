const STORAGE_KEY = 'pixelcreator.ownedColors';

// Colores que se pueden elegir: los especiales (translucidos, glow...) solo si se piden.
export const getAvailableColors = (colors, includeSpecial) =>
  includeSpecial ? colors : colors.filter((color) => !color.special);

// ownedIds === null significa "tengo todos".
export const getActiveColors = (colors, { includeSpecial = false, ownedIds = null } = {}) => {
  const available = getAvailableColors(colors, includeSpecial);
  if (!ownedIds) return available;
  const owned = new Set(ownedIds);
  return available.filter((color) => owned.has(color.id));
};

/**
 * Nueva lista de colores propios tras editar la seleccion visible (`selectedIds`).
 * Los colores ocultos (especiales no mostrados) conservan su estado anterior.
 * Devuelve null si al final se tienen todos.
 */
export const applySelection = (colors, includeSpecial, prevOwnedIds, selectedIds) => {
  const available = new Set(getAvailableColors(colors, includeSpecial).map((c) => c.id));
  const prev = prevOwnedIds ? new Set(prevOwnedIds) : null;
  const hiddenOwned = colors
    .filter((c) => !available.has(c.id) && (prev === null || prev.has(c.id)))
    .map((c) => c.id);
  const next = [...selectedIds.filter((id) => available.has(id)), ...hiddenOwned];
  return next.length === colors.length ? null : next;
};

export const loadOwnedColors = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

// Solo se guardan las paletas integradas; las importadas por XML cambian de id en cada carga.
export const saveOwnedColors = (map) => {
  try {
    const persistable = Object.fromEntries(
      Object.entries(map).filter(([paletteId, ids]) => ids && !paletteId.startsWith('custom-'))
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch {
    // sin almacenamiento disponible: la seleccion dura solo la sesion
  }
};
