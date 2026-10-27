import React from 'react';
import { DuotoneIcon } from './DuotoneIcon';
import { X, Keyboard, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Wheel', action: 'Scroll vertically across the board' },
  { key: 'Shift + Wheel', action: 'Scroll horizontally across the board' },
  { key: 'Ctrl / Cmd + Wheel', action: 'Zoom in and out centered on cursor' },
  { key: 'Space + Drag / Hand (H)', action: 'Pan infinitely in any direction' },
  { key: 'Drag background (Arrow V)', action: 'Draw marquee box to select cards' },
  { key: '⌘ / Ctrl + A', action: 'Select all cards on board' },
  { key: 'Arrow keys (Shift)', action: 'Nudge selected cards (10px / 40px)' },
  { key: '⌘ / Ctrl + C / V', action: 'Copy & paste cards or screenshot images' },
  { key: '⌘ / Ctrl + Z / Y', action: 'Undo and Redo canvas actions' },
  { key: '⌘ / Ctrl + K', action: 'Global search cards across all boards' },
  { key: 'Double-click Board', action: 'Enter nested sub-board' },
  { key: 'Delete / Backspace', action: 'Remove selected card or connection line' },
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#18191c] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <DuotoneIcon icon={HelpCircle} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-base text-neutral-900 dark:text-white">Milanote Canvas Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
            <DuotoneIcon icon={Keyboard} className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span>Shortcuts & Gestures</span>
          </div>

          <div className="space-y-2">
            {SHORTCUTS.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/60 text-xs"
              >
                <span className="text-neutral-600 dark:text-neutral-300">{s.action}</span>
                <kbd className="px-2 py-0.5 font-mono text-[11px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 shadow-2xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            💡 <strong>Pro Tip:</strong> Click any connection line to edit its label or delete it. All changes persist automatically to your local browser storage.
          </div>
        </div>
      </div>
    </div>
  );
};
