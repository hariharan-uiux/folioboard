import React from 'react';
import { X, Keyboard, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Drag background', action: 'Pan infinitely across the board' },
  { key: 'Wheel / Pinch', action: 'Zoom in and out smoothly' },
  { key: 'Box selection', action: 'Drag a selection marquee to select multiple cards' },
  { key: 'Drag from dock', action: 'Drag any tool from the left sidebar onto canvas' },
  { key: 'Hover card anchors', action: 'Drag connection line between any two cards' },
  { key: 'Double-click Board', action: 'Enter nested sub-board' },
  { key: '⌘ / Ctrl + K', action: 'Global search cards across all boards' },
  { key: '⌘ / Ctrl + D', action: 'Duplicate selected cards' },
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
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-base text-neutral-900">Milanote Canvas Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 uppercase tracking-wider">
            <Keyboard className="w-4 h-4 text-neutral-500" />
            <span>Shortcuts & Gestures</span>
          </div>

          <div className="space-y-2">
            {SHORTCUTS.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-neutral-50 border border-neutral-100 text-xs"
              >
                <span className="text-neutral-600">{s.action}</span>
                <kbd className="px-2 py-0.5 font-mono text-[11px] bg-white border border-neutral-200 rounded text-neutral-800 shadow-2xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 leading-relaxed">
            💡 <strong>Pro Tip:</strong> Click any connection line to edit its label or delete it. All changes persist automatically to your local browser storage.
          </div>
        </div>
      </div>
    </div>
  );
};
