import React, { useState, useRef, useEffect } from 'react';
import { GrCaretNext, GrDownload } from 'react-icons/gr';
import { useLocation } from 'react-router-dom';
import PixelActions from '../components/process/PixelActions';

const ProcessElementPage = () => {
  const location = useLocation();
  const navState = location.state || {};

  const [image, setImage] = useState(navState.imageSrc || null);
  const [readyToDownload, setReadyToDownload] = useState(false);
  const [templateInfo, setTemplateInfo] = useState(null);
  const [componentPixel, setComponentPixel] = useState(Boolean(navState.imageSrc));
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [blur, setBlur] = useState(0);
  const [saturation, setSaturation] = useState(1);
  const [grayscale, setGrayscale] = useState(0);


  const canvasRef = useRef(null);

  const handleImageSelected = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      setImage(reader.result);
      setReadyToDownload(false);
      setTemplateInfo(null);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const applyFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (image) {
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply brightness, contrast, saturation, and grayscale
        ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) grayscale(${grayscale})`;

        // Draw the image with applied filters
        ctx.drawImage(img, 0, 0);

        // Apply blur
        if (blur > 0) {
          const blurredImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const blurredCanvas = document.createElement('canvas');
          blurredCanvas.width = canvas.width;
          blurredCanvas.height = canvas.height;
          const blurredCtx = blurredCanvas.getContext('2d');
          blurredCtx.putImageData(blurredImageData, 0, 0);
          blurredCtx.filter = `blur(${blur}px)`;
          blurredCtx.drawImage(blurredCanvas, 0, 0);
          ctx.drawImage(blurredCanvas, 0, 0);
        }
      };

      img.onerror = () => {
        console.error('No se pudo cargar la imagen para previsualizacion');
      };

      // Assign src after handlers to avoid missing load event with cached/blob URLs.
      img.src = image;
    }
  };

  const handleNextStage = () => {
    setComponentPixel(true);
  }

  useEffect(() => {
    applyFilters();
  }, [image, brightness, contrast, blur, saturation, grayscale]);

  const handleProcessImage = (processedImage, stats) => {
    setImage(processedImage);
    setTemplateInfo(stats);
    setReadyToDownload(true);
  }

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Obtén la URL de datos de la imagen en el canvas
      const dataURL = canvas.toDataURL('image/png');

      // Crea un enlace para descargar la imagen
      const link = document.createElement('a');
      link.href = dataURL;
      const fecha = new Date();
      link.download = `plantilla-${fecha.getDate()}-${fecha.getMonth()}-${fecha.getHours()}${fecha.getMinutes()}.png`;

      // Simula el clic en el enlace para iniciar la descarga
      link.click();
    }
  };

  const handleRestartComponent = () => {
    setImage(null);
    setReadyToDownload(false);
    setComponentPixel(false);
    setTemplateInfo(null);
    setBrightness(1);
    setContrast(1);
    setBlur(0);
    setSaturation(1);
    setGrayscale(0);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }


  return (
    <div className='w-full h-[calc(100vh-70px)] overflow-y-auto'>
      <div className='flex flex-col lg:flex-row w-full gap-6 lg:gap-8 px-4 pb-8'>
      {componentPixel ?
        <PixelActions
          imageIn={image}
          onProcessImage={handleProcessImage}
          onRestart={handleRestartComponent}
          defaultBeadWidth={navState.beadWidth}
          defaultBeadHeight={navState.beadHeight}
        />
        :
        <div className='w-full lg:w-1/2 font-changa text-xl'>
          <div className=''>
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
              <div className='flex gap-2 items-center'>
                <div>Brillo</div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={brightness}
                  onChange={(e) => setBrightness(e.target.value)}
                />
                <span>{brightness}</span>
              </div>
              <div className='flex gap-2 items-center mt-2'>
                <div>Contraste</div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={contrast}
                  onChange={(e) => setContrast(e.target.value)}
                />
                <span>{contrast}</span>
              </div>
              <div className='flex gap-2 items-center mt-2'>
                <div>Saturación</div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={saturation}
                  onChange={(e) => setSaturation(e.target.value)}
                />
                <span>{saturation}</span>
              </div>
              <div className='flex gap-2 items-center mt-2'>
                <div>Desenfoque</div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={blur}
                  onChange={(e) => setBlur(e.target.value)}
                />
                <span>{blur}</span>
              </div>
              <div className='flex gap-2 items-center mt-2'>
                <div>Escala de Grises</div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={grayscale}
                  onChange={(e) => setGrayscale(e.target.value)}
                />
                <span>{grayscale}</span>
              </div>
            </div>
            <div className='flex justify-end'>
              <button className='flex mt-12 items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 p-2 rounded-xl border-blue-950 border disabled:bg-gray-700' onClick={handleNextStage} disabled={!image}>
                Siguiente
                <GrCaretNext />
              </button>
            </div>
          </div>
        </div>
      }
      <div className='w-full lg:w-1/2 relative'>
        <div className='max-h-[70vh] overflow-auto border border-gray-200 rounded-xl bg-white/40'>
          <canvas ref={canvasRef} className="w-full px-8" />
        </div>
        {
          readyToDownload ?
            <>
              <div className='font-changa w-full flex justify-center mt-2'>
                <button onClick={handleDownloadImage} className='px-2 py-1 text-black text-xl bg-amber-200 border border-amber-500 rounded-xl shadow-lg font-bold'>
                  <GrDownload />
                </button>
              </div>

              {templateInfo ? (
                <div className='font-changa bg-white/70 rounded-xl border border-gray-200 p-4 mt-4 mx-8 max-h-52 overflow-y-auto'>
                  <div className='font-bold text-lg mb-2'>Resumen de plantilla</div>
                  <div className='text-sm'>
                    <div>Tamano: {templateInfo.widthBeads} x {templateInfo.heightBeads} beads</div>
                    <div>Total estimado: {templateInfo.totalBeads} beads</div>
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
            : null
        }
      </div>
      </div>
    </div>
  );
};

export default ProcessElementPage;
