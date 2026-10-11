import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from 'react';
import { initialWorkspace, workspaceReducer } from './workspaceReducer';

const WorkspaceContext = createContext(null);

// Libera el blob del recorte anterior cuando la imagen cambia (con margen para previsualizaciones en curso).
const REVOKE_DELAY_MS = 2000;

export const WorkspaceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspace);
  const previousImage = useRef(state.image);

  useEffect(() => {
    const previous = previousImage.current;
    if (previous && previous !== state.image && previous.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(previous), REVOKE_DELAY_MS);
    }
    previousImage.current = state.image;
  }, [state.image]);

  const update = useCallback((patch) => dispatch({ type: 'patch', patch }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);
  const startFromCrop = useCallback((crop) => dispatch({ type: 'startFromCrop', ...crop }), []);
  const openProject = useCallback((project) => dispatch({ type: 'openProject', project }), []);

  const value = useMemo(
    () => ({ state, update, reset, startFromCrop, openProject }),
    [state, update, reset, startFromCrop, openProject]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace debe usarse dentro de WorkspaceProvider');
  return context;
};
