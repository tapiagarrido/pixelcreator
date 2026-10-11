import { useMemo } from 'react';

const ColorPicker = ({ colors, ownedIds, onChange }) => {
  const selected = useMemo(
    () => new Set(ownedIds ?? colors.map((color) => color.id)),
    [ownedIds, colors]
  );
  const selectedCount = colors.filter((color) => selected.has(color.id)).length;

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
        <span className="font-semibold">
          {selectedCount} de {colors.length} colores
        </span>
        <button
          type="button"
          className="px-2 border rounded-lg bg-white hover:bg-gray-100"
          onClick={() => onChange(colors.map((c) => c.id))}
        >
          Todos
        </button>
        <button
          type="button"
          className="px-2 border rounded-lg bg-white hover:bg-gray-100"
          onClick={() => onChange([])}
        >
          Ninguno
        </button>
      </div>

      <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto p-1">
        {colors.map((color) => {
          const isOn = selected.has(color.id);
          return (
            <button
              key={color.id}
              type="button"
              title={`${color.code} · ${color.name}`}
              aria-label={`${color.code} ${color.name}`}
              aria-pressed={isOn}
              onClick={() => toggle(color.id)}
              style={{ backgroundColor: color.hex }}
              className={`w-7 h-7 rounded border ${
                isOn ? 'border-black ring-2 ring-blue-500' : 'border-black/20 opacity-25'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ColorPicker;
