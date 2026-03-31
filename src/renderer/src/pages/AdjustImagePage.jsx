import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import { useNavigate } from 'react-router-dom';
import { getCroppedImg } from '../utils/cropImage';

const GRID_PRESETS = [
  { label: 'Hama Midi (29×29)', value: '29x29', w: 29, h: 29 },
  { label: 'Perler / Nabbi (29×29)', value: 'perler29x29', w: 29, h: 29 },
  { label: 'Genérico (50×50)', value: '50x50', w: 50, h: 50 },
  { label: 'Genérico (58×58)', value: '58x58', w: 58, h: 58 },
  { label: 'Personalizado', value: 'custom', w: null, h: null },
];

const AdjustImagePage = () => {
  const navigate = useNavigate();

  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);

  // Grid config
  const [gridPreset, setGridPreset] = useState('29x29');
  const [gridBaseW, setGridBaseW] = useState(29);
  const [gridBaseH, setGridBaseH] = useState(29);
  const [gridsWide, setGridsWide] = useState(1);
  const [gridsTall, setGridsTall] = useState(1);

  const totalBeadsW = gridBaseW * gridsWide;
  const totalBeadsH = gridBaseH * gridsTall;
  const cropAspect = totalBeadsW / totalBeadsH;

  const handlePresetChange = (ev) => {
    const preset = GRID_PRESETS.find((p) => p.value === ev.target.value);
    setGridPreset(ev.target.value);
    if (preset?.w) {
      setGridBaseW(preset.w);
      setGridBaseH(preset.h);
    }
  };

  const handleImageUpload = (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const onCropComplete = (_croppedAreaPercentage, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels);
  };

  const handleContinue = async () => {
    try {
      const croppedImageUrl = await getCroppedImg(image, croppedArea);
      navigate('/process', {
        state: {
          imageSrc: croppedImageUrl,
          beadWidth: totalBeadsW,
          beadHeight: totalBeadsH,
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadOnly = async () => {
    try {
      const croppedImageUrl = await getCroppedImg(image, croppedArea);
      const fecha = new Date();
      const link = document.createElement('a');
      link.href = croppedImageUrl;
      link.download = `imagen-recortada_${fecha.getDate()}-${fecha.getMonth()}-${fecha.getHours()}${fecha.getMinutes()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    }
  };

  // GCD para mostrar relación de aspecto simplificada
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const aspectGcd = gcd(totalBeadsW, totalBeadsH);
  const aspectLabel = `${totalBeadsW / aspectGcd}:${totalBeadsH / aspectGcd}`;

  return (
    <div className='flex flex-col font-changa px-4 pb-8'>

      {/* --- Configuración de grilla --- */}
      <div className='bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4'>
        <div className='font-bold text-gray-700 mb-3 text-lg'>1. Configuración de cuadrícula</div>

        <div className='flex flex-wrap gap-4 items-end'>
          <div className='flex flex-col gap-1'>
            <label className='text-sm text-gray-600'>Tipo de cuadrícula</label>
            <select
              className='border rounded-lg bg-white px-2 py-1 text-sm'
              value={gridPreset}
              onChange={handlePresetChange}
            >
              {GRID_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {gridPreset === 'custom' && (
            <div className='flex gap-2 items-end'>
              <div className='flex flex-col gap-1'>
                <label className='text-sm text-gray-600'>Ancho cuadrícula</label>
                <input
                  type='number' min={1} max={200} value={gridBaseW}
                  onChange={(ev) => setGridBaseW(Math.max(1, parseInt(ev.target.value) || 1))}
                  className='border rounded-lg bg-white px-2 py-1 text-sm w-20'
                />
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-sm text-gray-600'>Alto cuadrícula</label>
                <input
                  type='number' min={1} max={200} value={gridBaseH}
                  onChange={(ev) => setGridBaseH(Math.max(1, parseInt(ev.target.value) || 1))}
                  className='border rounded-lg bg-white px-2 py-1 text-sm w-20'
                />
              </div>
            </div>
          )}

          <div className='flex flex-col gap-1'>
            <label className='text-sm text-gray-600'>Cuadrículas en ancho</label>
            <input
              type='number' min={1} max={20} value={gridsWide}
              onChange={(ev) => setGridsWide(Math.max(1, parseInt(ev.target.value) || 1))}
              className='border rounded-lg bg-white px-2 py-1 text-sm w-20'
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm text-gray-600'>Cuadrículas en alto</label>
            <input
              type='number' min={1} max={20} value={gridsTall}
              onChange={(ev) => setGridsTall(Math.max(1, parseInt(ev.target.value) || 1))}
              className='border rounded-lg bg-white px-2 py-1 text-sm w-20'
            />
          </div>
        </div>

        <div className='mt-3 flex gap-6 text-sm flex-wrap'>
          <div className='bg-blue-50 border border-blue-200 rounded-lg px-3 py-2'>
            <span className='font-semibold text-blue-800'>Total beads: </span>
            <span className='text-blue-700'>{totalBeadsW} × {totalBeadsH}</span>
          </div>
          <div className='bg-green-50 border border-green-200 rounded-lg px-3 py-2'>
            <span className='font-semibold text-green-800'>Proporción del recorte: </span>
            <span className='text-green-700'>{aspectLabel}</span>
          </div>
          {gridsWide * gridsTall > 1 && (
            <div className='bg-amber-50 border border-amber-200 rounded-lg px-3 py-2'>
              <span className='font-semibold text-amber-800'>Cuadrículas: </span>
              <span className='text-amber-700'>{gridsWide * gridsTall} ({gridsWide}×{gridsTall})</span>
            </div>
          )}
        </div>
      </div>

      {/* --- Carga y recorte de imagen --- */}
      <div className='font-bold text-gray-700 mb-3 text-lg'>2. Recortar imagen</div>

      {!image ? (
        <div className="flex items-center justify-center w-full max-w-lg mx-auto">
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-44 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
              </svg>
              <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">Click para buscar imagen</span></p>
              <p className="text-xs text-gray-500">SVG, PNG, JPG o WebP</p>
            </div>
            <input id="dropzone-file" type="file" accept='image/*' className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
      ) : (
        <div>
          <div className='text-sm text-gray-500 mb-2 text-center'>
            El recorte está bloqueado a proporción <strong>{aspectLabel}</strong> ({totalBeadsW}×{totalBeadsH} beads)
          </div>
          <div style={{ position: 'relative', width: '100%', height: 420 }}>
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={cropAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className='mt-2'>
            <div className='text-xs text-gray-500 mb-1 text-center'>Zoom</div>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(_e, z) => setZoom(z)}
            />
          </div>
          <div className='flex justify-between items-center mt-4'>
            <button
              className='py-2 px-4 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-100'
              onClick={handleDownloadOnly}
            >
              Solo descargar recorte
            </button>
            <button
              className='py-2 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 border border-blue-800 flex items-center gap-2'
              onClick={handleContinue}
            >
              Continuar al proceso →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdjustImagePage;
