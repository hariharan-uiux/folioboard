import React from 'react';
import type { CanvasElement } from '../../types/folioboard';
import { DuotoneIcon } from '../DuotoneIcon';
import { Columns3 } from 'lucide-react';

interface ColumnElementProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  isSelected: boolean;
}

export const ColumnElement: React.FC<ColumnElementProps> = ({ element, onUpdate }) => {
  const data = element.data || { title: 'Column Stack' };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(element.id, {
      data: { ...data, title: e.target.value },
    });
  };

  return (
    <div className="flex flex-col h-full w-full p-3.5 select-text">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-neutral-200/80 dark:border-neutral-700/80">
        <DuotoneIcon icon={Columns3} className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
        <input
          type="text"
          value={data.title || ''}
          placeholder="Column Title..."
          onChange={handleTitleChange}
          className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 bg-transparent outline-none flex-1 truncate"
        />
        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-200/70 dark:bg-neutral-800 px-2 py-0.5 rounded-full font-medium">
          Stack
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-neutral-400 dark:text-neutral-500 border border-neutral-200/60 dark:border-neutral-800/80 rounded-xl bg-white/40 dark:bg-neutral-900/40">
        <p className="text-xs">Drag notes or cards here to group them</p>
      </div>
    </div>
  );
};
