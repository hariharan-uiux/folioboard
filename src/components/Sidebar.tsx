import React from 'react';
import type { ElementType } from '../types/folioboard';
import { DuotoneIcon } from './DuotoneIcon';
import {
  MousePointer2,
  Hand,
  FileText,
  UploadCloud,
  Link as LinkIcon,
  CheckSquare,
  FolderPlus,
  Columns3,
  Palette,
  PenTool,
  LayoutTemplate,
  Trash2,
  HelpCircle,
  GitBranch,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  activeTool: 'select' | 'hand';
  onToolChange: (tool: 'select' | 'hand') => void;
  onAddElement: (type: ElementType) => void;
  onOpenUpload?: (tab?: 'media' | 'file') => void;
  onOpenTemplates: () => void;
  onOpenHelp: () => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  onStartConnectingMode?: () => void;
}

const TOOL_ITEMS: {
  type: ElementType | 'upload';
  label: string;
  icon: any;
  description: string;
}[] = [
  { type: 'note', label: 'Note', icon: FileText, description: 'Text & notes' },
  { type: 'upload', label: 'Upload', icon: UploadCloud, description: 'Upload images, videos & files' },
  { type: 'link', label: 'Link', icon: LinkIcon, description: 'Web bookmarks' },
  { type: 'task', label: 'To-do', icon: CheckSquare, description: 'Checklist with progress' },
  { type: 'board', label: 'Board', icon: FolderPlus, description: 'Sub-board folder' },
  { type: 'column', label: 'Column', icon: Columns3, description: 'Card column group' },
  { type: 'color', label: 'Color', icon: Palette, description: 'Color swatch tile' },
  { type: 'sketch', label: 'Sketch', icon: PenTool, description: 'Freehand doodle' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTool,
  onToolChange,
  onAddElement,
  onOpenUpload,
  onOpenTemplates,
  onOpenHelp,
  onDeleteSelected,
  hasSelection,
  onStartConnectingMode,
}) => {
  const handleItemClick = (type: ElementType | 'upload') => {
    if (type === 'upload') {
      if (onOpenUpload) onOpenUpload('media');
      return;
    }
    onAddElement(type);
  };

  const handleDragStart = (e: React.DragEvent, type: ElementType | 'upload') => {
    e.dataTransfer.setData('application/folioboard-type', type);
    e.dataTransfer.setData('application/folioboard-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="w-18 h-full bg-white dark:bg-[#18191c] border-r border-neutral-200/90 dark:border-neutral-800 flex flex-col items-center py-3 z-30 select-none shadow-2xs transition-colors">
      {/* Folioboard Brand Logo */}
      <div className="mb-2">
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center text-white shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all border border-blue-400/20 shadow-blue-500/20"
          title="Folioboard Canvas"
        >
          <DuotoneIcon
            icon={Layers}
            className="w-5 h-5 text-white"
            fillColor="currentColor"
            fillOpacity={0.35}
            strokeWidth={2.2}
          />
        </div>
      </div>

      {/* Select (Arrow) vs Hand (Pan) Mode */}
      <div className="flex flex-col gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl mb-2">
        <button
          onClick={() => onToolChange('select')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'select'
              ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
          title="Arrow Selection Tool (V) - Click to select or drag marquee to select contents"
        >
          <DuotoneIcon icon={MousePointer2} className="w-4 h-4" />
        </button>
        <button
          onClick={() => onToolChange('hand')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'hand'
              ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
          title="Hand / Pan Tool (H) - Drag anywhere to move canvas"
        >
          <DuotoneIcon icon={Hand} className="w-4 h-4" />
        </button>
      </div>

      <div className="w-10 h-[1px] bg-neutral-200/80 dark:bg-neutral-800 mb-2" />

      {/* Primary Tool items */}
      <div className="flex-1 w-full flex flex-col items-center gap-1 overflow-y-auto overflow-x-hidden px-1">
        {TOOL_ITEMS.map((item) => {
          return (
            <button
              key={item.type}
              draggable
              onDragStart={(e) => handleDragStart(e, item.type)}
              onClick={() => handleItemClick(item.type)}
              className="group relative w-14 min-h-[52px] py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100/90 dark:hover:bg-neutral-800/90 active:scale-95 transition-all cursor-grab active:cursor-grabbing"
              title={`${item.label} (${item.type === 'upload' ? 'Click to upload images, videos & files' : 'Click to add'} or drag onto canvas)`}
            >
              <DuotoneIcon
                icon={item.icon}
                className="w-4.5 h-4.5 group-hover:scale-110 transition-transform"
              />
              <span className="text-[9.5px] leading-tight font-medium tracking-tight text-center px-0.5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Connection Line Tool */}
        <button
          onClick={onStartConnectingMode}
          className="group relative w-14 h-13 rounded-xl flex flex-col items-center justify-center gap-0.5 text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 active:scale-95 transition-all"
          title="Line connector (Select card anchor to connect)"
        >
          <DuotoneIcon
            icon={GitBranch}
            className="w-4.5 h-4.5 group-hover:scale-110 transition-transform"
          />
          <span className="text-[10px] font-medium tracking-tight text-neutral-500 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            Line
          </span>
        </button>
      </div>

      <div className="w-10 h-[1px] bg-neutral-200/80 dark:bg-neutral-800 my-2" />

      {/* Bottom utility icons */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={onOpenTemplates}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Templates Library"
        >
          <DuotoneIcon icon={LayoutTemplate} className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            hasSelection
              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer'
              : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
          }`}
          title={hasSelection ? 'Delete Selected (Del)' : 'Trash'}
        >
          <DuotoneIcon icon={Trash2} className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={onOpenHelp}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Shortcuts & Tips"
        >
          <DuotoneIcon icon={HelpCircle} className="w-4.5 h-4.5" />
        </button>
      </div>
    </aside>
  );
};
