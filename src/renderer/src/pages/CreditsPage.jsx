const CreditsPage = () => {
  return (
    <div className="max-w-3xl mx-auto my-5 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <h1 className="text-2xl mb-2">Bienvenidos</h1>
      <div className="space-y-2 text-gray-600">
        <p>
          Esta es una versión temprana de la aplicación, por lo que podría presentar algunos
          errores. Si observas algún mal funcionamiento o tienes ideas para mejorarla, por favor
          envía un correo a <strong>gustavogarrido.programador@gmail.com</strong>.
        </p>
        <p>
          Mi idea es seguir mejorando la aplicación para contribuir al arte del píxel, del cual
          también soy un fanático.
        </p>
        <p>La aplicación será de código abierto y gratuita para todo el público.</p>
        <p>Saludos, Gustavo Garrido</p>
      </div>
    </div>
  );
};

export default CreditsPage;
