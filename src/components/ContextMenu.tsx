import React, { useEffect, useRef } from 'react';
import type { CanvasElement } from '../types/folioboard';
import { Check } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  element: CanvasElement;
  onClose: () => void;
  onCut: () => void;
  onCopy: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDownloadOriginal?: () => void;
  onReplaceImage?: () => void;
  onToggleCropToGrid?: () => void;
  onToggleLock: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return 'just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  element,
  onClose,
  onCut,
  onCopy,
  onDuplicate,
  onDelete,
  onDownloadOriginal,
  onReplaceImage,
  onToggleCropToGrid,
  onToggleLock,
  onBringToFront,
  onSendToBack,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isImage = element.type === 'image';
  const isCropChecked = element.data?.cropToGrid !== false;

  // Platform shortcut detection
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform || '');

  // Close on outside click or escape
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust coordinates to keep inside window bounds
  const MENU_WIDTH = 230;
  const MENU_HEIGHT = isImage ? 360 : 260;
  const adjustedX = Math.max(8, Math.min(x, window.innerWidth - MENU_WIDTH - 12));
  const adjustedY = Math.max(8, Math.min(y, window.innerHeight - MENU_HEIGHT - 12));

  return (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-50 w-[230px] bg-[#222222] border border-[#383838] rounded-xl shadow-2xl shadow-black/80 p-1.5 flex flex-col font-sans select-none animate-in fade-in zoom-in-95 duration-100"
      style={{ left: adjustedX, top: adjustedY }}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Basic Editing Actions */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCut();
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[#f2f2f2] hover:bg-[#343434] transition-colors cursor-pointer text-left"
      >
        <span>Cut</span>
        <span className="text-xs text-[#888888] font-normal tracking-tight">
          {isMac ? '⌘X' : 'Ctrl + X'}
        </span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onCopy();
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[#f2f2f2] hover:bg-[#343434] transition-colors cursor-pointer text-left"
      >
        <span>Copy</span>
        <span className="text-xs text-[#888888] font-normal tracking-tight">
          {isMac ? '⌘C' : 'Ctrl + C'}
        </span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[#f2f2f2] hover:bg-[#343434] transition-colors cursor-pointer text-left"
      >
        <span>Duplicate</span>
        <span className="text-xs text-[#888888] font-normal tracking-tight">
          {isMac ? '⌘D' : 'Ctrl + D'}
        </span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[#f2f2f2] hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer text-left"
      >
        <span>Delete</span>
        <span className="text-xs text-[#888888] font-normal tracking-tight">
          {isMac ? '⌫' : 'Backspace'}
        </span>
      </button>

      {/* 2. Image-Specific Options */}
      {isImage && (
        <>
          <div className="h-[1px] bg-[#333333] my-1 mx-1" />

          {onDownloadOriginal && (
            <button
              onClick={onDownloadOriginal}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[#f2f2f2] hover:bg-[#343434] transition-colors cursor-pointer text-left"
            >
              <span>Download Original Image</span>
            </button>
          )}

          {onReplaceImage && (
            <button
              onClick={onReplaceImage}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[#f2f2f2] hover:bg-[#343434] transition-colors cursor-pointer text-left"
            >
              <span>Replace Image</span>
            </button>
          )}

          {onToggleCropToGrid && (
            <button
              onClick={onToggleCropToGrid}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[#f2f2f2] hover:bg-[#343434] transition-colors cursor-pointer text-left"
            >
              <span>Crop Image to Fit Dot Grid</span>
              {isCropChecked && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
            </button>
          )}
        </>
      )}

      {/* 3. Object State */}
      <div className="h-[1px] bg-[#333333] my-1 mx-1" />
      <button
        onClick={onToggleLock}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[#f2f2f2] hover:bg-[#343434] transition-colors cursor-pointer text-left"
      >
        <span>{element.locked ? 'Unlock Position' : 'Lock Position'}</span>
      </button>

      {/* 4. Layering / Stacking Order */}
      <div className="h-[1px] bg-[#333333] my-1 mx-1" />
      <button
        onClick={onBringToFront}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[#f2f2f2] hover:bg-[#343434] transition-colors cursor-pointer text-left"
      >
        <span>Bring to Front</span>
      </button>

      <button
        onClick={onSendToBack}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-[#f2f2f2] hover:bg-[#343434] transition-colors cursor-pointer text-left"
      >
        <span>Send to Back</span>
      </button>

      {/* 5. Element History & Metadata */}
      <div className="h-[1px] bg-[#333333] my-1 mx-1" />
      <div className="flex items-center gap-2.5 px-2.5 py-2 text-[#9a9a9a] select-none">
        <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shrink-0 border border-white/20">
          <span className="text-[10px] font-semibold text-white">H</span>
        </div>
        <span className="text-[11px] leading-tight text-[#9a9a9a]">
          Created by you {formatRelativeTime(element.createdAt)}, modified{' '}
          {formatRelativeTime(element.updatedAt)}
        </span>
      </div>
    </div>
  );
};
