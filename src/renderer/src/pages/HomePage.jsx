// HomePage.jsx
import { Link } from "react-router-dom";
import pixelimage from "../../../../public/images/pixel_bg.png";

const HomePage = () => {
  return (
    <>
      <div className='flex flex-col justify-center items-center space-y-12'>
        <h1 className='font-changa text-6xl'>Pixel <span className='font-semibold'>Creator</span></h1>
        <img src={pixelimage} width={350} />
        <div className="flex gap-4">
          <Link className="w-48 text-center bg-yellow-600 py-3 px-4 rounded-xl shadow-lg font-bold hover:cursor-pointer hover:bg-yellow-700 border-black border-2 uppercase" to={"/process"}>
            Procesar Imagen
          </Link>
          <Link className="w-48 text-center bg-yellow-600 py-3 px-4 rounded-xl shadow-lg font-bold hover:cursor-pointer hover:bg-yellow-700 border-black border-2 uppercase">
            Ajustar Imagen
          </Link>
          <Link className="w-48 text-center bg-yellow-600 py-3 px-4 rounded-xl shadow-lg font-bold hover:cursor-pointer hover:bg-yellow-700 border-black border-2 uppercase">
            Creditos
          </Link>
        </div>
      </div>
    </>
  );
};

export default HomePage;
