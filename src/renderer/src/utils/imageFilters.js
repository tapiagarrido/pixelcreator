export const DEFAULT_FILTERS = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  grayscale: 0,
  blur: 0
};

export const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    // src se asigna al final para no perder el evento load con imagenes en cache
    image.src = src;
  });

// Devuelve un canvas con los filtros aplicados sobre la imagen original.
export const buildFilteredCanvas = async (src, filters = DEFAULT_FILTERS) => {
  const { brightness, contrast, saturation, grayscale, blur } = { ...DEFAULT_FILTERS, ...filters };
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.filter =
    `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) grayscale(${grayscale})` +
    (blur > 0 ? ` blur(${blur}px)` : '');
  ctx.drawImage(image, 0, 0);
  return canvas;
};
