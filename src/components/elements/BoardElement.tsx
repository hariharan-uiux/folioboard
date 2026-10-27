import React from 'react';
import type { CanvasElement } from '../../types/milanote';
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

  return (
    <div
      onDoubleClick={() => onNavigateBoard(targetBoardId)}
      className="flex flex-col h-full w-full bg-white rounded-lg p-4 border border-neutral-200/90 shadow-xs hover:border-neutral-400/80 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
          <Folder className="w-4 h-4 fill-sky-200 text-sky-600" />
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
          {childItemCount} {childItemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      <input
        type="text"
        value={data.title || ''}
        placeholder="Board Name"
        onChange={handleTitleChange}
        className="font-semibold text-sm text-neutral-900 outline-none bg-transparent mb-1"
        onClick={(e) => e.stopPropagation()}
      />

      <input
        type="text"
        value={data.description || ''}
        placeholder="Short description or purpose..."
        onChange={handleDescChange}
        className="text-xs text-neutral-500 outline-none bg-transparent flex-1 mb-2 placeholder-neutral-400"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-[10px] text-neutral-400 font-medium">Double-click to open</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigateBoard(targetBoardId);
          }}
          className="flex items-center gap-1 text-xs font-medium text-neutral-800 hover:text-black group-hover:translate-x-0.5 transition-all"
        >
          Open <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
