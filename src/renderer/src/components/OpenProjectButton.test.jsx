// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OpenProjectButton from './OpenProjectButton';
import { serializeProject } from '../utils/project';
import { DEFAULT_FILTERS } from '../utils/imageFilters';

afterEach(cleanup);

// jsdom no implementa Blob.text(); se reemplaza por una lectura equivalente
const makeFile = (content) => {
  const file = new File([content], 'p.json', { type: 'application/json' });
  file.text = async () => content;
  return file;
};

describe('OpenProjectButton', () => {
  it('abre un proyecto valido y entrega el estado', async () => {
    const onOpen = vi.fn();
    const onError = vi.fn();
    const { container } = render(<OpenProjectButton onOpen={onOpen} onError={onError} />);
    const project = serializeProject({
      image: 'data:image/png;base64,AAAA',
      filters: DEFAULT_FILTERS,
      templateInfo: null,
      showNumbers: true,
      boardSize: 40
    });
    await userEvent.upload(
      container.querySelector('input[type=file]'),
      makeFile(JSON.stringify(project))
    );
    await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1));
    expect(onOpen.mock.calls[0][0]).toMatchObject({
      showNumbers: true,
      boardSize: 40,
      templateInfo: null
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('informa el error cuando el archivo no es un proyecto', async () => {
    const onOpen = vi.fn();
    const onError = vi.fn();
    const { container } = render(<OpenProjectButton onOpen={onOpen} onError={onError} />);
    await userEvent.upload(container.querySelector('input[type=file]'), makeFile('{"app":"otra"}'));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0][0]).toMatch(/no es un proyecto de PixelCreator/);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
