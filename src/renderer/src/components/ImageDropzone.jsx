import { useState } from 'react';

// Zona para elegir una imagen con clic o arrastrándola encima.
const ImageDropzone = ({ onFile, className = '' }) => {
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState(false);

  const accept = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setRejected(true);
      return;
    }
    setRejected(false);
    onFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files?.[0]);
  };

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer ${
        dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-100 hover:bg-gray-50'
      } ${className}`}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <svg
          className="w-8 h-8 mb-4 text-gray-500"
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
        <p className="mb-2 text-sm text-gray-600">
          <span className="font-semibold">Click para buscar imagen</span> o arrástrala aquí
        </p>
        <p className="text-xs text-gray-500">SVG, PNG, JPG o WebP</p>
        {rejected ? (
          <p role="alert" className="text-xs text-red-700 mt-1">
            Ese archivo no es una imagen
          </p>
        ) : null}
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          accept(event.target.files[0]);
          event.target.value = '';
        }}
      />
    </label>
  );
};

export default ImageDropzone;
