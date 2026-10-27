import { useEffect } from 'react';
import type { ElementType } from '../types/milanote';

interface KeyboardShortcutsProps {
  onSelectTool: (tool: 'select' | 'hand') => void;
  onAddElement: (type: ElementType) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onCutSelected: () => void;
  onNudgeSelected: (dx: number, dy: number) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitView: () => void;
  onNavigateParentBoard: () => void;
  onOpenSearch: () => void;
  onOpenExport: () => void;
  onOpenHelp: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  hasSelection: boolean;
  canNavigateUp: boolean;
}

export function useKeyboardShortcuts({
  onSelectTool,
  onAddElement,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onDuplicateSelected,
  onCutSelected,
  onNudgeSelected,
  onBringForward,
  onSendBackward,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitView,
  onNavigateParentBoard,
  onOpenSearch,
  onOpenExport,
  onOpenHelp,
  onUndo,
  onRedo,
  hasSelection,
  canNavigateUp,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Escape always works (even in inputs to blur or close modals)
      if (e.key === 'Escape') {
        if (isInput) {
          target.blur();
        } else {
          onDeselectAll();
        }
        return;
      }

      // If user is currently typing in an input or textarea, skip global hotkeys
      if (isInput) return;

      const isMeta = e.metaKey || e.ctrlKey;

      // 1. Modals & Global actions
      if (isMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      if (isMeta && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        onOpenExport();
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        onOpenHelp();
        return;
      }

      // 2. Undo & Redo
      if (isMeta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
        return;
      }

      if (isMeta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // 3. Selection & Manipulation
      if (isMeta && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        onSelectAll();
        return;
      }

      if (isMeta && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (hasSelection) onDuplicateSelected();
        return;
      }

      if (isMeta && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        if (hasSelection) onCutSelected();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (hasSelection) {
          e.preventDefault();
          onDeleteSelected();
          return;
        } else if (canNavigateUp && e.altKey) {
          e.preventDefault();
          onNavigateParentBoard();
          return;
        }
      }

      // 4. Arrow Key Nudging
      if (
        hasSelection &&
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 40 : 10;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        onNudgeSelected(dx, dy);
        return;
      }

      // 5. Layering (Send backward: [, Bring forward: ])
      if (hasSelection) {
        if (e.key === '[') {
          e.preventDefault();
          onSendBackward();
          return;
        }
        if (e.key === ']') {
          e.preventDefault();
          onBringForward();
          return;
        }
      }

      // 6. Viewport Zoom & Navigation
      if (isMeta && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        onZoomIn();
        return;
      }
      if (isMeta && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        onZoomOut();
        return;
      }
      if (isMeta && e.key === '0') {
        e.preventDefault();
        onResetZoom();
        return;
      }
      if (e.shiftKey && e.key === '1') {
        e.preventDefault();
        onFitView();
        return;
      }

      // Navigate to Parent board
      if (e.altKey && e.key === 'ArrowUp' && canNavigateUp) {
        e.preventDefault();
        onNavigateParentBoard();
        return;
      }

      // 7. Single-key tool switches (only if no modifiers pressed)
      if (!isMeta && !e.altKey && !e.shiftKey) {
        const key = e.key.toLowerCase();
        switch (key) {
          case 'v':
            onSelectTool('select');
            break;
          case 'h':
            onSelectTool('hand');
            break;
          case 'n':
            onAddElement('note');
            break;
          case 't':
            onAddElement('task');
            break;
          case 'l':
            onAddElement('link');
            break;
          case 'i':
            onAddElement('image');
            break;
          case 'b':
            onAddElement('board');
            break;
          case 'c':
            onAddElement('column');
            break;
          case 'p':
            onAddElement('color');
            break;
          case 's':
            onAddElement('sketch');
            break;
          case 'f':
            onAddElement('file');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onSelectTool,
    onAddElement,
    onSelectAll,
    onDeselectAll,
    onDeleteSelected,
    onDuplicateSelected,
    onCutSelected,
    onNudgeSelected,
    onBringForward,
    onSendBackward,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onFitView,
    onNavigateParentBoard,
    onOpenSearch,
    onOpenExport,
    onOpenHelp,
    onUndo,
    onRedo,
    hasSelection,
    canNavigateUp,
  ]);
}
