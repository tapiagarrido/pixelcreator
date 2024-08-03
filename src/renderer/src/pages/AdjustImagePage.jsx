import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import { getCroppedImg } from '../utils/cropImage';

const AdjustImagePage = () => {

  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);

  const handleImageUpload = (ev) => {
    const file = ev.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
    }
    reader.readAsDataURL(file);
  }

  const onCropComplete = (croppedAreaPercentage, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels);
  };

  const handleCrop = async () => {
    try {
      const croppedImageUrl = await getCroppedImg(image, croppedArea);

      const fecha = new Date();
      const linkGenerate = document.createElement('a');
      linkGenerate.href = croppedImageUrl;
      linkGenerate.download = `imagen-recortada_${fecha.getDay()}-${fecha.getMonth()}-${fecha.getHours()}${fecha.getMinutes()}.png`
      document.body.appendChild(linkGenerate);
      linkGenerate.click();
      document.body.removeChild(linkGenerate);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className='flex flex-col justify-center font-changa'>
      {!image ?
        <>
          <div className='text-center font-bold text-gray-700 my-4'>Cargue una imagen para recortar</div>

          <div className="flex items-center justify-center w-96 mx-auto">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-300  dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                </svg>
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-500"><span className="font-semibold">Click para buscar imagen</span></p>
                <p className="text-xs text-gray-600 dark:text-gray-500">SVG, PNG, JPG o webp</p>
              </div>
              <input id="dropzone-file" type="file" accept='image/*' className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </>
        :
        <div>
          <div style={{ position: 'relative', width: '100%', height: 450 }}>
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e, zoom) => setZoom(zoom)}
            />
            <div className='flex justify-center my-4'>
              <button className='py-2 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 border-blue-800' onClick={handleCrop}>Cortar y Descargar</button>
            </div>
          </div>
        </div>
      }
    </div>
  )
}

export default AdjustImagePage
