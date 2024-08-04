import React, { useState } from 'react';
import pixelArt from "../../../../../public/images/pixel_process.svg"
import { IoChevronBackCircle } from "react-icons/io5";


const PixelActions = ({ imageIn, onProcessImage, onRestart }) => {
  const [pixelCountWidth, setPixelCountWidth] = useState(52);
  const [direction, setDirection] = useState("ancho");
  const [enabledAction, SetEnabledAction] = useState(true);
  const borderWidth = 0.8;

  const handlePixelCountWidthChange = (event) => {
    const newWidthCount = parseInt(event.target.value, 10);
    setPixelCountWidth(newWidthCount);
  };

  const handleProcessImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const image = new Image();
    image.src = imageIn;

    image.onload = () => {
      if (image.width <= 0 || image.height <= 0) {
        console.error('Image dimensions are invalid');
        return;
      }

      canvas.width = image.width;
      canvas.height = image.height;

      if (canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas dimensions are invalid');
        return;
      }

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      let pixelSize;
      let numCellsHeight;
      let numCellsWidth;
      const numberCells = pixelCountWidth;

      if (direction.includes("ancho")) {
        pixelSize = image.width / numberCells;
        numCellsWidth = numberCells;
        numCellsHeight = Math.ceil(image.height / pixelSize);
      } else {
        pixelSize = image.height / numberCells;
        numCellsHeight = numberCells;
        numCellsWidth = Math.ceil(image.width / pixelSize);
      }

      for (let y = 0; y < numCellsHeight; y++) {
        for (let x = 0; x < numCellsWidth; x++) {
          const startX = x * pixelSize;
          const startY = y * pixelSize;
          const endX = (x + 1) * pixelSize;
          const endY = (y + 1) * pixelSize;

          const clipX = Math.min(canvas.width, endX);
          const clipY = Math.min(canvas.height, endY);
          const clipWidth = clipX - startX;
          const clipHeight = clipY - startY;

          if (clipWidth <= 0 || clipHeight <= 0) {
            console.error('Invalid clipping area');
            continue;
          }

          try {
            const imageData = ctx.getImageData(startX, startY, clipWidth, clipHeight);
            const avgColor = getCellColor(imageData);

            ctx.fillStyle = avgColor;
            ctx.fillRect(startX, startY, clipWidth, clipHeight);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(startX, startY, clipWidth, clipHeight);
          } catch (e) {
            console.error('Error getting image data', e);
          }
        }
      }

      onProcessImage(canvas.toDataURL());
      SetEnabledAction(false);
    };

    image.onerror = () => {
      console.error('Error loading image');
    };
  };


  // Función para obtener el color promedio de los píxeles en el ImageData
  const getCellColor = (imageData) => {
    const { data, width, height } = imageData;
    let r = 0, g = 0, b = 0, a = 0;
    const totalPixels = width * height;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      a += data[i + 3];
    }

    r = Math.round(r / totalPixels);
    g = Math.round(g / totalPixels);
    b = Math.round(b / totalPixels);
    a = Math.round(a / totalPixels);

    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
  };

  return (
    <div className='w-1/2 font-changa text-xl'>
      <div className='text-2xl font-bold mb-4 text-gray-700 text-center'>Manipulación de píxeles</div>

      <div className='flex justify-center mb-16'>
        <img src={pixelArt} width={80} />
      </div>

      <div className='flex gap-4 items-baseline mb-4'>
        <div className='w-1/3'>
          Cantidad de píxeles:
        </div>
        <select className='w-1/3 border rounded-lg bg-gray-50' onChange={(event) => setDirection(event.target.value)}>
          <option value={"ancho"}>Ancho</option>
          <option value={"alto"}>Alto</option>
        </select>
        <input
          type="number"
          value={pixelCountWidth}
          onChange={handlePixelCountWidthChange}
          className='bg-gray-50 border w-1/3 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
          min={5}
        />
      </div>
      <div className='text-sm italic'>
        <p>{`El valor de referencia sera el ${direction} de la imagen y se ajustara automaticamente para mantener las dimensiones`}</p>
      </div>
      <div className='flex justify-end mt-32 gap-4'>
        <button
          onClick={handleProcessImage}
          className='p-2 bg-blue-700 rounded-xl text-white border border-blue-900 hover:bg-blue-800 disabled:bg-gray-700'
          disabled={!enabledAction || pixelCountWidth === 0 || !Number.isFinite(pixelCountWidth)}
        >
          Pixelar Imagen
        </button>
        {!enabledAction ? <button onClick={onRestart} className='p-2 bg-amber-700 rounded-xl text-3xl text-white border border-amber-900 hover:bg-amber-800'><IoChevronBackCircle /></button> : null}
      </div>
    </div>
  );
};

export default PixelActions;
