import React, { useState } from 'react';
import type { CanvasElement } from '../../types/folioboard';
import { DuotoneIcon } from '../DuotoneIcon';
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Maximize2,
  X,
  ClipboardPaste,
  Copy,
  Check,
  Type,
  Upload,
} from 'lucide-react';

interface ImageElementProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  isSelected: boolean;
}

export const ImageElement: React.FC<ImageElementProps> = ({ element, onUpdate }) => {
  const data = element.data || { url: '', caption: '' };

  const isVideo =
    Boolean(data.isVideo) ||
    Boolean(
      data.url &&
        (data.url.startsWith('data:video/') ||
          /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(data.url))
    );

  // Sanitize generic placeholder filenames (e.g. "image", "image.png", "Web image", "screenshot")
  const isGenericCaption =
    !data.caption ||
    /^(image|web[\s_-]?image|pasted[\s_-]?image|screenshot|video)(\.png|\.jpe?g|\.webp|\.gif|\.avif|\.mp4|\.webm|\.mov)?$/i.test(
      data.caption.trim()
    );
  const effectiveCaption = isGenericCaption ? '' : data.caption;

  const [isEditingUrl, setIsEditingUrl] = useState(!data.url);
  const [tempUrl, setTempUrl] = useState(data.url || '');
  const [showLightbox, setShowLightbox] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCaptionOpen, setIsCaptionOpen] = useState(Boolean(effectiveCaption));

  // Exact-size adaptation: calculate true aspect ratio and dimensions for images
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return;

    if (!data.exactSizeApplied) {
      const MAX_W = 720;
      const MAX_H = 560;
      let w = nw;
      let h = nh;
      if (w > MAX_W || h > MAX_H) {
        const scale = Math.min(MAX_W / w, MAX_H / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      w = Math.max(200, w);
      const hasCaption = Boolean(effectiveCaption);
      const totalH = h + (hasCaption ? 36 : 0);

      onUpdate(element.id, {
        width: w,
        height: totalH,
        data: {
          ...data,
          caption: effectiveCaption,
          exactSizeApplied: true,
          naturalWidth: nw,
          naturalHeight: nh,
        },
      });
    }
  };

  // Exact-size adaptation for videos
  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const nw = video.videoWidth;
    const nh = video.videoHeight;
    if (!nw || !nh) return;

    if (!data.exactSizeApplied) {
      const MAX_W = 720;
      const MAX_H = 540;
      let w = nw;
      let h = nh;
      if (w > MAX_W || h > MAX_H) {
        const scale = Math.min(MAX_W / w, MAX_H / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      w = Math.max(260, w);
      const hasCaption = Boolean(effectiveCaption);
      const totalH = h + (hasCaption ? 36 : 0);

      onUpdate(element.id, {
        width: w,
        height: totalH,
        data: {
          ...data,
          caption: effectiveCaption,
          exactSizeApplied: true,
          naturalWidth: nw,
          naturalHeight: nh,
          isVideo: true,
        },
      });
    }
  };

  const handleSaveUrl = () => {
    if (tempUrl.trim()) {
      const isVid =
        tempUrl.startsWith('data:video/') ||
        /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(tempUrl.trim());

      onUpdate(element.id, {
        data: {
          ...data,
          url: tempUrl.trim(),
          caption: '',
          exactSizeApplied: false,
          isVideo: isVid,
        },
      });
      setIsEditingUrl(false);
    }
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid =
      file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onUpdate(element.id, {
        data: {
          ...data,
          url: dataUrl,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          isVideo: isVid,
          exactSizeApplied: false,
        },
      });
      setIsEditingUrl(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCaption = e.target.value;
    onUpdate(element.id, {
      data: { ...data, caption: newCaption },
    });
  };

  const toggleCaption = () => {
    if (isCaptionOpen && !effectiveCaption) {
      setIsCaptionOpen(false);
    } else if (!isCaptionOpen) {
      setIsCaptionOpen(true);
      if (!effectiveCaption && element.height) {
        onUpdate(element.id, {
          height: element.height + 36,
        });
      }
    } else {
      setIsCaptionOpen(!isCaptionOpen);
    }
  };

  const handleCopyImageUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.url) return;
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const reader = new FileReader();
              reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                onUpdate(element.id, {
                  data: { ...data, url: dataUrl, caption: '', isVideo: false, exactSizeApplied: false },
                });
                setIsEditingUrl(false);
              };
              reader.readAsDataURL(blob);
              return;
            }
          }
        }
      }
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const isVid =
          text.startsWith('data:video/') ||
          /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(text.trim());
        setTempUrl(text.trim());
        onUpdate(element.id, {
          data: { ...data, url: text.trim(), caption: '', isVideo: isVid, exactSizeApplied: false },
        });
        setIsEditingUrl(false);
      }
    } catch {
      // Fallback: open in-card URL editor
      setIsEditingUrl(true);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden group select-none">
      {isEditingUrl ? (
        <div className="p-4 flex flex-col items-center justify-center flex-1 bg-neutral-50/70 dark:bg-neutral-800/40 text-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
            <DuotoneIcon icon={ImageIcon} className="w-5 h-5" />
          </div>
          <div className="w-full flex flex-col gap-1.5">
            <input
              type="text"
              value={tempUrl}
              placeholder="Paste image or video URL (https://...)"
              onChange={(e) => setTempUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-lg outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
            />
            <div className="flex gap-1.5">
              <label className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Upload File
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleLocalFileUpload}
                />
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                Paste
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleSaveUrl}
              className="px-3 py-1 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Add Media
            </button>
            {data.url && (
              <button
                onClick={() => setIsEditingUrl(false)}
                className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative flex-1 bg-neutral-100/60 dark:bg-neutral-800/60 overflow-hidden flex items-center justify-center min-h-0 cursor-move">
          {isVideo ? (
            <video
              src={data.url}
              controls
              playsInline
              preload="metadata"
              onLoadedMetadata={handleVideoLoadedMetadata}
              className="w-full h-full object-contain pointer-events-auto bg-black/90"
            />
          ) : (
            <img
              src={data.url}
              alt={effectiveCaption || 'Folioboard visual'}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onLoad={handleImageLoad}
              className={`w-full h-full ${
                data.cropToGrid !== false ? 'object-cover' : 'object-contain'
              } pointer-events-none select-none transition-transform duration-300 group-hover:scale-[1.01]`}
              onError={() => setIsEditingUrl(true)}
            />
          )}

          {/* Action overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-black/60 backdrop-blur-xs rounded-lg p-1 pointer-events-auto z-10">
            <button
              onClick={toggleCaption}
              onMouseDown={(e) => e.stopPropagation()}
              title={isCaptionOpen ? 'Hide caption' : 'Add caption'}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isCaptionOpen
                  ? 'text-blue-400 bg-white/20'
                  : 'text-white/80 hover:text-white hover:bg-white/20'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopyImageUrl}
              onMouseDown={(e) => e.stopPropagation()}
              title="Copy URL"
              className="p-1 text-white/80 hover:text-white rounded-md hover:bg-white/20 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setShowLightbox(true)}
              onMouseDown={(e) => e.stopPropagation()}
              title="Expand media"
              className="p-1 text-white/80 hover:text-white rounded-md hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setTempUrl(data.url);
                setIsEditingUrl(true);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Edit media / upload"
              className="p-1 text-white/80 hover:text-white rounded-md hover:bg-white/20 transition-colors cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Caption row */}
      {(isCaptionOpen || Boolean(effectiveCaption)) && !isEditingUrl && (
        <div className="px-3 py-2 bg-white dark:bg-[#1e2024] border-t border-neutral-100 dark:border-neutral-800 select-text flex items-center gap-1.5">
          <input
            type="text"
            value={effectiveCaption}
            placeholder="Add caption..."
            onChange={handleCaptionChange}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full text-xs text-neutral-600 dark:text-neutral-300 italic outline-none bg-transparent placeholder-neutral-400 dark:placeholder-neutral-500"
          />
          {!effectiveCaption && (
            <button
              onClick={() => setIsCaptionOpen(false)}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded cursor-pointer"
              title="Close caption"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-6 right-6 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          {isVideo ? (
            <video
              src={data.url}
              controls
              autoPlay
              className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={data.url}
              alt={effectiveCaption || 'Preview'}
              draggable={false}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
};
