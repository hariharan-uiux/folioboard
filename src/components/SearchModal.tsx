import React, { useState, useEffect, useMemo } from 'react';
import type { CanvasElement, Board } from '../types/milanote';
import { DuotoneIcon } from './DuotoneIcon';
import {
  Search,
  X,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckSquare,
  Folder,
  Palette,
  PenTool,
  Paperclip,
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: Record<string, CanvasElement>;
  boards: Record<string, Board>;
  onSelectElement: (elementId: string, boardId: string) => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  note: FileText,
  image: ImageIcon,
  link: LinkIcon,
  task: CheckSquare,
  board: Folder,
  color: Palette,
  sketch: PenTool,
  file: Paperclip,
};

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  elements,
  boards,
  onSelectElement,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    return Object.values(elements).filter((el) => {
      const data = el.data || {};
      const titleMatch = (data.title || '').toLowerCase().includes(q);
      const contentMatch = (data.content || '').toLowerCase().includes(q);
      const captionMatch = (data.caption || '').toLowerCase().includes(q);
      const urlMatch = (data.url || '').toLowerCase().includes(q);
      const colorMatch = (data.name || '').toLowerCase().includes(q) || (data.hex || '').toLowerCase().includes(q);
      const fileMatch = (data.fileName || '').toLowerCase().includes(q);
      const taskMatch = (data.items || []).some((item: any) =>
        (item.text || '').toLowerCase().includes(q)
      );

      return (
        titleMatch ||
        contentMatch ||
        captionMatch ||
        urlMatch ||
        colorMatch ||
        fileMatch ||
        taskMatch
      );
    });
  }, [query, elements]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-24 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#18191c] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
          <DuotoneIcon icon={Search} className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            autoFocus
            value={query}
            placeholder="Search notes, tasks, images, colors across boards..."
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-neutral-100 dark:divide-neutral-800">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-xs text-neutral-400 dark:text-neutral-500">
              Type keywords to search across all your creative items...
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400 dark:text-neutral-500">
              No creative elements found matching "{query}"
            </div>
          ) : (
            results.map((el) => {
              const Icon = (TYPE_ICONS[el.type] || FileText) as any;
              const boardTitle = boards[el.boardId]?.title || 'Main Board';
              const data = el.data || {};
              const title =
                data.title ||
                data.name ||
                data.fileName ||
                data.caption ||
                data.url ||
                'Untitled ' + el.type;
              const preview =
                data.content ||
                data.description ||
                (data.items ? `${data.items.length} checklist items` : '') ||
                data.hex ||
                '';

              return (
                <div
                  key={el.id}
                  onClick={() => {
                    onSelectElement(el.id, el.boardId);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-xl cursor-pointer transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-700"
                    style={{ backgroundColor: el.color || '#f8f9fa' }}
                  >
                    <DuotoneIcon icon={Icon} className="w-4 h-4 text-neutral-700 dark:text-neutral-900" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {title}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded-full">
                        {el.type}
                      </span>
                    </div>
                    {preview && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{preview}</p>
                    )}
                  </div>

                  <div className="text-[11px] text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 shrink-0">
                    {boardTitle}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
