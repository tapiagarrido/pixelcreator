import { DEFAULT_FILTERS } from '../utils/imageFilters';

export const initialWorkspace = {
  image: null, // imagen original (data URL o blob URL del recorte)
  filters: DEFAULT_FILTERS,
  templateInfo: null, // plantilla generada, con sus ediciones
  showNumbers: false,
  boardSize: 29,
  componentPixel: false, // false = cargar imagen y filtros; true = generar plantilla
  beadWidth: null, // medidas del recorte (de la pantalla Ajustar)
  beadHeight: null
};

/**
 * `patch` fusiona campos (objeto) o recibe el estado previo y devuelve los campos a cambiar.
 * Asi se pueden encadenar actualizaciones sin depender de un render intermedio.
 */
export const workspaceReducer = (state, action) => {
  switch (action.type) {
    case 'patch': {
      const patch = typeof action.patch === 'function' ? action.patch(state) : action.patch;
      return { ...state, ...patch };
    }
    case 'reset':
      return { ...initialWorkspace };
    case 'startFromCrop':
      // Viene de Ajustar: imagen recortada y medidas de la cuadricula, plantilla anterior descartada
      return {
        ...initialWorkspace,
        image: action.imageSrc,
        componentPixel: true,
        beadWidth: action.beadWidth ?? null,
        beadHeight: action.beadHeight ?? null
      };
    case 'openProject': {
      const { project } = action;
      return {
        ...initialWorkspace,
        image: project.image,
        filters: project.filters,
        templateInfo: project.templateInfo,
        showNumbers: project.showNumbers,
        boardSize: project.boardSize,
        componentPixel: true
      };
    }
    default:
      return state;
  }
};
