// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StepIndicator, { getCurrentStep } from './StepIndicator';
import { WorkspaceProvider, useWorkspace } from '../context/WorkspaceContext';

afterEach(cleanup);

const WithTemplate = ({ children }) => {
  const { update } = useWorkspace();
  return (
    <>
      <button onClick={() => update({ templateInfo: { cells: [] } })}>generar</button>
      {children}
    </>
  );
};

const renderAt = (path, ui = <StepIndicator />) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <WorkspaceProvider>
        <WithTemplate>{ui}</WithTemplate>
      </WorkspaceProvider>
    </MemoryRouter>
  );

describe('getCurrentStep', () => {
  it('deriva el paso de la ruta y de si hay plantilla', () => {
    expect(getCurrentStep('/adjust', false)).toBe(1);
    expect(getCurrentStep('/process', false)).toBe(2);
    expect(getCurrentStep('/process', true)).toBe(3);
    expect(getCurrentStep('/', false)).toBeNull();
    expect(getCurrentStep('/credits', true)).toBeNull();
  });
});

describe('StepIndicator', () => {
  it('marca el paso 1 en Ajustar', () => {
    renderAt('/adjust');
    const current = screen.getByRole('listitem', { current: 'step' });
    expect(current.textContent).toContain('Recortar');
  });

  it('pasa al paso 3 cuando existe una plantilla', async () => {
    renderAt('/process');
    expect(screen.getByRole('listitem', { current: 'step' }).textContent).toContain(
      'Ajustar y generar'
    );
    screen.getByText('generar').click();
    expect(await screen.findByText(/Revisar y exportar/)).toBeTruthy();
    expect(screen.getByRole('listitem', { current: 'step' }).textContent).toContain(
      'Revisar y exportar'
    );
  });

  it('no se muestra en la portada', () => {
    renderAt('/');
    expect(screen.queryByRole('list')).toBeNull();
  });
});
