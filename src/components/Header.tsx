import React from 'react';
import type { Board } from '../types/folioboard';
import { DuotoneIcon } from './DuotoneIcon';
import {
  ChevronRight,
  Search,
  Grid3X3,
  Magnet,
  Share2,
  Moon,
  Sun,
  RotateCcw,
} from 'lucide-react';

interface HeaderProps {
  currentBoard: Board;
  breadcrumbs: { id: string; title: string }[];
  onNavigateBoard: (boardId: string) => void;
  onUpdateBoardTitle: (title: string) => void;
  onOpenSearch: () => void;
  onOpenExport: () => void;
  onOpenTemplates?: () => void;
  onResetBoard: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  gridSnap: boolean;
  onToggleSnap: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  zoom?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentBoard,
  breadcrumbs,
  onNavigateBoard,
  onUpdateBoardTitle,
  onOpenSearch,
  onOpenExport,
  onResetBoard,
  gridVisible,
  onToggleGrid,
  gridSnap,
  onToggleSnap,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="h-14 w-full bg-white dark:bg-[#18191c] border-b border-neutral-200/90 dark:border-neutral-800 px-4 flex items-center justify-between select-none z-20 shadow-2xs transition-colors">
      {/* Left: Breadcrumbs & Board Title */}
      <div className="flex items-center gap-2 min-w-[180px] max-w-[30%]">
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 overflow-hidden text-ellipsis whitespace-nowrap">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600 shrink-0" />}
                {isLast ? (
                  <input
                    type="text"
                    value={currentBoard.title || 'Untitled Board'}
                    onChange={(e) => onUpdateBoardTitle(e.target.value)}
                    className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 bg-transparent outline-none border-b border-transparent focus:border-neutral-400 dark:focus:border-neutral-600 px-1 py-0.5 max-w-[200px] truncate"
                    placeholder="Board Name"
                  />
                ) : (
                  <button
                    onClick={() => onNavigateBoard(crumb.id)}
                    className="hover:text-neutral-900 dark:hover:text-neutral-100 font-medium truncate max-w-[120px] transition-colors"
                  >
                    {crumb.title}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Center: Bigger Global Search Bar */}
      <div className="flex-1 flex justify-center px-4 max-w-xl">
        <button
          onClick={onOpenSearch}
          className="w-full max-w-md h-9 flex items-center justify-between px-3.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/70 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs transition-all border border-neutral-200/60 dark:border-neutral-700/60 hover:border-neutral-300 dark:hover:border-neutral-600 shadow-2xs group"
          title="Search cards & notes (Cmd/Ctrl+K)"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <DuotoneIcon
              icon={Search}
              className="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors shrink-0"
            />
            <span className="font-normal truncate">Search cards, notes, tasks across boards...</span>
          </div>
          <kbd className="text-[10px] font-mono font-medium bg-white dark:bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-400 shadow-2xs shrink-0 ml-2">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Export, Reset, Theme, Magnet, Grid icons alone */}
      <div className="flex items-center gap-1 min-w-[180px] justify-end">
        {/* Grid Toggle */}
        <button
          onClick={onToggleGrid}
          className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${
            gridVisible
              ? 'text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800'
              : 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title={gridVisible ? 'Hide grid dots' : 'Show grid dots'}
        >
          <DuotoneIcon icon={Grid3X3} className="w-4 h-4" />
        </button>

        {/* Magnet / Snap Toggle */}
        <button
          onClick={onToggleSnap}
          className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${
            gridSnap
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
              : 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title={gridSnap ? 'Snap to grid: Enabled' : 'Snap to grid: Disabled'}
        >
          <DuotoneIcon icon={Magnet} className="w-4 h-4" />
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
        >
          {theme === 'light' ? (
            <DuotoneIcon icon={Moon} className="w-4 h-4" />
          ) : (
            <DuotoneIcon icon={Sun} className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Reset Board */}
        <button
          onClick={onResetBoard}
          className="p-2 rounded-xl text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
          title="Reset board to fresh state"
        >
          <DuotoneIcon icon={RotateCcw} className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-1" />

        {/* Export / Share Icon Alone */}
        <button
          onClick={onOpenExport}
          className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Export / Share board (Markdown, JSON, PDF)"
        >
          <DuotoneIcon icon={Share2} className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
