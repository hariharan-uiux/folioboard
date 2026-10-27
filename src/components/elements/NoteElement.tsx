import React from 'react';
import type { CanvasElement } from '../../types/folioboard';

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

  const fontSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }[data.fontSize as string] || 'text-sm';

  return (
    <div className="flex flex-col h-full w-full p-4 select-text">
      <input
        type="text"
        value={data.title || ''}
        placeholder="Note Title..."
        onChange={handleTitleChange}
        className={`w-full font-semibold text-sm mb-2 outline-none bg-transparent tracking-tight ${
          isExplicitPastel
            ? 'text-neutral-900 placeholder-neutral-500'
            : 'text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500'
        }`}
      />
      <textarea
        value={data.content || ''}
        placeholder="Type your ideas, inspiration, or notes..."
        onChange={handleContentChange}
        rows={4}
        className={`w-full flex-1 resize-none outline-none bg-transparent leading-relaxed border-none focus:ring-0 ${fontSizeClass} ${
          data.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
        } ${
          isExplicitPastel
            ? 'text-neutral-800 placeholder-neutral-500'
            : 'text-neutral-700 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500'
        }`}
      />
    </div>
  );
};
