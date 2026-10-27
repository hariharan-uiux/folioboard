import React, { useState } from 'react';
import type { CanvasElement } from '../../types/milanote';
import { Image as ImageIcon, Link as LinkIcon, Maximize2, X } from 'lucide-react';

interface ImageElementProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  isSelected: boolean;
}

export const ImageElement: React.FC<ImageElementProps> = ({ element, onUpdate }) => {
  const data = element.data || { url: '', caption: '' };
  const [isEditingUrl, setIsEditingUrl] = useState(!data.url);
  const [tempUrl, setTempUrl] = useState(data.url || '');
  const [showLightbox, setShowLightbox] = useState(false);

  const handleSaveUrl = () => {
    if (tempUrl.trim()) {
      onUpdate(element.id, {
        data: { ...data, url: tempUrl.trim() },
      });
      setIsEditingUrl(false);
    }
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(element.id, {
      data: { ...data, caption: e.target.value },
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#1e2024] rounded-lg overflow-hidden shadow-xs border border-neutral-200/80 dark:border-neutral-700/80 group">
      {isEditingUrl ? (
        <div className="p-4 flex flex-col items-center justify-center flex-1 bg-neutral-50/70 dark:bg-neutral-800/40 text-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="w-full">
            <input
              type="text"
              value={tempUrl}
              placeholder="Paste image URL (https://...)"
              onChange={(e) => setTempUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-md outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveUrl}
              className="px-3 py-1 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-medium rounded-md transition-colors"
            >
              Add Image
            </button>
            {data.url && (
              <button
                onClick={() => setIsEditingUrl(false)}
                className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative flex-1 bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center min-h-[160px]">
          <img
            src={data.url}
            alt={data.caption || 'Milanote visual'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={() => setIsEditingUrl(true)}
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-black/60 backdrop-blur-xs rounded-md p-1">
            <button
              onClick={() => setShowLightbox(true)}
              title="Expand image"
              className="p-1 text-white/80 hover:text-white rounded hover:bg-white/20 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setTempUrl(data.url);
                setIsEditingUrl(true);
              }}
              title="Edit image URL"
              className="p-1 text-white/80 hover:text-white rounded hover:bg-white/20 transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Caption row */}
      <div className="px-3 py-2 bg-white dark:bg-[#1e2024] border-t border-neutral-100 dark:border-neutral-800 select-text">
        <input
          type="text"
          value={data.caption || ''}
          placeholder="Add caption..."
          onChange={handleCaptionChange}
          className="w-full text-xs text-neutral-600 dark:text-neutral-300 italic outline-none bg-transparent placeholder-neutral-400 dark:placeholder-neutral-500"
        />
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-6 right-6 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={data.url}
            alt={data.caption || 'Preview'}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
