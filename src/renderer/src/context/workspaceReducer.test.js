import { describe, expect, it } from 'vitest';
import { initialWorkspace, workspaceReducer } from './workspaceReducer';
import { DEFAULT_FILTERS } from '../utils/imageFilters';

describe('workspaceReducer', () => {
  it('patch fusiona campos y acepta una funcion del estado previo', () => {
    let state = workspaceReducer(initialWorkspace, { type: 'patch', patch: { image: 'a' } });
    state = workspaceReducer(state, {
      type: 'patch',
      patch: (prev) => ({ filters: { ...prev.filters, blur: 3 } })
    });
    expect(state.image).toBe('a');
    expect(state.filters).toEqual({ ...DEFAULT_FILTERS, blur: 3 });
  });

  it('encadenar parches no pierde cambios (sin render intermedio)', () => {
    let state = initialWorkspace;
    state = workspaceReducer(state, { type: 'patch', patch: { showNumbers: true } });
    state = workspaceReducer(state, { type: 'patch', patch: { boardSize: 50 } });
    expect(state).toMatchObject({ showNumbers: true, boardSize: 50 });
  });

  it('startFromCrop parte limpio con la imagen y las medidas del recorte', () => {
    const dirty = {
      ...initialWorkspace,
      templateInfo: { cells: [] },
      filters: { ...DEFAULT_FILTERS, blur: 9 }
    };
    const state = workspaceReducer(dirty, {
      type: 'startFromCrop',
      imageSrc: 'blob:x',
      beadWidth: 58,
      beadHeight: 29
    });
    expect(state).toMatchObject({
      image: 'blob:x',
      componentPixel: true,
      beadWidth: 58,
      beadHeight: 29,
      templateInfo: null
    });
    expect(state.filters).toEqual(DEFAULT_FILTERS);
  });

  it('openProject carga imagen, filtros y plantilla', () => {
    const project = {
      image: 'data:image/png;base64,AA',
      filters: { ...DEFAULT_FILTERS, contrast: 1.5 },
      templateInfo: { widthBeads: 1 },
      showNumbers: true,
      boardSize: 40
    };
    const state = workspaceReducer(initialWorkspace, { type: 'openProject', project });
    expect(state).toMatchObject({
      image: project.image,
      showNumbers: true,
      boardSize: 40,
      componentPixel: true
    });
    expect(state.templateInfo).toBe(project.templateInfo);
  });

  it('reset vuelve al estado inicial', () => {
    const state = workspaceReducer({ ...initialWorkspace, image: 'x' }, { type: 'reset' });
    expect(state).toEqual(initialWorkspace);
  });
});
