import React, { useRef } from 'react';
import type { CanvasElement } from '../../types/folioboard';
import { DuotoneIcon } from '../DuotoneIcon';
import { FileText, Download, Upload } from 'lucide-react';

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
    downloadUrl: '',
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(element.id, {
      data: { ...data, fileName: e.target.value },
    });
  };

  const handleDownload = () => {
    if (data.downloadUrl) {
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = data.fileName || 'file';
      a.click();
      return;
    }

    // Generate downloadable preview text if no binary URL
    const blob = new Blob([`Folioboard attachment: ${data.fileName}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.fileName || 'file.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';

      onUpdate(element.id, {
        data: {
          ...data,
          fileName: file.name,
          fileSize: sizeStr,
          fileType: ext,
          downloadUrl: dataUrl,
        },
      });
    };
    reader.readAsDataURL(file);
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
    <div className="group/file flex items-center gap-3 h-full w-full p-3.5 select-text">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        title="Click to replace file"
        className="relative w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex flex-col items-center justify-center shrink-0 shadow-2xs cursor-pointer overflow-hidden group/icon"
      >
        <DuotoneIcon
          icon={FileText}
          className="w-5 h-5 text-red-500 dark:text-red-400 group-hover/icon:opacity-20 transition-opacity"
        />
        <Upload className="w-4 h-4 text-red-600 dark:text-red-300 absolute opacity-0 group-hover/icon:opacity-100 transition-opacity" />
      </div>

      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={data.fileName || ''}
          placeholder="Filename.pdf"
          onChange={handleNameChange}
          className={`font-medium text-xs outline-none bg-transparent w-full truncate ${
            isExplicitPastel
              ? 'text-neutral-900 placeholder-neutral-500'
              : 'text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500'
          }`}
        />
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-[10px] ${
              isExplicitPastel
                ? 'text-neutral-600'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {data.fileSize || '1.2 MB'}
          </span>
          <span
            className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-md ${
              isExplicitPastel
                ? 'bg-black/10 text-neutral-800'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {data.fileType || 'PDF'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload / Replace file"
          className={`p-1.5 rounded-lg opacity-0 group-hover/file:opacity-100 transition-all shrink-0 cursor-pointer ${
            isExplicitPastel
              ? 'text-neutral-700 hover:text-black hover:bg-black/10'
              : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleDownload}
          title="Download file"
          className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
            isExplicitPastel
              ? 'text-neutral-700 hover:text-black hover:bg-black/10'
              : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
