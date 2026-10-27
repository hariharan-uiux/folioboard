import React from 'react';
import type { Board } from '../types/milanote';
import {
  ChevronRight,
  Search,
  Grid3X3,
  Magnet,
  Share2,
  Moon,
  Sun,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentBoard: Board;
  breadcrumbs: { id: string; title: string }[];
  onNavigateBoard: (boardId: string) => void;
  onUpdateBoardTitle: (title: string) => void;
  onOpenSearch: () => void;
  onOpenExport: () => void;
  onOpenTemplates: () => void;
  onResetBoard: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  gridSnap: boolean;
  onToggleSnap: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  zoom: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentBoard,
  breadcrumbs,
  onNavigateBoard,
  onUpdateBoardTitle,
  onOpenSearch,
  onOpenExport,
  onOpenTemplates,
  onResetBoard,
  gridVisible,
  onToggleGrid,
  gridSnap,
  onToggleSnap,
  theme,
  onToggleTheme,
  zoom,
}) => {
  return (
    <header className="h-14 w-full bg-white dark:bg-[#18191c] border-b border-neutral-200/90 dark:border-neutral-800 px-4 flex items-center justify-between select-none z-20 shadow-2xs transition-colors">
      {/* Left: Breadcrumbs & Board Title */}
      <div className="flex items-center gap-2 max-w-[50%]">
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
                    className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 bg-transparent outline-none border-b border-transparent focus:border-neutral-400 dark:focus:border-neutral-600 px-1 py-0.5 max-w-[260px] truncate"
                    placeholder="Board Name"
                  />
                ) : (
                  <button
                    onClick={() => onNavigateBoard(crumb.id)}
                    className="hover:text-neutral-900 dark:hover:text-neutral-100 font-medium truncate max-w-[140px] transition-colors"
                  >
                    {crumb.title}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Center: Global Search Bar */}
      <button
        onClick={onOpenSearch}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-300 text-xs transition-colors border border-neutral-200/60 dark:border-neutral-700/60"
        title="Search cards & notes (Cmd/Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search board...</span>
        <kbd className="text-[10px] font-mono bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-400 dark:text-neutral-400">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        {/* Template Switcher button */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Browse board templates"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Templates</span>
        </button>

        {/* Grid & Snap Toggles */}
        <button
          onClick={onToggleGrid}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            gridVisible
              ? 'text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800'
              : 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title={gridVisible ? 'Hide grid dots' : 'Show grid dots'}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleSnap}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            gridSnap
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
              : 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title={gridSnap ? 'Snap to grid: Enabled' : 'Snap to grid: Disabled'}
        >
          <Magnet className="w-4 h-4" />
        </button>

        {/* Zoom display */}
        <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 px-1 hidden lg:inline">
          {Math.round(zoom * 100)}%
        </span>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Reset */}
        <button
          onClick={onResetBoard}
          className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          title="Reset board to fresh state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-5 bg-neutral-200 dark:bg-neutral-800 mx-1" />

        {/* Export / Share */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-medium shadow-xs transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Export / Share</span>
        </button>
      </div>
    </header>
  );
};
