import React, { useState } from 'react';
import type { CanvasElement } from '../../types/milanote';
import { Copy, Check } from 'lucide-react';

interface ColorElementProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  isSelected: boolean;
}

export const ColorElement: React.FC<ColorElementProps> = ({ element, onUpdate }) => {
  const data = element.data || { hex: '#2d3748', name: 'Color Swatch', category: 'Palette' };
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(data.hex || '#000000');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleHexChange = (newHex: string) => {
    onUpdate(element.id, {
      data: { ...data, hex: newHex },
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(element.id, {
      data: { ...data, name: e.target.value },
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#1e2024] rounded-lg overflow-hidden border border-neutral-200/90 dark:border-neutral-700/80 shadow-xs">
      {/* Color Swatch block */}
      <div
        className="relative flex-1 min-h-[90px] w-full transition-colors flex items-end p-2 cursor-pointer group"
        style={{ backgroundColor: data.hex || '#e2e8f0' }}
        onClick={handleCopy}
      >
        <input
          type="color"
          value={data.hex || '#ffffff'}
          onChange={(e) => handleHexChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 w-6 h-6 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity p-0 border-0"
          title="Pick custom color"
        />
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur-xs"
        >
          {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
          {copied ? 'Copied' : 'Copy Hex'}
        </button>
      </div>

      {/* Info footer */}
      <div className="p-3 bg-white dark:bg-[#1e2024] flex flex-col gap-0.5 select-text">
        <input
          type="text"
          value={data.name || ''}
          placeholder="Color Name"
          onChange={handleNameChange}
          className="font-medium text-xs text-neutral-900 dark:text-white outline-none bg-transparent"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {data.hex || '#000000'}
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 capitalize">
            {data.category || 'Palette'}
          </span>
        </div>
      </div>
    </div>
  );
};
