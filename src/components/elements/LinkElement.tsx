import React, { useState } from 'react';
import type { CanvasElement } from '../../types/milanote';
import { ExternalLink, Globe, Edit2, Check } from 'lucide-react';

interface LinkElementProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  isSelected: boolean;
}

export const LinkElement: React.FC<LinkElementProps> = ({ element, onUpdate }) => {
  const data = element.data || { url: '', title: '', description: '' };
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(data.url || '');
  const [title, setTitle] = useState(data.title || '');
  const [description, setDescription] = useState(data.description || '');

  const handleSave = () => {
    let domain = '';
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      domain = parsed.hostname.replace('www.', '');
    } catch {
      domain = 'web';
    }

    onUpdate(element.id, {
      data: {
        ...data,
        url: url.startsWith('http') ? url : `https://${url}`,
        title: title || domain,
        description,
        domain,
      },
    });
    setIsEditing(false);
  };

  const domain = data.domain || (data.url ? (() => {
    try {
      return new URL(data.url).hostname.replace('www.', '');
    } catch {
      return 'web';
    }
  })() : 'link');

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg p-3.5 border border-neutral-200/80 shadow-xs justify-between group">
      {isEditing ? (
        <div className="flex flex-col gap-2 select-text">
          <input
            type="text"
            value={title}
            placeholder="Link Title"
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs font-semibold px-2 py-1 border border-neutral-200 rounded outline-none"
          />
          <input
            type="text"
            value={url}
            placeholder="URL (https://...)"
            onChange={(e) => setUrl(e.target.value)}
            className="w-full text-xs px-2 py-1 border border-neutral-200 rounded outline-none"
          />
          <textarea
            value={description}
            placeholder="Description / note..."
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full text-xs px-2 py-1 border border-neutral-200 rounded outline-none resize-none"
          />
          <button
            onClick={handleSave}
            className="self-end flex items-center gap-1 px-2.5 py-1 bg-neutral-900 text-white rounded text-xs font-medium"
          >
            <Check className="w-3 h-3" /> Save
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5 select-text">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-600">
                <Globe className="w-2.5 h-2.5" />
                {domain}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 rounded hover:bg-neutral-100"
                  title="Edit link"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                {data.url && (
                  <a
                    href={data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-neutral-400 hover:text-neutral-700 rounded hover:bg-neutral-100"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <h4 className="text-xs font-semibold text-neutral-900 line-clamp-2 mt-1">
              {data.title || data.url || 'Untitled Link'}
            </h4>
            {data.description && (
              <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                {data.description}
              </p>
            )}
          </div>

          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-[10px] text-neutral-400 hover:text-neutral-700 truncate block border-t border-neutral-100 pt-1.5"
            >
              {data.url}
            </a>
          )}
        </>
      )}
    </div>
  );
};
