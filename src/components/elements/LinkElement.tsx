import React, { useState, useEffect } from 'react';
import type { CanvasElement } from '../../types/folioboard';
import { DuotoneIcon } from '../DuotoneIcon';
import { ExternalLink, Globe, Edit2, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { parseUrlMetadata, fetchOpenGraphData } from '../../utils/urlHelper';

interface LinkElementProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  isSelected: boolean;
}

export const LinkElement: React.FC<LinkElementProps> = ({ element, onUpdate }) => {
  const data = element.data || { url: '', title: '', description: '', domain: '', favicon: '', image: '' };
  const [isEditing, setIsEditing] = useState(!data.url);
  const [inputUrl, setInputUrl] = useState(data.url || '');
  const [faviconError, setFaviconError] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  // Auto-fetch OpenGraph image if URL exists but no image yet
  useEffect(() => {
    let active = true;
    if (data.url && !data.image && !isEditing) {
      fetchOpenGraphData(data.url).then((og) => {
        if (!active || !og) return;
        if (og.image || og.title || og.description) {
          onUpdate(element.id, {
            data: {
              ...data,
              image: og.image || data.image,
              title: og.title || data.title,
              description: og.description || data.description,
              favicon: og.favicon || data.favicon,
            },
            height: og.image ? Math.max(element.height, 240) : element.height,
            updatedAt: Date.now(),
          });
        }
      });
    }
    return () => {
      active = false;
    };
  }, [data.url, data.image]);

  const handleConvert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;

    // 1. Immediate synchronous parse
    const meta = parseUrlMetadata(inputUrl);
    setFaviconError(false);
    setImageError(false);

    const initialHeight = meta.image ? Math.max(element.height, 240) : Math.max(element.height, 160);

    onUpdate(element.id, {
      data: {
        ...data,
        url: meta.url,
        title: meta.title,
        description: meta.description,
        domain: meta.domain,
        favicon: meta.favicon,
        image: meta.image || '',
      },
      height: initialHeight,
      updatedAt: Date.now(),
    });
    setIsEditing(false);

    // 2. Asynchronous OpenGraph metadata enrichment
    try {
      const og = await fetchOpenGraphData(meta.url);
      if (og && (og.image || og.title || og.description)) {
        onUpdate(element.id, {
          data: {
            ...data,
            url: meta.url,
            title: og.title || meta.title,
            description: og.description || meta.description,
            domain: meta.domain,
            favicon: og.favicon || meta.favicon,
            image: og.image || meta.image,
          },
          height: (og.image || meta.image) ? Math.max(element.height, 240) : initialHeight,
          updatedAt: Date.now(),
        });
      }
    } catch {}
  };

  const domain =
    data.domain ||
    (data.url
      ? (() => {
          try {
            return new URL(data.url).hostname.replace(/^www\./, '');
          } catch {
            return 'web';
          }
        })()
      : 'link');

  const faviconSrc =
    data.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  const hasImage = Boolean(data.image && !imageError);

  return (
    <div className="flex flex-col h-full w-full justify-between select-text group overflow-hidden">
      {isEditing || !data.url ? (
        /* Empty / Input State: Enter URL to convert to preview */
        <div
          className="flex flex-col h-full w-full p-4 justify-between bg-neutral-50/70 dark:bg-neutral-800/40"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-800/50">
              <DuotoneIcon icon={LinkIcon} className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 leading-tight">
                Web Bookmark
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-tight">
                Enter URL to generate live preview with OpenGraph image
              </span>
            </div>
          </div>

          <form onSubmit={handleConvert} className="flex flex-col gap-2 mt-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputUrl}
                autoFocus
                placeholder="Paste link (e.g. github.com, youtube.com, figma.com)..."
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConvert();
                  }
                }}
                className="w-full px-2.5 py-1.5 pr-8 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder-neutral-400 dark:placeholder-neutral-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => handleConvert()}
                disabled={!inputUrl.trim()}
                className="absolute right-1 p-1 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Generate preview"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text && text.trim()) {
                      setInputUrl(text.trim());
                      const meta = parseUrlMetadata(text.trim());
                      onUpdate(element.id, {
                        data: {
                          ...data,
                          url: meta.url,
                          title: meta.title,
                          description: meta.description,
                          domain: meta.domain,
                          favicon: meta.favicon,
                          image: meta.image || '',
                        },
                        height: meta.image ? Math.max(element.height, 240) : Math.max(element.height, 160),
                        updatedAt: Date.now(),
                      });
                      setIsEditing(false);
                    }
                  } catch {}
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                Paste from clipboard
              </button>

              <button
                type="submit"
                disabled={!inputUrl.trim()}
                className="px-2.5 py-1 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 disabled:pointer-events-none text-white dark:text-neutral-900 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Convert to Preview
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Rich Preview State with OpenGraph Banner */
        <div className="flex flex-col h-full w-full overflow-hidden justify-between">
          <div>
            {/* OpenGraph Image Banner */}
            {hasImage && (
              <div className="w-full h-28 bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative shrink-0 border-b border-neutral-100 dark:border-neutral-800">
                <img
                  src={data.image}
                  alt=""
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}

            {/* Bookmark Content Body */}
            <div className="p-3 flex flex-col gap-1.5">
              {/* Top row: Favicon + Domain pill + Actions */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                    isExplicitPastel
                      ? 'bg-black/10 text-neutral-800'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {!faviconError ? (
                    <img
                      src={faviconSrc}
                      alt=""
                      onError={() => setFaviconError(true)}
                      className="w-3 h-3 rounded-xs shrink-0"
                    />
                  ) : (
                    <DuotoneIcon icon={Globe} className="w-3 h-3" />
                  )}
                  <span className="truncate max-w-[150px]">{domain}</span>
                </span>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setInputUrl(data.url || '');
                      setIsEditing(true);
                    }}
                    className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Edit or change link"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {data.url && (
                    <a
                      href={data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Title */}
              <h4
                className={`text-xs font-semibold line-clamp-2 mt-0.5 leading-snug ${
                  isExplicitPastel
                    ? 'text-neutral-900'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {data.title || data.url}
              </h4>

              {/* Description */}
              {data.description && (
                <p
                  className={`text-[11px] line-clamp-2 leading-relaxed ${
                    isExplicitPastel
                      ? 'text-neutral-700'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {data.description}
                </p>
              )}
            </div>
          </div>

          {/* Bottom URL row */}
          {data.url && (
            <div className="px-3 pb-2.5">
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`text-[10px] truncate block border-t pt-1.5 transition-colors ${
                  isExplicitPastel
                    ? 'text-neutral-600 hover:text-black border-black/10'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 border-neutral-100 dark:border-neutral-800'
                }`}
              >
                {data.url}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
