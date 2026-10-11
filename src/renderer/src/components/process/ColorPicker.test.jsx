// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColorPicker from './ColorPicker';

afterEach(cleanup);

const colors = [
  { id: 'a', code: 'H01', name: 'White', hex: '#FFFFFF' },
  { id: 'b', code: 'H02', name: 'Cream', hex: '#EEEECC' },
  { id: 'c', code: 'H03', name: 'Yellow', hex: '#E9C704' }
];

describe('ColorPicker', () => {
  it('sin seleccion guardada muestra todos los colores marcados', () => {
    render(<ColorPicker colors={colors} ownedIds={null} onChange={() => {}} />);
    expect(screen.getByText('3 de 3 colores')).toBeTruthy();
    screen.getAllByRole('button', { pressed: true }).forEach((b) => expect(b).toBeTruthy());
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(3);
  });

  it('al hacer clic en un color lo quita de la seleccion', async () => {
    const onChange = vi.fn();
    render(<ColorPicker colors={colors} ownedIds={null} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('H02 Cream'));
    expect(onChange).toHaveBeenCalledWith(['a', 'c']);
  });

  it('un color desmarcado se vuelve a marcar con otro clic', async () => {
    const onChange = vi.fn();
    render(<ColorPicker colors={colors} ownedIds={['a']} onChange={onChange} />);
    expect(screen.getByText('1 de 3 colores')).toBeTruthy();
    await userEvent.click(screen.getByLabelText('H03 Yellow'));
    expect(onChange).toHaveBeenCalledWith(['a', 'c']);
  });

  it('Todos y Ninguno cambian la seleccion en bloque', async () => {
    const onChange = vi.fn();
    render(<ColorPicker colors={colors} ownedIds={['a']} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Todos' }));
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b', 'c']);
    await userEvent.click(screen.getByRole('button', { name: 'Ninguno' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
