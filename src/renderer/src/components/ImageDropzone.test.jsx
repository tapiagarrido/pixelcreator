// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageDropzone from './ImageDropzone';

afterEach(cleanup);

const dropFile = (zone, file) => fireEvent.drop(zone, { dataTransfer: { files: [file] } });

describe('ImageDropzone', () => {
  it('acepta una imagen soltada encima', () => {
    const onFile = vi.fn();
    const { container } = render(<ImageDropzone onFile={onFile} />);
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    dropFile(container.querySelector('label'), file);
    expect(onFile).toHaveBeenCalledWith(file);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('rechaza un archivo que no es imagen y avisa', () => {
    const onFile = vi.fn();
    const { container } = render(<ImageDropzone onFile={onFile} />);
    dropFile(container.querySelector('label'), new File(['x'], 'a.txt', { type: 'text/plain' }));
    expect(onFile).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/no es una imagen/);
  });

  it('el aviso desaparece al aceptar una imagen valida', () => {
    const { container } = render(<ImageDropzone onFile={() => {}} />);
    const zone = container.querySelector('label');
    dropFile(zone, new File(['x'], 'a.txt', { type: 'text/plain' }));
    expect(screen.getByRole('alert')).toBeTruthy();
    dropFile(zone, new File(['x'], 'a.png', { type: 'image/png' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('tambien funciona eligiendo el archivo con el selector', async () => {
    const onFile = vi.fn();
    const { container } = render(<ImageDropzone onFile={onFile} />);
    const file = new File(['x'], 'b.jpg', { type: 'image/jpeg' });
    await userEvent.upload(container.querySelector('input[type=file]'), file);
    expect(onFile).toHaveBeenCalledWith(file);
  });
});
