import React, { useState, useRef, useEffect } from 'react';
import { GrCaretNext, GrDownload } from 'react-icons/gr';
import { useLocation } from 'react-router-dom';
import PixelActions from '../components/process/PixelActions';
import { getCellIndexAt, renderBeadsOnly, renderPrintableSheet } from '../utils/printableSheet';
import { setCell, withCells } from '../utils/templateEdit';
import { buildShoppingListCsv } from '../utils/shoppingList';
import { buildTemplatePdf } from '../utils/exportPdf';
import { DEFAULT_FILTERS, buildFilteredCanvas, imageToDataUrl } from '../utils/imageFilters';
import { serializeProject } from '../utils/project';
import OpenProjectButton from '../components/OpenProjectButton';

const FILTER_CONTROLS = [
  { key: 'brightness', label: 'Brillo', min: 0, max: 2, step: 0.1 },
  { key: 'contrast', label: 'Contraste', min: 0, max: 2, step: 0.1 },
  { key: 'saturation', label: 'Saturación', min: 0, max: 2, step: 0.1 },
  { key: 'blur', label: 'Desenfoque', min: 0, max: 20, step: 1 },
  { key: 'grayscale', label: 'Escala de Grises', min: 0, max: 1, step: 0.1 }
];

const FilterControls = ({ filters, onChange }) => (
  <div>
    {FILTER_CONTROLS.map(({ key, label, min, max, step }, index) => (
      <div key={key} className={`flex gap-2 items-center ${index > 0 ? 'mt-2' : ''}`}>
        <div>{label}</div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={filters[key]}
          onChange={(e) => onChange(key, Number(e.target.value))}
        />
        <span>{filters[key]}</span>
      </div>
    ))}
  </div>
);

