import React from 'react';
import type { CanvasElement, AnchorPosition } from '../types/folioboard';
import { FOLIOBOARD_PALETTES } from '../utils/templates';
import { DuotoneIcon } from './DuotoneIcon';
import { Copy, Trash2, ArrowUp, ArrowDown, GitBranch } from 'lucide-react';

interface FloatingToolbarProps {
  element: CanvasElement;
  zoom: number;
  onUpdateColor: (color: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onStartConnection: (fromId: string, fromAnchor: AnchorPosition) => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  element,
  zoom,
  onUpdateColor,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onStartConnection,
}) => {
  return (
    <div
      className="absolute flex items-center gap-1.5 p-1 bg-white/95 dark:bg-[#1e2024]/95 backdrop-blur-md rounded-xl border border-neutral-200/90 dark:border-neutral-700 shadow-lg pointer-events-auto select-none z-50 transition-all animate-in fade-in zoom-in-95 duration-150"
      style={{
        transform: `translateY(-120%) scale(${Math.max(0.85, 1 / zoom)})`,
        transformOrigin: 'bottom left',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Color picker */}
      <div className="flex items-center gap-1 px-1.5 border-r border-neutral-200 dark:border-neutral-700">
        {FOLIOBOARD_PALETTES.slice(0, 7).map((p) => (
          <button
            key={p.hex}
            onClick={() => onUpdateColor(p.hex)}
            className={`w-4 h-4 rounded-full border transition-all ${
              element.color === p.hex
                ? 'ring-2 ring-neutral-400 dark:ring-white scale-110'
                : 'border-black/10 dark:border-white/20 hover:scale-105'
            }`}
            style={{ backgroundColor: p.hex }}
            title={p.name}
          />
        ))}
      </div>

      {/* Start Connection */}
      <button
        onClick={() => onStartConnection(element.id, 'right')}
        className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        title="Connect line to another card"
      >
        <DuotoneIcon icon={GitBranch} className="w-3.5 h-3.5" />
      </button>

      {/* Layering */}
      <div className="flex items-center gap-0.5 border-l border-r border-neutral-200 dark:border-neutral-700 px-1">
        <button
          onClick={onBringForward}
          className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Bring to front"
        >
          <DuotoneIcon icon={ArrowUp} className="w-3 h-3" />
        </button>
        <button
          onClick={onSendBackward}
          className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Send to back"
        >
          <DuotoneIcon icon={ArrowDown} className="w-3 h-3" />
        </button>
      </div>

      {/* Duplicate */}
      <button
        onClick={onDuplicate}
        className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        title="Duplicate element (Ctrl+D)"
      >
        <DuotoneIcon icon={Copy} className="w-3.5 h-3.5" />
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        title="Delete (Backspace / Del)"
      >
        <DuotoneIcon icon={Trash2} className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
