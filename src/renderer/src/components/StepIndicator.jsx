import { useLocation } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';

const STEPS = ['Recortar', 'Ajustar y generar', 'Revisar y exportar'];

// Paso actual segun la ruta y si ya hay plantilla; null fuera del flujo principal.
export const getCurrentStep = (pathname, hasTemplate) => {
  if (pathname === '/adjust') return 1;
  if (pathname === '/process') return hasTemplate ? 3 : 2;
  return null;
};

const StepIndicator = () => {
  const { pathname } = useLocation();
  const { state } = useWorkspace();
  const current = getCurrentStep(pathname, Boolean(state.templateInfo));
  if (!current) return null;

  return (
    <ol className="flex items-center gap-2 text-sm font-changa" aria-label="Pasos">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const isCurrent = number === current;
        return (
          <li
            key={label}
            aria-current={isCurrent ? 'step' : undefined}
            className={`flex items-center gap-1 ${isCurrent ? 'font-bold text-gray-900' : 'text-gray-500'}`}
          >
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                isCurrent
                  ? 'bg-blue-700 text-white'
                  : number < current
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200'
              }`}
            >
              {number}
            </span>
            {label}
            {number < STEPS.length ? <span className="mx-1 text-gray-400">›</span> : null}
          </li>
        );
      })}
    </ol>
  );
};

export default StepIndicator;
