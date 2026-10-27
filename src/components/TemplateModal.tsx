import React from 'react';
import { TEMPLATES } from '../utils/templates';
import { X, Sparkles, Palette, Film, SquarePlus } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (templateKey: string) => void;
}

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  Palette: Palette,
  Film: Film,
  SquarePlus: SquarePlus,
};

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-base text-neutral-900">Creative Templates</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 gap-3 max-h-[65vh] overflow-y-auto">
          {Object.entries(TEMPLATES).map(([key, tpl]) => {
            const Icon = TEMPLATE_ICONS[tpl.icon] || Sparkles;
            return (
              <div
                key={key}
                onClick={() => {
                  onLoadTemplate(key);
                  onClose();
                }}
                className="flex items-start gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-900/60 hover:bg-neutral-50/70 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white flex items-center justify-center text-neutral-700 shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                    {tpl.name}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
