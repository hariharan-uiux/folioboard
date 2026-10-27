import React from 'react';
import type { CanvasElement } from '../../types/milanote';
import { DuotoneIcon } from '../DuotoneIcon';
import { FileText, Download } from 'lucide-react';

interface FileElementProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  isSelected: boolean;
}

export const FileElement: React.FC<FileElementProps> = ({ element, onUpdate }) => {
  const data = element.data || {
    fileName: 'Project-Guidelines.pdf',
    fileSize: '2.4 MB',
    fileType: 'PDF',
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(element.id, {
      data: { ...data, fileName: e.target.value },
    });
  };

  const handleDownload = () => {
    // Generate dummy downloadable text for preview
    const blob = new Blob([`Milanote attachment: ${data.fileName}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.fileName || 'file.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-3 h-full w-full bg-white dark:bg-[#1e2024] rounded-lg p-3.5 border border-neutral-200/90 dark:border-neutral-700/80 shadow-xs select-text">
      <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex flex-col items-center justify-center shrink-0">
        <DuotoneIcon icon={FileText} className="w-5 h-5 text-red-500 dark:text-red-400" />
      </div>

      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={data.fileName || ''}
          placeholder="Filename.pdf"
          onChange={handleNameChange}
          className="font-medium text-xs text-neutral-900 dark:text-white outline-none bg-transparent w-full truncate"
        />
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{data.fileSize || '1.2 MB'}</span>
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
            {data.fileType || 'PDF'}
          </span>
        </div>
      </div>

      <button
        onClick={handleDownload}
        title="Download file"
        className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};