const ProcessElementPage = () => {
  const location = useLocation();
  const navState = location.state || {};

  const openedProject = navState.project || null;

  // `image` es siempre la imagen original; la plantilla generada vive aparte en `templateInfo`.
  const [image, setImage] = useState(openedProject?.image || navState.imageSrc || null);
  const [templateInfo, setTemplateInfo] = useState(openedProject?.templateInfo || null);
  const [componentPixel, setComponentPixel] = useState(Boolean(openedProject || navState.imageSrc));
  const [filters, setFilters] = useState(openedProject?.filters || DEFAULT_FILTERS);
  const [showNumbers, setShowNumbers] = useState(openedProject?.showNumbers || false);
  const [boardSize, setBoardSize] = useState(openedProject?.boardSize || 29);
  const [error, setError] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  // Edicion manual: herramienta activa, color del pincel e historial para deshacer/rehacer
  const [tool, setTool] = useState('none'); // 'none' | 'paint' | 'pick' | 'erase'
  const [brushColor, setBrushColor] = useState(
    openedProject?.templateInfo?.paletteColors?.[0] || null
  );
  const [history, setHistory] = useState({ undo: [], redo: [] });

  const canvasRef = useRef(null);
  const infoRef = useRef(null);
  const strokeRef = useRef(null);
  if (!strokeRef.current) infoRef.current = templateInfo;

  const clearResult = () => {
    setTemplateInfo(null);
    setTool('none');
    setHistory({ undo: [], redo: [] });
  };

  const handleImageSelected = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      clearResult();
    };
    reader.readAsDataURL(file);
  };

  // Cambiar un filtro invalida la plantilla anterior: hay que generarla de nuevo.
  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    clearResult();
  };

  // Vista previa: la plantilla si existe, si no la imagen original con filtros.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;

    const draw = async () => {
      const ctx = canvas.getContext('2d');
      try {
        if (!image) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
        }

        if (templateInfo) {
          const sheet = renderPrintableSheet(templateInfo, { showNumbers });
          canvas.width = sheet.width;
          canvas.height = sheet.height;
          ctx.drawImage(sheet, 0, 0);
        } else {
          const filtered = await buildFilteredCanvas(image, filters);
          if (cancelled) return;
          canvas.width = filtered.width;
          canvas.height = filtered.height;
          ctx.drawImage(filtered, 0, 0);
        }
      } catch (error) {
        console.error('No se pudo cargar la imagen para previsualizacion', error);
      }
    };

    draw();
    return () => {
      cancelled = true;
    };
  }, [image, templateInfo, showNumbers, filters]);

  const handleProcessImage = (_dataUrl, stats) => {
    setTemplateInfo(stats);
    setError('');
    setHistory({ undo: [], redo: [] });
    setBrushColor(stats.paletteColors?.[0] || null);
  };

  const MAX_HISTORY = 100;

  const handleSelectTool = (nextTool) => {
    setTool((current) => (current === nextTool ? 'none' : nextTool));
  };

  const handleUndo = () => {
    if (history.undo.length === 0 || !templateInfo) return;
    const previous = history.undo[history.undo.length - 1];
    setHistory({ undo: history.undo.slice(0, -1), redo: [...history.redo, templateInfo.cells] });
    setTemplateInfo(withCells(templateInfo, previous));
  };

  const handleRedo = () => {
    if (history.redo.length === 0 || !templateInfo) return;
    const next = history.redo[history.redo.length - 1];
    setHistory({ undo: [...history.undo, templateInfo.cells], redo: history.redo.slice(0, -1) });
    setTemplateInfo(withCells(templateInfo, next));
  };

  // Celda bajo el puntero (el canvas se muestra escalado por CSS)
  const getPointerCell = (event) => {
    const canvas = canvasRef.current;
    const info = infoRef.current;
    if (!canvas || !info) return -1;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * canvas.width) / rect.width;
    const y = ((event.clientY - rect.top) * canvas.height) / rect.height;
    return getCellIndexAt(info, x, y);
  };

  const editCell = (index) => {
    const info = infoRef.current;
    if (!info || index < 0) return;

    if (tool === 'pick') {
      const picked = info.cells[index];
      if (picked) {
        setBrushColor(picked);
        setTool('paint');
      }
      strokeRef.current = null;
      return;
    }

    const color = tool === 'erase' ? null : brushColor;
    if (tool === 'paint' && !color) return;
    const cells = setCell(info.cells, index, color);
    if (cells === info.cells) return;
    // La referencia se actualiza ya mismo: varios eventos del mismo trazo pueden llegar
    // antes del siguiente render y no deben pisarse entre si.
    const next = withCells(info, cells);
    infoRef.current = next;
    setTemplateInfo(next);
  };

  const handlePointerDown = (event) => {
    if (tool === 'none' || !templateInfo) return;
    const index = getPointerCell(event);
    if (index < 0) return;
    try {
      // Mantiene el trazo aunque el puntero salga del canvas
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // puntero no capturable (p. ej. eventos sinteticos): se edita igual
    }
    strokeRef.current = { startCells: templateInfo.cells, lastIndex: index };
    editCell(index);
  };

  const handlePointerMove = (event) => {
    const stroke = strokeRef.current;
    if (!stroke || tool === 'pick') return;
    const index = getPointerCell(event);
    if (index < 0 || index === stroke.lastIndex) return;
    stroke.lastIndex = index;
    editCell(index);
  };

  // Un trazo completo cuenta como un solo paso del historial
  const handlePointerUp = () => {
    const stroke = strokeRef.current;
    strokeRef.current = null;
    const info = infoRef.current;
    if (!stroke || !info || info.cells === stroke.startCells) return;
    setHistory((current) => ({
      undo: [...current.undo, stroke.startCells].slice(-MAX_HISTORY),
      redo: []
    }));
  };

  const downloadDataUrl = (href, prefix) => {
    const link = document.createElement('a');
    link.href = href;
    const fecha = new Date();
    link.download = `${prefix}-${fecha.getDate()}-${fecha.getMonth() + 1}-${fecha.getHours()}${fecha.getMinutes()}.png`;
    link.click();
  };

  // Hoja completa: coordenadas, cuadricula, leyenda con marca/paleta y conteo por color
  const handleDownloadSheet = () => {
    if (!templateInfo) return;
    downloadDataUrl(
      renderPrintableSheet(templateInfo, { showNumbers }).toDataURL('image/png'),
      'plantilla'
    );
  };

  // PDF A4: hoja completa + una pagina por tablero si la plantilla es mas grande que uno
  const handleDownloadPdf = async () => {
    if (!templateInfo) return;
    setExportingPdf(true);
    try {
      const blob = await buildTemplatePdf(templateInfo, { showNumbers, boardSize });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fecha = new Date();
      link.download = `plantilla-${fecha.getDate()}-${fecha.getMonth() + 1}-${fecha.getHours()}${fecha.getMinutes()}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('No se pudo generar el PDF', error);
    } finally {
      setExportingPdf(false);
    }
  };

  // Solo la imagen de beads, sin coordenadas ni leyenda
  const handleDownloadGridOnly = () => {
    if (templateInfo)
      downloadDataUrl(renderBeadsOnly(templateInfo).toDataURL('image/png'), 'plantilla-solo-beads');
  };

  // Lista de compra: beads necesarios por color
  const handleDownloadCsv = () => {
    if (!templateInfo) return;
    const blob = new Blob([buildShoppingListCsv(templateInfo)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fecha = new Date();
    link.download = `lista-beads-${fecha.getDate()}-${fecha.getMonth() + 1}-${fecha.getHours()}${fecha.getMinutes()}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Guarda imagen, filtros y plantilla (con sus ediciones) en un archivo .json
  const handleSaveProject = async () => {
    if (!image) return;
    try {
      const project = serializeProject({
        image: await imageToDataUrl(image),
        filters,
        templateInfo,
        showNumbers,
        boardSize
      });
      const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fecha = new Date();
      link.download = `proyecto-${fecha.getDate()}-${fecha.getMonth() + 1}-${fecha.getHours()}${fecha.getMinutes()}.pixelcreator.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setError('');
    } catch (saveError) {
      console.error('No se pudo guardar el proyecto', saveError);
      setError('No se pudo guardar el proyecto');
    }
  };

  const handleOpenProject = (project) => {
    setImage(project.image);
    setFilters(project.filters);
    setShowNumbers(project.showNumbers);
    setBoardSize(project.boardSize);
    setTemplateInfo(project.templateInfo);
    setBrushColor(project.templateInfo?.paletteColors?.[0] || null);
    setTool('none');
    setHistory({ undo: [], redo: [] });
    setComponentPixel(true);
    setError('');
  };

  const handleRestartComponent = () => {
    setImage(null);
    clearResult();
    setComponentPixel(false);
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="w-full h-[calc(100vh-70px)] overflow-y-auto">
      <div className="flex flex-col lg:flex-row w-full gap-6 lg:gap-8 px-4 pb-8">
        <div className="w-full lg:w-1/2 font-changa text-xl">
          {error ? (
            <div
              role="alert"
              className="mb-4 text-base text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 flex justify-between gap-2"
            >
              <span>{error}</span>
              <button onClick={() => setError('')} aria-label="Cerrar aviso">
                ✕
              </button>
            </div>
          ) : null}
          {componentPixel ? (
            <>
              <div className="flex flex-wrap gap-2 mb-4 text-base">
                <button
                  onClick={handleSaveProject}
                  className="px-3 py-1 bg-white border border-gray-400 rounded-xl hover:bg-gray-100"
                >
                  Guardar proyecto
                </button>
                <OpenProjectButton
                  onOpen={handleOpenProject}
                  onError={setError}
                  className="px-3 py-1 bg-white border border-gray-400 rounded-xl hover:bg-gray-100"
                />
              </div>
              <details className="mb-4 border rounded-lg p-3 bg-gray-50/70">
                <summary className="text-base font-semibold cursor-pointer select-none">
                  Filtros de imagen
                </summary>
                <div className="mt-3">
                  <FilterControls filters={filters} onChange={handleFilterChange} />
                </div>
              </details>
              <PixelActions
                imageIn={image}
                getSourceCanvas={() => buildFilteredCanvas(image, filters)}
                onProcessImage={handleProcessImage}
                onRestart={handleRestartComponent}
                defaultBeadWidth={navState.beadWidth}
                defaultBeadHeight={navState.beadHeight}
                hasResult={Boolean(templateInfo)}
              />
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-2">
                <span>Cargue una imagen</span>
                <OpenProjectButton
                  onOpen={handleOpenProject}
                  onError={setError}
                  className="px-3 py-1 text-base bg-white border border-gray-400 rounded-xl hover:bg-gray-100"
                />
              </div>

              <div className="flex items-center justify-center">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-300  dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-500">
                      <span className="font-semibold">Click para buscar imagen</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-500">SVG, PNG, JPG o webp</p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelected}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="mt-8">
                <FilterControls filters={filters} onChange={handleFilterChange} />
              </div>
              <div className="flex justify-end">
                <button
                  className="flex mt-12 items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 p-2 rounded-xl border-blue-950 border disabled:bg-gray-700"
                  onClick={() => setComponentPixel(true)}
                  disabled={!image}
                >
                  Siguiente
                  <GrCaretNext />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-1/2 relative">
          <div className="max-h-[70vh] overflow-auto border border-gray-200 rounded-xl bg-white/40 p-4">
            <canvas
              ref={canvasRef}
              className={`w-full block ${tool === 'none' ? '' : 'cursor-crosshair'}`}
              style={{ touchAction: tool === 'none' ? 'auto' : 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </div>
          {templateInfo ? (
            <>
              <div className="font-changa w-full flex flex-wrap justify-center items-center gap-3 mt-2 text-base">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showNumbers}
                    onChange={(e) => setShowNumbers(e.target.checked)}
                  />
                  Números en las celdas
                </label>
                <button
                  onClick={handleDownloadSheet}
                  className="flex items-center gap-2 px-3 py-1 text-black bg-amber-200 border border-amber-500 rounded-xl shadow-lg font-bold"
                >
                  <GrDownload /> Descargar plantilla
                </button>
                <label className="flex items-center gap-2">
                  Tablero
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={boardSize}
                    onChange={(e) => setBoardSize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 border rounded-lg bg-white px-2 py-0.5 text-sm"
                  />
                </label>
                <button
                  onClick={handleDownloadPdf}
                  disabled={exportingPdf}
                  className="px-3 py-1 text-black bg-amber-200 border border-amber-500 rounded-xl shadow-lg font-bold disabled:opacity-50"
                >
                  {exportingPdf ? 'Generando…' : 'Descargar PDF'}
                </button>
                <button
                  onClick={handleDownloadCsv}
                  className="px-3 py-1 text-black bg-gray-100 border border-gray-400 rounded-xl"
                >
                  Lista (CSV)
                </button>
                <button
                  onClick={handleDownloadGridOnly}
                  className="px-3 py-1 text-black bg-gray-100 border border-gray-400 rounded-xl"
                >
                  Solo beads
                </button>
              </div>

              <div className="font-changa w-full mt-3 text-base border border-gray-200 rounded-xl bg-white/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Editar:</span>
                  {[
                    ['paint', 'Pincel'],
                    ['pick', 'Pipeta'],
                    ['erase', 'Borrar']
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => handleSelectTool(key)}
                      aria-pressed={tool === key}
                      className={`px-3 py-1 rounded-xl border ${tool === key ? 'bg-blue-700 text-white border-blue-900' : 'bg-white border-gray-400'}`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={handleUndo}
                    disabled={history.undo.length === 0}
                    className="px-3 py-1 rounded-xl border bg-white border-gray-400 disabled:opacity-40"
                  >
                    Deshacer
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={history.redo.length === 0}
                    className="px-3 py-1 rounded-xl border bg-white border-gray-400 disabled:opacity-40"
                  >
                    Rehacer
                  </button>
                </div>

                {tool !== 'none' ? (
                  <div className="mt-2">
                    <div className="text-sm text-gray-600 mb-1">
                      {tool === 'paint'
                        ? `Color del pincel: ${brushColor ? `${brushColor.code ? `${brushColor.code} · ` : ''}${brushColor.name}` : '-'}`
                        : null}
                      {tool === 'pick'
                        ? 'Haz clic en una celda para copiar su color al pincel.'
                        : null}
                      {tool === 'erase'
                        ? 'Haz clic o arrastra sobre las celdas para vaciarlas.'
                        : null}
                    </div>
                    {tool === 'paint' ? (
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1">
                        {(templateInfo?.paletteColors || []).map((color) => (
                          <button
                            key={color.id}
                            title={`${color.code ? `${color.code} · ` : ''}${color.name}`}
                            aria-label={`${color.code || ''} ${color.name}`}
                            aria-pressed={brushColor?.id === color.id}
                            onClick={() => setBrushColor(color)}
                            style={{ backgroundColor: color.hex }}
                            className={`w-6 h-6 rounded border ${brushColor?.id === color.id ? 'border-black ring-2 ring-blue-500' : 'border-black/20'}`}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {templateInfo ? (
                <div className="font-changa bg-white/70 rounded-xl border border-gray-200 p-4 mt-4 mx-8 max-h-52 overflow-y-auto">
                  <div className="font-bold text-lg mb-2">Resumen de plantilla</div>
                  <div className="text-sm">
                    <div>
                      Tamaño: {templateInfo.widthBeads} x {templateInfo.heightBeads} beads
                    </div>
                    <div>Total estimado: {templateInfo.totalBeads} beads</div>
                    {templateInfo.emptyCells > 0 ? (
                      <div>Celdas vacías (transparentes): {templateInfo.emptyCells}</div>
                    ) : null}
                    <div>Paleta: {templateInfo.paletteName}</div>
                  </div>

                  <div className="mt-3 text-sm font-semibold">Conteo por color</div>
                  <div className="mt-1 space-y-1">
                    {templateInfo.colorUsage.map((color) => (
                      <div
                        key={color.id}
                        className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-2 py-1"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-4 h-4 rounded border border-black/20"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.code ? `${color.code} · ${color.name}` : color.name}</span>
                        </div>
                        <span className="font-semibold">{color.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProcessElementPage;
