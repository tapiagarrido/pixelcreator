import React, { useState, useRef, useEffect } from 'react';
import { GrCaretNext, GrDownload } from 'react-icons/gr';
import { useLocation } from 'react-router-dom';
import PixelActions from '../components/process/PixelActions';
import { renderPrintableSheet } from '../utils/printableSheet';
import { DEFAULT_FILTERS, buildFilteredCanvas } from '../utils/imageFilters';

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

  // `image` es siempre la imagen original; la plantilla generada vive aparte en `processedImage`.
  const [image, setImage] = useState(navState.imageSrc || null);
  const [processedImage, setProcessedImage] = useState(null);
  const [templateInfo, setTemplateInfo] = useState(null);
  const [componentPixel, setComponentPixel] = useState(Boolean(navState.imageSrc));
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showNumbers, setShowNumbers] = useState(false);

  const canvasRef = useRef(null);

  const clearResult = () => {
    setProcessedImage(null);
    setTemplateInfo(null);
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

        if (processedImage && templateInfo) {
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
  }, [image, processedImage, templateInfo, showNumbers, filters]);

  const handleProcessImage = (processedUrl, stats) => {
    setProcessedImage(processedUrl);
    setTemplateInfo(stats);
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
    downloadDataUrl(renderPrintableSheet(templateInfo, { showNumbers }).toDataURL('image/png'), 'plantilla');
  };

  // Solo la imagen de beads, sin coordenadas ni leyenda
  const handleDownloadGridOnly = () => {
    if (processedImage) downloadDataUrl(processedImage, 'plantilla-solo-beads');
  };

  const handleRestartComponent = () => {
    setImage(null);
    clearResult();
    setComponentPixel(false);
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className='w-full h-[calc(100vh-70px)] overflow-y-auto'>
      <div className='flex flex-col lg:flex-row w-full gap-6 lg:gap-8 px-4 pb-8'>
        <div className='w-full lg:w-1/2 font-changa text-xl'>
          {componentPixel ? (
            <>
              <details className='mb-4 border rounded-lg p-3 bg-gray-50/70'>
                <summary className='text-base font-semibold cursor-pointer select-none'>
                  Filtros de imagen
                </summary>
                <div className='mt-3'>
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
                hasResult={Boolean(processedImage)}
              />
            </>
          ) : (
            <div>
              <div>Cargue una imagen</div>

              <div className="flex items-center justify-center">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-300  dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-500"><span className="font-semibold">Click para buscar imagen</span></p>
                    <p className="text-xs text-gray-600 dark:text-gray-500">SVG, PNG, JPG o webp</p>
                  </div>
                  <input id="dropzone-file" type="file" accept='image/*' onChange={handleImageSelected} className="hidden" />
                </label>
              </div>

              <div className='mt-8'>
                <FilterControls filters={filters} onChange={handleFilterChange} />
              </div>
              <div className='flex justify-end'>
                <button className='flex mt-12 items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 p-2 rounded-xl border-blue-950 border disabled:bg-gray-700' onClick={() => setComponentPixel(true)} disabled={!image}>
                  Siguiente
                  <GrCaretNext />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className='w-full lg:w-1/2 relative'>
          <div className='max-h-[70vh] overflow-auto border border-gray-200 rounded-xl bg-white/40'>
            <canvas ref={canvasRef} className="w-full px-8" />
          </div>
          {processedImage ? (
            <>
              <div className='font-changa w-full flex flex-wrap justify-center items-center gap-3 mt-2 text-base'>
                <label className='flex items-center gap-2 cursor-pointer select-none'>
                  <input
                    type='checkbox'
                    checked={showNumbers}
                    onChange={(e) => setShowNumbers(e.target.checked)}
                  />
                  Números en las celdas
                </label>
                <button onClick={handleDownloadSheet} className='flex items-center gap-2 px-3 py-1 text-black bg-amber-200 border border-amber-500 rounded-xl shadow-lg font-bold'>
                  <GrDownload /> Descargar plantilla
                </button>
                <button onClick={handleDownloadGridOnly} className='px-3 py-1 text-black bg-gray-100 border border-gray-400 rounded-xl'>
                  Solo beads
                </button>
              </div>

              {templateInfo ? (
                <div className='font-changa bg-white/70 rounded-xl border border-gray-200 p-4 mt-4 mx-8 max-h-52 overflow-y-auto'>
                  <div className='font-bold text-lg mb-2'>Resumen de plantilla</div>
                  <div className='text-sm'>
                    <div>Tamaño: {templateInfo.widthBeads} x {templateInfo.heightBeads} beads</div>
                    <div>Total estimado: {templateInfo.totalBeads} beads</div>
                    {templateInfo.emptyCells > 0 ? (
                      <div>Celdas vacías (transparentes): {templateInfo.emptyCells}</div>
                    ) : null}
                    <div>Paleta: {templateInfo.paletteName}</div>
                  </div>

                  <div className='mt-3 text-sm font-semibold'>Conteo por color</div>
                  <div className='mt-1 space-y-1'>
                    {templateInfo.colorUsage.map((color) => (
                      <div key={color.id} className='flex items-center justify-between text-sm bg-gray-50 rounded-lg px-2 py-1'>
                        <div className='flex items-center gap-2'>
                          <span
                            className='inline-block w-4 h-4 rounded border border-black/20'
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                        </div>
                        <span className='font-semibold'>{color.count}</span>
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
