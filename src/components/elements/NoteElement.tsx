import React from 'react';
import type { CanvasElement } from '../../types/milanote';

interface NoteElementProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  isSelected: boolean;
}

export const NoteElement: React.FC<NoteElementProps> = ({ element, onUpdate }) => {
  const data = element.data || { content: '' };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(element.id, {
      data: { ...data, title: e.target.value },
    });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(element.id, {
      data: { ...data, content: e.target.value },
    });
  };

  const isDark = element.color === '#1e293b';

  return (
    <div className="flex flex-col h-full w-full p-4 select-text">
      <input
        type="text"
        value={data.title || ''}
        placeholder="Note Title..."
        onChange={handleTitleChange}
        className={`w-full font-semibold text-sm mb-2 outline-none bg-transparent placeholder-black/30 tracking-tight ${
          isDark ? 'text-white placeholder-white/40' : 'text-neutral-900'
        }`}
      />
      <textarea
        value={data.content || ''}
        placeholder="Type your ideas, inspiration, or notes..."
        onChange={handleContentChange}
        rows={4}
        className={`w-full flex-1 resize-none outline-none bg-transparent text-sm leading-relaxed border-none focus:ring-0 ${
          data.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
        } ${isDark ? 'text-slate-200 placeholder-white/30' : 'text-neutral-700 placeholder-black/30'}`}
      />
    </div>
  );
};
