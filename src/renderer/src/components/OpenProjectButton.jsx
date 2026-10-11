import { parseProject } from '../utils/project';

// Botón que abre un archivo de proyecto (.json) y entrega el estado ya validado.
const OpenProjectButton = ({ onOpen, onError, className = '', children = 'Abrir proyecto' }) => {
  const handleChange = async (event) => {
    const file = event.target.files[0];
    event.target.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;

    try {
      onOpen(parseProject(await file.text()));
    } catch (error) {
      onError?.(error.message || 'No se pudo abrir el proyecto');
    }
  };

  return (
    <label className={`cursor-pointer ${className}`}>
      {children}
      <input
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleChange}
      />
    </label>
  );
};

export default OpenProjectButton;
