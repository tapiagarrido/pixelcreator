# PixelCreator

Aplicación de escritorio (Electron + React) que convierte una imagen en una plantilla para
beads (Hama, Perler): recorte a la cuadrícula, filtros, ajuste a la paleta de colores y conteo
de beads por color.

## Flujo

1. **Ajustar imagen**: elegir la cuadrícula (tableros) y recortar con la proporción correcta.
2. **Procesar imagen**: aplicar filtros, elegir marca/paleta (o importar un XML de Bead Surge) y generar la plantilla.
3. Descargar el PNG y revisar el resumen de beads por color.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build:win     # Windows (nsis)
npm run build:mac     # macOS (dmg)
npm run build:linux   # Linux (AppImage, deb)
```

La configuración de empaquetado está en `electron-builder.yml`.
