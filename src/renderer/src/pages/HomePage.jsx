import { Link } from "react-router-dom";
import pixelimage from "../../../../public/images/pixel_bg.png";
import LoadingAnimation from "../../../../public/animations/loading.json";
import { useState, useEffect } from "react";
import Lottie from 'lottie-react';

const HomePage = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = pixelimage;
    img.onload = () => {
      setImageLoaded(true);
    };
  }, []);

  return (
    <div className='flex flex-col justify-center items-center space-y-12'>
      {!imageLoaded ? (
        <div className='flex flex-col justify-center items-center'>
          <Lottie animationData={LoadingAnimation} style={{ width: 200, height: 200 }} />
        </div>
      ) : (
        <>
          <h1 className='font-changa text-6xl'>Pixel <span className='font-semibold'>Creator</span></h1>
          <img src={pixelimage} width={350} />
          <div className="flex gap-4">
            <Link className="w-48 text-center bg-yellow-600 py-3 px-4 rounded-xl shadow-lg font-bold hover:cursor-pointer hover:bg-yellow-700 border-black border-2 uppercase" to={"/adjust"}>
              Ajustar Imagen
            </Link>
            <Link className="w-48 text-center bg-yellow-600 py-3 px-4 rounded-xl shadow-lg font-bold hover:cursor-pointer hover:bg-yellow-700 border-black border-2 uppercase" to={"/process"}>
              Procesar Imagen
            </Link>
            <Link className="w-48 text-center bg-yellow-600 py-3 px-4 rounded-xl shadow-lg font-bold hover:cursor-pointer hover:bg-yellow-700 border-black border-2 uppercase" to={"/credits"}>
              Creditos
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;
