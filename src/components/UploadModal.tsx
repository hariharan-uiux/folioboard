import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Film,
  Paperclip,
  Link as LinkIcon,
  ClipboardPaste,
  Loader2,
} from 'lucide-react';

export interface UploadMediaItem {
  url: string;
  caption?: string;
  isVideo?: boolean;
  width?: number;
  height?: number;
}

export interface UploadFileItem {
  fileName: string;
  fileSize: string;
  fileType: string;
  downloadUrl?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'media' | 'file';
  onUploadMedia: (items: UploadMediaItem[]) => void;
  onUploadFiles: (files: UploadFileItem[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'media',
  onUploadMedia,
  onUploadFiles,
}) => {
  const [activeTab, setActiveTab] = useState<'media' | 'file'>(defaultTab);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getExtension = (name: string): string => {
    const ext = name.split('.').pop();
    return ext ? ext.toUpperCase() : 'FILE';
  };

  const isVideoFile = (file: File): boolean => {
    return (
      file.type.startsWith('video/') ||
      /\.(mp4|webm|mov|ogg)$/i.test(file.name)
    );
  };

  const isVideoUrl = (url: string): boolean => {
    return (
      url.startsWith('data:video/') ||
      /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url)
    );
  };

  // Process Media Files (Images & Videos)
  const processMediaFiles = async (files: File[]) => {
    setIsProcessing(true);
    setErrorMsg(null);

    const items: UploadMediaItem[] = [];

    for (const file of files) {
      const isVideo = isVideoFile(file);
      const isImg = file.type.startsWith('image/');

      if (!isImg && !isVideo) {
        continue;
      }

      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;

          if (isVideo) {
            // Measure video dimension
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
              let w = video.videoWidth || 400;
              let h = video.videoHeight || 260;
              const maxDim = 540;
              if (w > maxDim || h > maxDim) {
                const scale = Math.min(maxDim / w, maxDim / h);
                w = Math.round(w * scale);
                h = Math.round(h * scale);
              }
              items.push({
                url: dataUrl,
                caption: file.name.replace(/\.[^/.]+$/, ''),
                isVideo: true,
                width: Math.max(260, w),
                height: Math.max(180, h),
              });
              resolve();
            };
            video.onerror = () => {
              items.push({
                url: dataUrl,
                caption: file.name.replace(/\.[^/.]+$/, ''),
                isVideo: true,
                width: 380,
                height: 250,
              });
              resolve();
            };
            video.src = dataUrl;
          } else {
            // Measure image dimension
            const img = new Image();
            img.onload = () => {
              let w = img.naturalWidth || 340;
              let h = img.naturalHeight || 340;
              const maxDim = 600;
              if (w > maxDim || h > maxDim) {
                const scale = Math.min(maxDim / w, maxDim / h);
                w = Math.round(w * scale);
                h = Math.round(h * scale);
              }
              items.push({
                url: dataUrl,
                caption: file.name.replace(/\.[^/.]+$/, ''),
                isVideo: false,
                width: Math.max(220, w),
                height: Math.max(220, h),
              });
              resolve();
            };
            img.onerror = () => {
              items.push({
                url: dataUrl,
                caption: file.name.replace(/\.[^/.]+$/, ''),
                isVideo: false,
                width: 320,
                height: 320,
              });
              resolve();
            };
            img.src = dataUrl;
          }
        };
        reader.readAsDataURL(file);
      });
    }

    setIsProcessing(false);

    if (items.length > 0) {
      onUploadMedia(items);
      onClose();
    } else {
      setErrorMsg('No valid image or video files detected.');
    }
  };

  // Process Document & File Attachments
  const processGeneralFiles = async (files: File[]) => {
    setIsProcessing(true);
    setErrorMsg(null);

    const uploadedList: UploadFileItem[] = [];

    for (const file of files) {
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          uploadedList.push({
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            fileType: getExtension(file.name),
            downloadUrl: dataUrl,
          });
          resolve();
        };
        reader.onerror = () => resolve();
        reader.readAsDataURL(file);
      });
    }

    setIsProcessing(false);

    if (uploadedList.length > 0) {
      onUploadFiles(uploadedList);
      onClose();
    } else {
      setErrorMsg('Could not process the selected files.');
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    if (activeTab === 'media') {
      processMediaFiles(fileArray);
    } else {
      processGeneralFiles(fileArray);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUrlSubmit = () => {
    const clean = urlInput.trim();
    if (!clean) return;

    if (activeTab === 'media') {
      const isVideo = isVideoUrl(clean);
      onUploadMedia([
        {
          url: clean,
          caption: '',
          isVideo,
          width: isVideo ? 380 : 340,
          height: isVideo ? 260 : 340,
        },
      ]);
    } else {
      const parts = clean.split('/');
      const last = parts[parts.length - 1] || 'Document';
      onUploadFiles([
        {
          fileName: last.split('?')[0] || 'Web-Document',
          fileSize: 'Web Link',
          fileType: getExtension(last),
          downloadUrl: clean,
        },
      ]);
    }

    onClose();
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const file = new File([blob], 'Pasted-Image.png', { type });
              processMediaFiles([file]);
              return;
            }
          }
        }
      }

      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrlInput(text.trim());
      }
    } catch {
      setErrorMsg('Could not access clipboard. Please paste the URL directly.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg min-h-[440px] bg-white dark:bg-[#18191c] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <UploadCloud className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-neutral-900 dark:text-white leading-tight">
                Upload to Canvas
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 h-4 truncate">
                {activeTab === 'media'
                  ? 'Add photos, graphics or videos to your board'
                  : 'Attach documents, PDFs, data sheets or archives'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-1">
          <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('media');
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                <Film className="w-3 h-3 text-neutral-400 dark:text-neutral-300" />
              </div>
              <span>Images & Videos</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('file');
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Documents & Files</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 flex flex-col gap-4 flex-1 justify-between">
          {errorMsg && (
            <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Primary Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative h-[184px] flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 scale-[1.01]'
                : 'border-neutral-200 dark:border-neutral-700/80 hover:border-neutral-400 dark:hover:border-neutral-500 bg-neutral-50/60 dark:bg-neutral-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={
                activeTab === 'media'
                  ? 'image/*,video/mp4,video/webm,video/quicktime,video/ogg'
                  : '*/*'
              }
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            {isProcessing ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Processing files...
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-105 transition-transform">
                  {activeTab === 'media' ? (
                    <ImageIcon className="w-6 h-6" />
                  ) : (
                    <Paperclip className="w-6 h-6" />
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    Drop your {activeTab === 'media' ? 'images or videos' : 'files'} here, or{' '}
                    <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-500/40 underline-offset-2">
                      browse
                    </span>
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 h-5 flex items-center justify-center truncate">
                    {activeTab === 'media'
                      ? 'Supports PNG, JPG, WebP, GIF, SVG, MP4, WebM'
                      : 'Supports PDF, Word, Excel, ZIP, Code & documents'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Import from URL / Clipboard */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Or import from URL
              </span>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                Paste from clipboard
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  placeholder={
                    activeTab === 'media'
                      ? 'Paste image or video URL (https://...)'
                      : 'Paste file or document URL (https://...)'
                  }
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <button
                type="button"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed text-white dark:text-neutral-900 text-xs font-medium rounded-xl transition-all shrink-0 cursor-pointer"
              >
                Add to Canvas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
