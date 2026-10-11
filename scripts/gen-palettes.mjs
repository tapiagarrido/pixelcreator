// Genera src/renderer/src/data/beadPalettes.json con los colores reales de cada fabricante.
// Fuente: https://github.com/maxcleme/beadcolors (licencia MIT), RGB medido sobre beads fisicos
// y mantenido por la comunidad. Uso: node scripts/gen-palettes.mjs
import { writeFileSync } from 'node:fs';

const BASE = 'https://raw.githubusercontent.com/maxcleme/beadcolors/master/gen/v1';

// brand = agrupacion en la UI; file = CSV de origen
const PALETTES = [
  { id: 'hama-midi', brand: 'hama', brandLabel: 'Hama', name: 'Hama Midi', file: 'hama' },
  { id: 'perler', brand: 'perler', brandLabel: 'Perler', name: 'Perler', file: 'perler' },
  { id: 'nabbi', brand: 'nabbi', brandLabel: 'Nabbi', name: 'Nabbi', file: 'nabbi' },
  {
    id: 'artkal-s',
    brand: 'artkal',
    brandLabel: 'Artkal',
    name: 'Artkal S (5 mm)',
    file: 'artkal_s'
  }
];

// Beads que no sirven para rellenar un diseno (translucidos, brillantes, con efectos)
const SPECIAL =
  /transparent|translucent|clear|glow|luminous|glitter|sparkle|metallic|stripe|speckle|tweed|marble/i;

const parseCsv = (text) =>
  text
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      // codigo,nombre,r,g,b,#hex,contribuidor
      const parts = line.split(',');
      const [code, name, r, g, b, hex] = parts;
      return {
        code: code.trim(),
        name: name.trim(),
        r: +r,
        g: +g,
        b: +b,
        hex: hex.trim().toUpperCase()
      };
    });

async function main() {
  const output = [];

  for (const palette of PALETTES) {
    const response = await fetch(`${BASE}/${palette.file}.csv`);
    if (!response.ok) throw new Error(`${palette.file}.csv: HTTP ${response.status}`);

    const colors = parseCsv(await response.text()).map((row) => {
      if (
        !/^#[0-9A-F]{6}$/.test(row.hex) ||
        [row.r, row.g, row.b].some((v) => !(v >= 0 && v <= 255))
      ) {
        throw new Error(`Fila invalida en ${palette.file}: ${JSON.stringify(row)}`);
      }
      const color = {
        id: `${palette.id}-${row.code}`,
        code: row.code,
        name: row.name,
        hex: row.hex
      };
      return SPECIAL.test(row.name) ? { ...color, special: true } : color;
    });

    const ids = new Set(colors.map((c) => c.id));
    if (ids.size !== colors.length) throw new Error(`Codigos duplicados en ${palette.file}`);

    output.push({
      id: palette.id,
      brand: palette.brand,
      brandLabel: palette.brandLabel,
      name: palette.name,
      source: 'beadcolors',
      colors
    });
  }

  writeFileSync(
    new URL('../src/renderer/src/data/beadPalettes.json', import.meta.url),
    JSON.stringify(output, null, 2) + '\n'
  );
  console.log(output.map((p) => `${p.name}: ${p.colors.length} colores`).join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
