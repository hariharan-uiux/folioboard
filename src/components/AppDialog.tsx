import React, { useEffect, useRef } from 'react';
import { DuotoneIcon } from './DuotoneIcon';
import {
  AlertTriangle,
  Info,
  AlertCircle,
  HelpCircle,
  X,
} from 'lucide-react';

export type DialogType = 'info' | 'warning' | 'danger' | 'confirm';

export interface DialogOptions {
  type?: DialogType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AppDialogProps {
  isOpen: boolean;
  options: DialogOptions | null;
  onClose: () => void;
}

export const AppDialog: React.FC<AppDialogProps> = ({ isOpen, options, onClose }) => {
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      confirmBtnRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
        options?.onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, options]);

  if (!isOpen || !options) return null;

  const type = options.type || 'info';
  const isConfirm = Boolean(options.onCancel || type === 'confirm' || type === 'danger');

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/60 flex items-center justify-center shrink-0">
            <DuotoneIcon icon={AlertTriangle} className="w-5 h-5" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-center shrink-0">
            <DuotoneIcon icon={AlertCircle} className="w-5 h-5" />
          </div>
        );
      case 'confirm':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-center shrink-0">
            <DuotoneIcon icon={HelpCircle} className="w-5 h-5" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center shrink-0">
            <DuotoneIcon icon={Info} className="w-5 h-5" />
          </div>
        );
    }
  };

  const handleConfirm = () => {
    options.onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    options.onCancel?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1e2024] rounded-2xl shadow-2xl border border-neutral-200/90 dark:border-neutral-700/80 p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 leading-snug">
                {options.title}
              </h3>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <p className="text-sm text-neutral-600 dark:text-neutral-300/90 leading-relaxed">
          {options.message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {isConfirm && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors cursor-pointer"
            >
              {options.cancelLabel || 'Cancel'}
            </button>
          )}

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer ${
              type === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900'
            }`}
          >
            {options.confirmLabel || (isConfirm ? 'Confirm' : 'Got it')}
          </button>
        </div>
      </div>
    </div>
  );
};
