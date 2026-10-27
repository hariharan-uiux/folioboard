import React, { useState } from 'react';
import type { CanvasElement, TaskItem } from '../../types/folioboard';
import { DuotoneIcon } from '../DuotoneIcon';
import { CheckSquare, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskElementProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  isSelected: boolean;
}

export const TaskElement: React.FC<TaskElementProps> = ({ element, onUpdate }) => {
  const data = element.data || { title: 'To-Do List', items: [] };
  const items: TaskItem[] = data.items || [];
  const [newText, setNewText] = useState('');

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(element.id, {
      data: { ...data, title: e.target.value },
    });
  };

  const handleToggleItem = (itemId: string) => {
    const nextItems = items.map((item) => {
      if (item.id === itemId) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });

    const nextCompleted = nextItems.filter((i) => i.completed).length;
    // If completing the last item, fire confetti!
    if (nextCompleted === nextItems.length && nextItems.length > 0 && completedCount < totalCount) {
      try {
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch (err) {
        console.error(err);
      }
    }

    onUpdate(element.id, {
      data: { ...data, items: nextItems },
    });
  };

  const handleAddItem = () => {
    if (!newText.trim()) return;
    const newItem: TaskItem = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: newText.trim(),
      completed: false,
    };
    onUpdate(element.id, {
      data: { ...data, items: [...items, newItem] },
    });
    setNewText('');
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdate(element.id, {
      data: { ...data, items: items.filter((i) => i.id !== itemId) },
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
    <div className="flex flex-col h-full w-full p-4 select-text">
      {/* Header & Title */}
      <div className="flex items-center gap-2 mb-2">
        <DuotoneIcon
          icon={CheckSquare}
          className={`w-4 h-4 ${
            isExplicitPastel
              ? 'text-neutral-700'
              : 'text-neutral-700 dark:text-amber-400'
          }`}
        />
        <input
          type="text"
          value={data.title || ''}
          placeholder="To-Do List"
          onChange={handleTitleChange}
          className={`flex-1 font-semibold text-sm outline-none bg-transparent ${
            isExplicitPastel
              ? 'text-neutral-900 placeholder-neutral-500'
              : 'text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500'
          }`}
        />
        {totalCount > 0 && (
          <span
            className={`text-[11px] font-medium ${
              isExplicitPastel
                ? 'text-neutral-600'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 mb-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              progress === 100
                ? 'bg-emerald-500'
                : isExplicitPastel
                ? 'bg-neutral-800'
                : 'bg-neutral-800 dark:bg-amber-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Checklist items */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2 group/item text-xs py-0.5 rounded-lg transition-colors"
          >
            <button
              onClick={() => handleToggleItem(item.id)}
              className="mt-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors focus:outline-none"
            >
              {item.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
              ) : (
                <div
                  className={`w-3.5 h-3.5 rounded-md border ${
                    isExplicitPastel
                      ? 'border-neutral-400'
                      : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-500'
                  }`}
                />
              )}
            </button>
            <span
              onClick={() => handleToggleItem(item.id)}
              className={`flex-1 cursor-pointer select-text leading-tight ${
                item.completed
                  ? 'line-through text-neutral-400 dark:text-neutral-500'
                  : isExplicitPastel
                  ? 'text-neutral-800'
                  : 'text-neutral-800 dark:text-neutral-200'
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => handleDeleteItem(item.id)}
              className="opacity-0 group-hover/item:opacity-100 p-0.5 text-neutral-400 hover:text-red-500 transition-opacity"
              title="Delete task"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new task input */}
      <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 flex items-center gap-1.5">
        <input
          type="text"
          value={newText}
          placeholder="Add an item..."
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          className={`flex-1 text-xs bg-transparent outline-none ${
            isExplicitPastel
              ? 'text-neutral-800 placeholder-neutral-500'
              : 'text-neutral-800 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500'
          }`}
        />
        <button
          onClick={handleAddItem}
          disabled={!newText.trim()}
          className="p-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/20 disabled:opacity-30 text-neutral-700 dark:text-neutral-200 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
