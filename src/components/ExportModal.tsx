import React, { useState } from 'react';
import type { CanvasState } from '../types/folioboard';
import { exportBoardAsJSON, exportBoardAsMarkdown } from '../utils/storage';
import { X, Download, FileJson, FileText, Copy, Check, Upload, Printer } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: CanvasState;
  onImportState: (newState: CanvasState) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  state,
  onImportState,
}) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentBoard = state.boards[state.currentBoardId] || { title: 'Board' };
  const mdContent = exportBoardAsMarkdown(state, state.currentBoardId);
  const jsonContent = exportBoardAsJSON(state, state.currentBoardId);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(mdContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBoard.title.replace(/\s+/g, '-').toLowerCase()}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBoard.title.replace(/\s+/g, '-').toLowerCase()}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.board && parsed.elements) {
          const newBoards = { ...state.boards, [parsed.board.id]: parsed.board };
          const newElements = { ...state.elements, ...parsed.elements };
          const newConnections = { ...state.connections, ...(parsed.connections || {}) };

          onImportState({
            ...state,
            currentBoardId: parsed.board.id,
            boards: newBoards,
            elements: newElements,
            connections: newConnections,
          });
          onClose();
        }
      } catch (err) {
        setImportError('Invalid JSON board file. Please choose a valid board export.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#18191c] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="font-semibold text-base text-neutral-900 dark:text-white">Export & Share Board</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Download notes, export backup JSON, or copy formatted Markdown.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('markdown')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'markdown'
                  ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <FileText className="w-4 h-4" /> Markdown Document
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'json'
                  ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <FileJson className="w-4 h-4" /> Full JSON Backup
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 pb-2"
          >
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'markdown' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Preview</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .md
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl text-xs font-mono text-neutral-700 dark:text-neutral-300 overflow-x-auto whitespace-pre-wrap max-h-72 border border-neutral-200 dark:border-neutral-800">
                {mdContent}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {importError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center justify-between text-xs text-red-700 dark:text-red-300">
                  <span>{importError}</span>
                  <button
                    onClick={() => setImportError(null)}
                    className="p-1 hover:text-red-900 dark:hover:text-red-100 rounded-lg cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300">Import Board from JSON</h4>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                    Restore a previously exported Folioboard canvas file.
                  </p>
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" /> Upload JSON
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">JSON Payload</span>
                <button
                  onClick={handleDownloadJSON}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200"
                >
                  <Download className="w-3.5 h-3.5" /> Download .json
                </button>
              </div>

              <pre className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl text-xs font-mono text-neutral-700 dark:text-neutral-300 overflow-x-auto whitespace-pre-wrap max-h-56 border border-neutral-200 dark:border-neutral-800">
                {jsonContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
