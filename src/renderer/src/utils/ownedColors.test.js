import { describe, expect, it } from 'vitest';
import { applySelection, getActiveColors, getAvailableColors } from './ownedColors';

const colors = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
  { id: 's', name: 'Transparent', special: true }
];

describe('ownedColors', () => {
  it('oculta los especiales salvo que se pidan', () => {
    expect(getAvailableColors(colors, false).map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(getAvailableColors(colors, true)).toHaveLength(4);
  });

  it('sin seleccion guardada se usan todos los disponibles', () => {
    expect(getActiveColors(colors, { ownedIds: null }).map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('filtra por los colores propios', () => {
    const active = getActiveColors(colors, { includeSpecial: true, ownedIds: ['a', 's'] });
    expect(active.map((c) => c.id)).toEqual(['a', 's']);
  });

  it('una seleccion vacia no deja colores', () => {
    expect(getActiveColors(colors, { ownedIds: [] })).toEqual([]);
  });

  it('applySelection devuelve null cuando se tienen todos', () => {
    expect(applySelection(colors, false, null, ['a', 'b', 'c'])).toBeNull();
  });

  it('applySelection conserva el estado de los colores ocultos', () => {
    // el especial 's' estaba como propio (prev null = todos) y sigue oculto
    expect(applySelection(colors, false, null, ['a'])).toEqual(['a', 's']);
    // el especial no estaba entre los propios y sigue sin estarlo
    expect(applySelection(colors, false, ['a', 'b'], ['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });
});
