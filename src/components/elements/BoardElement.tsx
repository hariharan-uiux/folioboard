import React from 'react';
import type { CanvasElement } from '../../types/folioboard';
import { DuotoneIcon } from '../DuotoneIcon';
import { Folder, ArrowRight } from 'lucide-react';

interface BoardElementProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onNavigateBoard: (boardId: string) => void;
  childItemCount?: number;
  isSelected: boolean;
}

export const BoardElement: React.FC<BoardElementProps> = ({
  element,
  onUpdate,
  onNavigateBoard,
  childItemCount = 0,
}) => {
  const data = element.data || { title: 'Sub-board', targetBoardId: element.id };
  const targetBoardId = data.targetBoardId || element.id;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(element.id, {
      data: { ...data, title: e.target.value },
    });
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(element.id, {
      data: { ...data, description: e.target.value },
    });
  };

  const isExplicitPastel = [
    '#fefce8',
    '#fef3c7',
    '#fce7f3',
    '#fbcfe8',
    '#f3e8ff',
    '#e0f2fe',
    '#dcfce7',
    '#ecfdf5',
    '#fed7aa',
  ].includes(element.color);

  return (
    <div
      onDoubleClick={() => onNavigateBoard(targetBoardId)}
      className="flex flex-col h-full w-full p-4 cursor-pointer group select-none justify-between"
    >
      {/* Header: Folder Icon & Items Count Badge */}
      <div className="flex items-center justify-between mb-2">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs ${
            isExplicitPastel
              ? 'bg-black/10 text-neutral-800'
              : 'bg-blue-500/10 dark:bg-blue-400/15 text-blue-600 dark:text-blue-400'
          }`}
        >
          <DuotoneIcon
            icon={Folder}
            className={`w-4 h-4 ${
              isExplicitPastel
                ? 'text-neutral-800'
                : 'text-blue-600 dark:text-blue-400'
            }`}
          />
        </div>
        <span
          className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
            isExplicitPastel
              ? 'bg-black/10 text-neutral-800'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
          }`}
        >
          {childItemCount} {childItemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Title & Description */}
      <div className="flex-1 flex flex-col justify-center min-h-0 my-1">
        <input
          type="text"
          value={data.title || ''}
          placeholder="Board Name"
          onChange={handleTitleChange}
          className={`font-semibold text-sm outline-none bg-transparent truncate mb-0.5 ${
            isExplicitPastel
              ? 'text-neutral-900 placeholder-neutral-500'
              : 'text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500'
          }`}
          onClick={(e) => e.stopPropagation()}
        />

        <input
          type="text"
          value={data.description || ''}
          placeholder="Short description or purpose..."
          onChange={handleDescChange}
          className={`text-xs outline-none bg-transparent truncate ${
            isExplicitPastel
              ? 'text-neutral-700 placeholder-neutral-500'
              : 'text-neutral-500 dark:text-neutral-400 placeholder-neutral-400 dark:placeholder-neutral-500'
          }`}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Footer: Double-click hint & Open button */}
      <div
        className={`pt-2.5 border-t flex items-center justify-between mt-auto ${
          isExplicitPastel
            ? 'border-black/10'
            : 'border-neutral-100 dark:border-neutral-800'
        }`}
      >
        <span
          className={`text-[11px] font-medium ${
            isExplicitPastel
              ? 'text-neutral-600'
              : 'text-neutral-400 dark:text-neutral-500'
          }`}
        >
          Double-click to open
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigateBoard(targetBoardId);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all group-hover:translate-x-0.5 active:scale-95 ${
            isExplicitPastel
              ? 'bg-black/10 hover:bg-black/15 text-neutral-900'
              : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white'
          }`}
        >
          Open <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
