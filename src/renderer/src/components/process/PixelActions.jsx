import React, { useState } from 'react';
import pixelArt from "../../../../../public/images/pixel_process.svg"

const PixelActions = ({ imageIn, onProcessImage }) => {
  const [pixelCountWidth, setPixelCountWidth] = useState(50);
  const [direccion, setDireccion] = useState("ancho");
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

      // Cantidad de píxeles especificada en el ancho
      const numCellsWidth = pixelCountWidth;

      // Calcular el tamaño real de cada píxel
      const pixelSize = image.width / numCellsWidth;

      // Calcular el número de píxeles en el alto para mantener la proporción
      const numCellsHeight = Math.ceil(image.height / pixelSize);

      // Ajustar el tamaño del canvas
      canvas.width = image.width;
      canvas.height = image.height;

      // Redibujar la imagen en el canvas
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // Aplicar el efecto de pixelación con borde
      for (let y = 0; y < numCellsHeight; y++) {
        for (let x = 0; x < numCellsWidth; x++) {
          // Definir el tamaño de la celda
          const startX = x * pixelSize;
          const startY = y * pixelSize;
          const endX = (x + 1) * pixelSize;
          const endY = (y + 1) * pixelSize;

          // Asegurarse de que las coordenadas no se salgan de los límites del canvas
          const clipX = Math.min(canvas.width, endX);
          const clipY = Math.min(canvas.height, endY);
          const clipWidth = clipX - startX;
          const clipHeight = clipY - startY;

          // Obtener el color promedio de la celda
          const imageData = ctx.getImageData(startX, startY, clipWidth, clipHeight);
          const avgColor = getCellColor(imageData);

          // Dibujar el bloque de color promedio en la celda
          ctx.fillStyle = avgColor;
          ctx.fillRect(startX, startY, clipWidth, clipHeight);

          // Dibujar el borde alrededor de la celda
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.lineWidth = borderWidth;
          ctx.strokeRect(startX, startY, clipWidth, clipHeight);
        }
      }

      // Devolver la imagen procesada
      onProcessImage(canvas.toDataURL());
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
        <select className='w-1/3' onChange={(event)=>setDireccion(event.target.value)}>
          <option value="ancho">Ancho</option>
          <option value="alto">Alto</option>
        </select>
        <input
          type="number"
          value={pixelCountWidth}
          onChange={handlePixelCountWidthChange}
          className='bg-gray-50 border w-1/3 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
          min={50}
        />
      </div>
      <div className='text-sm italic'>
        <p>{`El valor de referencia sera el ${direccion} de la imagen y se ajustara automaticamente para mantener las dimensiones`}</p>
      </div>
      <div className='flex justify-end mt-32'>
      <button
        onClick={handleProcessImage}
        className='p-2 bg-blue-700 rounded-xl text-white border border-blue-900 hover:bg-blue-800'
      >
        Pixelar Imagen
      </button>
      </div>
    </div>
  );
};

export default PixelActions;
