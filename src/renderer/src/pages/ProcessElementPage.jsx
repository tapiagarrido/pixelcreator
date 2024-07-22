import React, { useState, useRef, useEffect } from 'react';
import { GrCaretNext, GrDownload } from 'react-icons/gr';
import PixelActions from '../components/process/PixelActions';

const ProcessElementPage = () => {
  const [image, setImage] = useState(null);
  const [readyToDownload, setReadyToDownloas] = useState(false);
  const [componentPixel, setComponentPixel] = useState(false);
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
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const applyFilters = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (image) {
      const img = new Image();
      img.src = image;

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
    }
  };

  const handleNextStage = () => {
    setComponentPixel(true);
  }

  useEffect(() => {
    applyFilters();
  }, [image, brightness, contrast, blur, saturation, grayscale]);

  const handleProcessImage = (processedImage) => {
    setImage(processedImage);
    setReadyToDownloas(true);
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


  return (
    <div className='flex w-full gap-8 fixed'>
      {componentPixel ?
        <PixelActions imageIn={image} onProcessImage={handleProcessImage} />
        :
        <div className='w-1/2 font-changa text-xl'>
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
                <input id="dropzone-file" type="file" onChange={handleImageSelected} className="hidden" />
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

            <button className='flex mt-12 items-center gap-2 text-white bg-blue-700 hover:bg-blue-800 p-2 rounded-xl border-blue-950 border' onClick={handleNextStage} disabled={!image}>
              Siguiente
              <GrCaretNext />
            </button>
          </div>
        </div>
      }
      <div className='w-1/2 relative'>
        <div className='h-3/4 overflow-y-scroll'>
          <canvas ref={canvasRef} className="w-full px-8" />
        </div>
        {
          readyToDownload ?
            <div className='font-changa w-full flex justify-center mt-2'>
              <button onClick={handleDownloadImage} className='px-2 py-1 text-black text-xl bg-amber-200 border border-amber-500 rounded-xl shadow-lg font-bold'>
                <GrDownload />
              </button>
            </div>
            : null
        }
      </div>
    </div>
  );
};

export default ProcessElementPage;
