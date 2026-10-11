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
npm run build:linux   # Linux (AppImage, deb, snap)
npm run build:snap    # solo el snap
```

La configuración de empaquetado está en `electron-builder.yml`.

## Paletas de colores

Los colores de Hama, Perler, Nabbi y Artkal (códigos, nombres y RGB medido sobre beads reales)
vienen de [maxcleme/beadcolors](https://github.com/maxcleme/beadcolors) (licencia MIT). Para
regenerarlos: `node scripts/gen-palettes.mjs`.

## Publicar en la Snap Store

El snap se genera con electron-builder (`snap` en `electron-builder.yml`, base `core22`, confinamiento
estricto). Para subirlo hay que usar tu cuenta de Ubuntu One:

```bash
sudo snap install snapcraft --classic
snapcraft login
snapcraft register pixelcreator          # reserva el nombre (una sola vez)
npm run build:snap                       # genera dist/pixelcreator_<versión>_amd64.snap
snapcraft upload --release=edge dist/pixelcreator_1.0.0_amd64.snap
```

Conviene probarlo primero en el canal `edge` y pasarlo a `stable` cuando esté verificado
(`snapcraft release pixelcreator <revisión> stable`). Cada subida necesita una versión nueva
en `package.json`.

## Licencia

[MIT](LICENSE) © Gustavo Adolfo Garrido Tapia. Puedes usar, modificar y redistribuir este
programa libremente, incluso con fines comerciales, conservando el aviso de copyright.

Los datos de color de los fabricantes (`src/renderer/src/data/beadPalettes.json`) provienen de
[maxcleme/beadcolors](https://github.com/maxcleme/beadcolors), también bajo licencia MIT
(Copyright (c) 2020 maxcleme).
