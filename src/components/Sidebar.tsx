import React from 'react';
import type { ElementType } from '../types/milanote';
import {
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckSquare,
  FolderPlus,
  Columns3,
  Palette,
  PenTool,
  Paperclip,
  LayoutTemplate,
  Trash2,
  HelpCircle,
  GitBranch,
} from 'lucide-react';

interface SidebarProps {
  onAddElement: (type: ElementType) => void;
  onOpenTemplates: () => void;
  onOpenHelp: () => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  onStartConnectingMode?: () => void;
}

const TOOL_ITEMS: {
  type: ElementType;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  { type: 'note', label: 'Note', icon: FileText, description: 'Text & notes' },
  { type: 'image', label: 'Image', icon: ImageIcon, description: 'Photos & visual refs' },
  { type: 'link', label: 'Link', icon: LinkIcon, description: 'Web bookmarks' },
  { type: 'task', label: 'To-do', icon: CheckSquare, description: 'Checklist with progress' },
  { type: 'board', label: 'Board', icon: FolderPlus, description: 'Sub-board folder' },
  { type: 'column', label: 'Column', icon: Columns3, description: 'Card column group' },
  { type: 'color', label: 'Color', icon: Palette, description: 'Color swatch tile' },
  { type: 'sketch', label: 'Sketch', icon: PenTool, description: 'Freehand doodle' },
  { type: 'file', label: 'File', icon: Paperclip, description: 'Document attachment' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  onAddElement,
  onOpenTemplates,
  onOpenHelp,
  onDeleteSelected,
  hasSelection,
  onStartConnectingMode,
}) => {
  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('application/milanote-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="w-18 h-full bg-white border-r border-neutral-200/90 flex flex-col items-center py-3 z-30 select-none shadow-2xs">
      {/* Milanote Logo / Home Icon */}
      <div className="mb-4">
        <div
          className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white font-bold text-lg shadow-sm cursor-pointer hover:bg-neutral-800 transition-colors"
          title="Milanote Canvas"
        >
          <div className="grid grid-cols-2 gap-1 p-2">
            <div className="w-2 h-3 bg-white rounded-xs"></div>
            <div className="w-2 h-4.5 bg-blue-400 rounded-xs"></div>
            <div className="w-2 h-2.5 bg-amber-400 rounded-xs"></div>
            <div className="w-2 h-2 bg-emerald-400 rounded-xs"></div>
          </div>
        </div>
      </div>

      <div className="w-10 h-[1px] bg-neutral-200/80 mb-2" />

      {/* Primary Tool items */}
      <div className="flex-1 w-full flex flex-col items-center gap-1 overflow-y-auto overflow-x-hidden px-1">
        {TOOL_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              draggable
              onDragStart={(e) => handleDragStart(e, item.type)}
              onClick={() => onAddElement(item.type)}
              className="group relative w-14 h-13 rounded-xl flex flex-col items-center justify-center gap-0.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/90 active:scale-95 transition-all cursor-grab active:cursor-grabbing"
              title={`${item.label} (Click to add or drag onto canvas)`}
            >
              <Icon className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium tracking-tight text-neutral-500 group-hover:text-neutral-900">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Connection Line Tool */}
        <button
          onClick={onStartConnectingMode}
          className="group relative w-14 h-13 rounded-xl flex flex-col items-center justify-center gap-0.5 text-neutral-600 hover:text-blue-600 hover:bg-blue-50/80 active:scale-95 transition-all"
          title="Line connector (Select card anchor to connect)"
        >
          <GitBranch className="w-4.5 h-4.5 group-hover:scale-110 transition-transform text-neutral-600 group-hover:text-blue-600" />
          <span className="text-[10px] font-medium tracking-tight text-neutral-500 group-hover:text-blue-600">
            Line
          </span>
        </button>
      </div>

      <div className="w-10 h-[1px] bg-neutral-200/80 my-2" />

      {/* Bottom utility icons */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={onOpenTemplates}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          title="Templates Library"
        >
          <LayoutTemplate className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            hasSelection
              ? 'text-red-500 hover:bg-red-50 cursor-pointer'
              : 'text-neutral-300 cursor-not-allowed'
          }`}
          title={hasSelection ? 'Delete Selected (Del)' : 'Trash'}
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={onOpenHelp}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          title="Shortcuts & Tips"
        >
          <HelpCircle className="w-4.5 h-4.5" />
        </button>
      </div>
    </aside>
  );
};
