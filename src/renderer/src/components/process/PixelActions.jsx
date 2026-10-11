import React, { useState } from 'react';
import pixelArt from "../../../../../public/images/pixel_process.svg"
import { IoChevronBackCircle } from "react-icons/io5";
import {
  BEAD_BRANDS,
  BUILTIN_BEAD_PALETTES,
  createCustomPaletteFromXml,
  getPaletteById,
  getPalettesByBrand
} from '../../utils/hamaPalette';
import { buildBeadTemplate, cellsForAxis } from '../../utils/quantize';
import {
  applySelection,
  getActiveColors,
  getAvailableColors,
  loadOwnedColors,
  saveOwnedColors
} from '../../utils/ownedColors';
import ColorPicker from './ColorPicker';


const PixelActions = ({ imageIn, getSourceCanvas, onProcessImage, onRestart, defaultBeadWidth, defaultBeadHeight, hasResult }) => {
  const defaultBrand = BEAD_BRANDS[0]?.value || 'hama';
  const defaultPalette = getPalettesByBrand(defaultBrand)[0] || BUILTIN_BEAD_PALETTES[0];
  const [pixelCountReference, setPixelCountReference] = useState(defaultBeadWidth || 52);
  const [direction, setDirection] = useState("ancho");
  const [sizeMode, setSizeMode] = useState(defaultBeadWidth ? 'exact' : 'custom');
  const [exactBeadWidth, setExactBeadWidth] = useState(defaultBeadWidth || 58);
  const [exactBeadHeight, setExactBeadHeight] = useState(defaultBeadHeight || 58);
  const [boardPreset, setBoardPreset] = useState('29');
  const [selectedBrand, setSelectedBrand] = useState(defaultBrand);
  const [selectedPaletteId, setSelectedPaletteId] = useState(defaultPalette?.id || '');
  const [customPalette, setCustomPalette] = useState(null);
  const [xmlPaletteName, setXmlPaletteName] = useState('XML importado');
  const [xmlInput, setXmlInput] = useState('');
  const [xmlError, setXmlError] = useState('');
  const [maxColors, setMaxColors] = useState(0);
  const [dither, setDither] = useState(false);
  const [includeSpecial, setIncludeSpecial] = useState(false);
  const [ownedMap, setOwnedMap] = useState(loadOwnedColors);
  const borderWidth = 0.8;
  const selectedBuiltinPalette = getPaletteById(selectedPaletteId);
  const basePalette = customPalette || selectedBuiltinPalette || defaultPalette;
  const specialCount = basePalette.colors.filter((color) => color.special).length;
  // Por defecto se excluyen los beads translucidos, glow, glitter, etc.
  // ownedIds === null significa que el usuario tiene todos los colores.
  const ownedIds = ownedMap[basePalette.id] ?? null;
  const availableColors = getAvailableColors(basePalette.colors, includeSpecial);
  const activePalette = {
    ...basePalette,
    colors: getActiveColors(basePalette.colors, { includeSpecial, ownedIds })
  };
  const handleOwnedChange = (selectedIds) => {
    const next = {
      ...ownedMap,
      [basePalette.id]: applySelection(basePalette.colors, includeSpecial, ownedIds, selectedIds)
    };
    setOwnedMap(next);
    saveOwnedColors(next);
  };
  const brandPalettes = getPalettesByBrand(selectedBrand);
  const boardOptions = [
    { label: '1 tablero (29 beads de ancho)', value: '29' },
    { label: '2 tableros (58 beads de ancho)', value: '58' },
    { label: '3 tableros (87 beads de ancho)', value: '87' },
    { label: '4 tableros (116 beads de ancho)', value: '116' }
  ];

  const handlePixelCountReferenceChange = (event) => {
    const newWidthCount = parseInt(event.target.value, 10);
    setPixelCountReference(newWidthCount);
  };

  const handleBrandChange = (event) => {
    const nextBrand = event.target.value;
    const nextPalette = getPalettesByBrand(nextBrand)[0] || null;

    setSelectedBrand(nextBrand);
    setSelectedPaletteId(nextPalette?.id || '');
    setCustomPalette(null);
    setXmlError('');
  };

  const handleImportXml = () => {
    try {
      const importedPalette = createCustomPaletteFromXml({
        xmlText: xmlInput,
        brand: selectedBrand,
        name: xmlPaletteName.trim() || 'XML importado'
      });
      setCustomPalette(importedPalette);
      setXmlError('');
    } catch (error) {
      setCustomPalette(null);
      setXmlError(error.message || 'No se pudo importar el XML');
    }
  };

  const handleProcessImage = async () => {
    if (!imageIn) {
      console.error('No hay imagen para procesar');
      return;
    }

    try {
      // Imagen original con los filtros actuales aplicados
      const sourceCanvas = await getSourceCanvas();

      if (sourceCanvas.width <= 0 || sourceCanvas.height <= 0) {
        console.error('Image dimensions are invalid');
        return;
      }

      let numCellsWidth;
      let numCellsHeight;
      let referenceCount;

      if (sizeMode === 'exact') {
        numCellsWidth = exactBeadWidth;
        numCellsHeight = exactBeadHeight;
        referenceCount = numCellsWidth;
      } else {
        const numberCells = sizeMode === 'boards'
          ? parseInt(boardPreset, 10)
          : pixelCountReference;
        referenceCount = numberCells;

        if (!Number.isFinite(numberCells) || numberCells <= 0) {
          console.error('Cantidad de beads inválida');
          return;
        }

        if (direction.includes('ancho')) {
          numCellsWidth = numberCells;
          numCellsHeight = cellsForAxis(sourceCanvas.height, sourceCanvas.width, numberCells);
        } else {
          numCellsHeight = numberCells;
          numCellsWidth = cellsForAxis(sourceCanvas.width, sourceCanvas.height, numberCells);
        }
      }

      const { dataUrl, stats } = buildBeadTemplate(sourceCanvas, {
        cellsW: numCellsWidth,
        cellsH: numCellsHeight,
        palette: activePalette,
        borderWidth,
        maxColors,
        dither
      });

      onProcessImage(dataUrl, {
        ...stats,
        paletteName: activePalette.name,
        brandLabel: activePalette.brandLabel,
        brand: activePalette.brand,
        source: activePalette.source,
        sizingMode: sizeMode,
        referenceAxis: direction,
        referenceCount,
        maxColors,
        dither
      });
    } catch (error) {
      console.error('Error generando la plantilla', error);
    }
  };

  return (
    <div className='w-full font-changa text-xl'>
      <div className='text-2xl font-bold mb-4 text-gray-700 text-center'>Manipulación de píxeles</div>

      <div className='flex justify-center mb-16'>
        <img src={pixelArt} width={80} />
      </div>

      <div className='flex gap-4 items-baseline mb-4'>
        <div className='w-1/3'>Marca:</div>
        <select
          className='w-2/3 border rounded-lg bg-gray-50'
          value={selectedBrand}
          onChange={handleBrandChange}
        >
          {BEAD_BRANDS.map((brand) => (
            <option key={brand.value} value={brand.value}>{brand.label}</option>
          ))}
        </select>
      </div>

      <div className='flex gap-4 items-baseline mb-4'>
        <div className='w-1/3'>Paleta:</div>
        <select
          className='w-2/3 border rounded-lg bg-gray-50'
          value={customPalette ? '__custom__' : selectedPaletteId}
          onChange={(event) => {
            setSelectedPaletteId(event.target.value);
            setCustomPalette(null);
            setXmlError('');
          }}
        >
          {brandPalettes.map((palette) => (
            <option key={palette.id} value={palette.id}>{`${palette.name} (${palette.colors.length} colores)`}</option>
          ))}
          {customPalette ? <option value={'__custom__'}>{`${customPalette.name} (XML)`}</option> : null}
        </select>
      </div>

      <div className='mb-4 border rounded-lg p-3 bg-blue-50/60 text-sm text-blue-900'>
        Estás usando una paleta interna del sistema. Importar XML es opcional.
      </div>

      <details className='mb-4 border rounded-lg p-3 bg-gray-50/70'>
        <summary className='text-sm font-semibold cursor-pointer select-none'>
          Importar XML de Bead Surge (opcional)
        </summary>

        <p className='text-xs text-gray-600 mt-2 mb-2'>
          Solo úsalo si quieres cargar una paleta externa. Si no, puedes continuar con las paletas internas.
        </p>

        <input
          type='text'
          value={xmlPaletteName}
          onChange={(event) => setXmlPaletteName(event.target.value)}
          className='w-full border rounded-lg bg-white p-2 text-sm mb-2'
          placeholder='Nombre de la paleta importada'
        />

        <textarea
          value={xmlInput}
          onChange={(event) => setXmlInput(event.target.value)}
          className='w-full border rounded-lg bg-white p-2 text-xs h-24'
          placeholder='Pegue aquí el contenido del archivo Colours.xml'
        />

        {xmlError ? <div className='text-xs text-red-600 mt-1'>{xmlError}</div> : null}

        <div className='mt-2 flex justify-end'>
          <button
            onClick={handleImportXml}
            disabled={!xmlInput.trim()}
            className='px-2 py-1 bg-teal-700 text-white rounded-lg border border-teal-900 disabled:bg-gray-500'
          >
            Importar XML
          </button>
        </div>
      </details>

      <div className='flex gap-4 items-baseline mb-4'>
        <div className='w-1/3'>Modo de tamaño:</div>
        <select
          className='w-2/3 border rounded-lg bg-gray-50'
          value={sizeMode}
          onChange={(event) => {
            setSizeMode(event.target.value);
            setDirection('ancho');
          }}
        >
          <option value={'custom'}>Personalizado</option>
          <option value={'boards'}>Basado en tableros estándar</option>
          <option value={'exact'}>Dimensiones exactas (de recorte)</option>
        </select>
      </div>

      {sizeMode === 'exact' ? (
        <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <div className='text-sm font-semibold text-blue-800 mb-2'>Dimensiones exactas de beads</div>
          <div className='flex gap-4 items-end'>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-blue-700'>Ancho (beads)</label>
              <input
                type='number' min={5} max={500} value={exactBeadWidth}
                onChange={(ev) => setExactBeadWidth(Math.max(1, parseInt(ev.target.value) || 1))}
                className='border rounded-lg bg-white px-2 py-1 text-sm w-24'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-blue-700'>Alto (beads)</label>
              <input
                type='number' min={5} max={500} value={exactBeadHeight}
                onChange={(ev) => setExactBeadHeight(Math.max(1, parseInt(ev.target.value) || 1))}
                className='border rounded-lg bg-white px-2 py-1 text-sm w-24'
              />
            </div>
            <div className='text-sm text-blue-700 pb-1'>
              → {exactBeadWidth * exactBeadHeight} beads en total
            </div>
          </div>
        </div>
      ) : sizeMode === 'custom' ? (
        <div className='flex gap-4 items-baseline mb-4'>
          <div className='w-1/3'>Cantidad de beads:</div>
          <select
            className='w-1/3 border rounded-lg bg-gray-50'
            value={direction}
            onChange={(event) => setDirection(event.target.value)}
          >
            <option value={'ancho'}>Ancho</option>
            <option value={'alto'}>Alto</option>
          </select>
          <input
            type="number"
            value={pixelCountReference}
            onChange={handlePixelCountReferenceChange}
            className='bg-gray-50 border w-1/3 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
            min={5}
          />
        </div>
      ) : sizeMode === 'boards' ? (
        <div className='flex gap-4 items-baseline mb-4'>
          <div className='w-1/3'>Tableros:</div>
          <select
            className='w-2/3 border rounded-lg bg-gray-50'
            value={boardPreset}
            onChange={(event) => setBoardPreset(event.target.value)}
          >
            {boardOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      ) : null}

      {specialCount > 0 ? (
        <label className='flex gap-3 items-center mb-4 cursor-pointer select-none text-base'>
          <input type='checkbox' checked={includeSpecial} onChange={(event) => setIncludeSpecial(event.target.checked)} />
          <span>Incluir beads especiales ({specialCount}: translúcidos, glow, glitter…)</span>
        </label>
      ) : null}

      <details className='mb-4 border rounded-lg p-3 bg-gray-50/70'>
        <summary className='text-base font-semibold cursor-pointer select-none'>
          Mis colores ({activePalette.colors.length} disponibles)
        </summary>
        <p className='text-xs text-gray-600 mt-2 mb-2'>
          Marca solo los beads que tienes: la plantilla usará únicamente esos colores. Se recuerda por paleta.
        </p>
        <ColorPicker colors={availableColors} ownedIds={ownedIds} onChange={handleOwnedChange} />
      </details>

      <div className='flex gap-4 items-baseline mb-4'>
        <div className='w-1/3'>Máx. colores:</div>
        <input
          type='number'
          min={0}
          max={activePalette.colors.length}
          value={maxColors}
          onChange={(event) => setMaxColors(Math.max(0, parseInt(event.target.value, 10) || 0))}
          className='w-1/3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5'
        />
        <div className='w-1/3 text-xs text-gray-600'>0 = sin límite</div>
      </div>

      <label className='flex gap-3 items-center mb-4 cursor-pointer select-none'>
        <input type='checkbox' checked={dither} onChange={(event) => setDither(event.target.checked)} />
        <span>Difuminado de color (dithering)</span>
      </label>

      <div className='text-sm italic'>
        <p>La imagen se convierte a una grilla de beads y cada celda se ajusta al color más cercano de la paleta activa.</p>
      </div>

      <div className='text-sm italic mt-1'>
        <p>{`El valor de referencia será el ${direction} de la imagen y la otra dimensión se ajustará automaticamente.`}</p>
      </div>

      <div className='text-xs text-gray-600 mt-2'>
        Paleta activa: {activePalette.name} - {activePalette.colors.length} colores
      </div>

      {activePalette.colors.length === 0 ? (
        <div className='text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 mt-2'>
          No hay colores seleccionados. Marca al menos uno en «Mis colores».
        </div>
      ) : null}

      {!imageIn ? (
        <div className='text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 mt-2'>
          No hay imagen cargada. Vuelve al paso anterior y selecciona o recorta una imagen.
        </div>
      ) : null}

      <div className='flex justify-end mt-24 gap-4'>
        <button
          onClick={handleProcessImage}
          className='p-2 bg-blue-700 rounded-xl text-white border border-blue-900 hover:bg-blue-800 disabled:bg-gray-700'
          disabled={
            !imageIn ||
            activePalette.colors.length === 0 ||
            (sizeMode !== 'exact' && (pixelCountReference === 0 || !Number.isFinite(pixelCountReference))) ||
            (sizeMode === 'exact' && (exactBeadWidth <= 0 || exactBeadHeight <= 0))
          }
        >
          Generar plantilla
        </button>
        {hasResult ? <button onClick={onRestart} className='p-2 bg-amber-700 rounded-xl text-3xl text-white border border-amber-900 hover:bg-amber-800'><IoChevronBackCircle /></button> : null}
      </div>
    </div>
  );
};

export default PixelActions;
