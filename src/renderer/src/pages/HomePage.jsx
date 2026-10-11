import { Link, useNavigate } from 'react-router-dom';
import OpenProjectButton from '../components/OpenProjectButton';
import { useWorkspace } from '../context/WorkspaceContext';
import pixelimage from '../../../../public/images/pixel_bg.png';
import { useState, useEffect } from 'react';

const HomePage = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { openProject } = useWorkspace();

  useEffect(() => {
    const img = new Image();
    img.src = pixelimage;
    img.onload = () => {
      setImageLoaded(true);
    };
  }, []);

  return (
    <div className="flex flex-col justify-center items-center space-y-12">
      {!imageLoaded ? (
        <div className="flex flex-col justify-center items-center">
          <div
            role="status"
            aria-label="Cargando"
            className="w-16 h-16 border-4 border-gray-300 border-t-yellow-600 rounded-full animate-spin"
          />
        </div>
      ) : (
        <>
          <h1 className="font-changa text-6xl">
            Pixel <span className="font-semibold">Creator</span>
          </h1>
          <img src={pixelimage} width={350} />
          <div className="flex gap-4">
            <Link
              className="w-48 text-center bg-yellow-600 py-3 px-4 rounded-xl shadow-lg font-bold hover:cursor-pointer hover:bg-yellow-700 border-black border-2 uppercase"
              to={'/adjust'}
            >
              Ajustar Imagen
            </Link>
            <Link
              className="w-48 text-center bg-yellow-600 py-3 px-4 rounded-xl shadow-lg font-bold hover:cursor-pointer hover:bg-yellow-700 border-black border-2 uppercase"
              to={'/process'}
            >
              Procesar Imagen
            </Link>
            <Link
              className="w-48 text-center bg-yellow-600 py-3 px-4 rounded-xl shadow-lg font-bold hover:cursor-pointer hover:bg-yellow-700 border-black border-2 uppercase"
              to={'/credits'}
            >
              Créditos
            </Link>
          </div>
          <div className="flex flex-col items-center gap-2">
            <OpenProjectButton
              onOpen={(project) => {
                openProject(project);
                navigate('/process');
              }}
              onError={setError}
              className="font-changa text-lg px-4 py-2 rounded-xl border border-gray-500 bg-white hover:bg-gray-100"
            >
              Abrir proyecto guardado
            </OpenProjectButton>
            {error ? (
              <div role="alert" className="text-red-700 text-sm">
                {error}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;
