import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  CanvasState,
  CanvasElement,
  ElementType,
  AnchorPosition,
  Connection,
  Board,
} from './types/folioboard';
import { getInitialState, saveStateToStorage } from './utils/storage';
import { TEMPLATES } from './utils/templates';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Canvas } from './components/Canvas';
import { SearchModal } from './components/SearchModal';
import { ExportModal } from './components/ExportModal';
import { TemplateModal } from './components/TemplateModal';
import { HelpModal } from './components/HelpModal';
import { UploadModal, type UploadMediaItem, type UploadFileItem } from './components/UploadModal';
import { AppDialog, type DialogOptions } from './components/AppDialog';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { isWebUrl, parseUrlMetadata } from './utils/urlHelper';

export function App() {
  const [state, setState] = useState<CanvasState>(getInitialState);
  const [activeTool, setActiveTool] = useState<'select' | 'hand'>('select');

  // Lightweight Undo / Redo history
  const [history, setHistory] = useState<
    { elements: Record<string, CanvasElement>; connections: Record<string, Connection> }[]
  >([]);
  const [future, setFuture] = useState<
    { elements: Record<string, CanvasElement>; connections: Record<string, Connection> }[]
  >([]);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadDefaultTab, setUploadDefaultTab] = useState<'media' | 'file'>('media');
  const [dialogOptions, setDialogOptions] = useState<DialogOptions | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const showAppDialog = (opts: DialogOptions) => {
    setDialogOptions(opts);
    setIsDialogOpen(true);
  };

  // Active line connection dragging state
  const [connectingSource, setConnectingSource] = useState<{
    fromId: string;
    fromAnchor: AnchorPosition;
  } | null>(null);

  // Auto-save state to localStorage
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Sync dark theme class to document root
  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  // Global wheel handler: prevent browser native zoom on Ctrl+wheel anywhere
  // The actual zoom logic (with mouse-position centering) remains in Canvas.handleWheel
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, []);

  // Breadcrumbs calculation
  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string; title: string }[] = [];
    let currentId: string | null = state.currentBoardId;

    while (currentId) {
      const b: Board | undefined = state.boards[currentId];
      if (b) {
        crumbs.unshift({ id: b.id, title: b.title || 'Untitled Board' });
        currentId = b.parentId;
      } else {
        break;
      }
    }

    if (crumbs.length === 0) {
      crumbs.push({ id: 'root', title: 'Main Board' });
    }
    return crumbs;
  }, [state.currentBoardId, state.boards]);

  const currentBoard = state.boards[state.currentBoardId] || {
    id: state.currentBoardId,
    parentId: null,
    title: 'Main Board',
    createdAt: Date.now(),
  };

  // Navigate to another board
  const handleNavigateBoard = (targetBoardId: string) => {
    // If the board doesn't exist yet, create it
    if (!state.boards[targetBoardId]) {
      setState((prev) => ({
        ...prev,
        boards: {
          ...prev.boards,
          [targetBoardId]: {
            id: targetBoardId,
            parentId: prev.currentBoardId,
            title: 'Sub-board',
            createdAt: Date.now(),
          },
        },
        currentBoardId: targetBoardId,
        selectedElementIds: [],
        pan: { x: 60, y: 60 },
        zoom: 1,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        currentBoardId: targetBoardId,
        selectedElementIds: [],
        pan: { x: 60, y: 60 },
        zoom: 1,
      }));
    }
  };

  // Board title update
  const handleUpdateBoardTitle = (title: string) => {
    setState((prev) => ({
      ...prev,
      boards: {
        ...prev.boards,
        [prev.currentBoardId]: {
          ...(prev.boards[prev.currentBoardId] || {
            id: prev.currentBoardId,
            parentId: null,
            createdAt: Date.now(),
          }),
          title,
        },
      },
    }));
  };

  // Element updates
  const handleUpdateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      setState((prev) => {
        const el = prev.elements[id];
        if (!el) return prev;
        return {
          ...prev,
          elements: {
            ...prev.elements,
            [id]: {
              ...el,
              ...updates,
              updatedAt: Date.now(),
            },
          },
        };
      });
    },
    []
  );

  // Element factory
  const createElementPayload = (
    type: ElementType,
    x: number,
    y: number,
    customData?: any
  ): CanvasElement => {
    const id = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    let width = 280;
    let height = 180;
    let color = '#ffffff';
    let data: any = {};

    switch (type) {
      case 'note':
        width = 300;
        height = 190;
        color = '#ffffff';
        data = {
          title: '',
          content: '',
          fontSize: 'md',
          fontFamily: 'sans',
        };
        break;
      case 'image':
        width = 320;
        height = 340;
        color = '#ffffff';
        data = {
          url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
          caption: 'Visual inspiration',
        };
        break;
      case 'link':
        width = 320;
        height = 150;
        color = '#ffffff';
        data = {
          url: '',
          title: '',
          description: '',
          domain: '',
          favicon: '',
        };
        break;
      case 'task':
        width = 300;
        height = 240;
        color = '#ffffff';
        data = {
          title: 'Action Items',
          items: [
            { id: '1', text: 'Define project scope', completed: true },
            { id: '2', text: 'Gather reference material', completed: false },
          ],
        };
        break;
      case 'board':
        width = 320;
        height = 164;
        color = '#ffffff';
        const newBoardId = `board_${Date.now()}`;
        data = {
          title: 'New Sub-board',
          description: 'Nested workspace for sub-topics and ideas',
          targetBoardId: newBoardId,
        };
        // Register the new board
        setState((prev) => ({
          ...prev,
          boards: {
            ...prev.boards,
            [newBoardId]: {
              id: newBoardId,
              parentId: prev.currentBoardId,
              title: 'New Sub-board',
              createdAt: Date.now(),
            },
          },
        }));
        break;
      case 'column':
        width = 280;
        height = 360;
        color = '#f1f5f9';
        data = { title: 'Column Stack' };
        break;
      case 'color':
        width = 180;
        height = 145;
        color = '#ffffff';
        data = {
          hex: '#e29578',
          name: 'Terracotta',
          category: 'Accent',
        };
        break;
      case 'sketch':
        width = 300;
        height = 240;
        color = '#ffffff';
        data = { strokes: [] };
        break;
      case 'file':
        width = 300;
        height = 86;
        color = '#ffffff';
        data = {
          fileName: 'Design-System-Spec.pdf',
          fileSize: '3.1 MB',
          fileType: 'PDF',
        };
        break;
    }

    return {
      id,
      boardId: state.currentBoardId,
      type,
      x,
      y,
      width,
      height,
      zIndex: Object.keys(state.elements).length + 1,
      color,
      data: customData ? { ...data, ...customData } : data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  // Add element from sidebar click (places in center of visible viewport)
  const handleAddElementFromSidebar = (type: ElementType) => {
    const x = Math.round((-state.pan.x + window.innerWidth / 2 - 140) / state.zoom);
    const y = Math.round((-state.pan.y + window.innerHeight / 2 - 100) / state.zoom);
    const newEl = createElementPayload(type, x, y);

    setState((prev) => ({
      ...prev,
      elements: {
        ...prev.elements,
        [newEl.id]: newEl,
      },
      selectedElementIds: [newEl.id],
    }));
  };

  // Add element at exact coordinates (from drag-and-drop onto canvas)
  const handleAddElementAtCoords = (
    type: ElementType,
    x: number,
    y: number,
    customData?: any,
    customW?: number,
    customH?: number
  ) => {
    const newEl = createElementPayload(type, x, y, customData);
    if (customW) newEl.width = customW;
    if (customH) newEl.height = customH;

    setState((prev) => ({
      ...prev,
      elements: {
        ...prev.elements,
        [newEl.id]: newEl,
      },
      selectedElementIds: [newEl.id],
    }));
  };

  // Add custom image element (from clipboard paste or OS file drop)
  const handleAddImageWithData = useCallback(
    (
      dataUrl: string,
      x?: number,
      y?: number,
      name?: string,
      customW?: number,
      customH?: number
    ) => {
      const initialW = customW || 320;
      const initialH = customH || 340;
      const posX =
        x !== undefined
          ? x
          : Math.round((-state.pan.x + window.innerWidth / 2 - initialW / 2) / state.zoom);
      const posY =
        y !== undefined
          ? y
          : Math.round((-state.pan.y + window.innerHeight / 2 - initialH / 2) / state.zoom);

      const isGeneric =
        !name ||
        /^(image|screenshot|pasted[\s_-]?image|web[\s_-]?image)(\.\w+)?$/i.test(name.trim());
      const captionVal = isGeneric ? '' : name.replace(/\.[^/.]+$/, '').trim();

      const id = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newImgEl: CanvasElement = {
        id,
        boardId: state.currentBoardId,
        type: 'image',
        x: posX,
        y: posY,
        width: initialW,
        height: initialH,
        zIndex: Object.keys(state.elements).length + 1,
        color: '#ffffff',
        data: {
          url: dataUrl,
          caption: captionVal,
          exactSizeApplied: !!(customW && customH),
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        elements: {
          ...prev.elements,
          [id]: newImgEl,
        },
        selectedElementIds: [id],
      }));
    },
    [state.pan, state.zoom, state.currentBoardId, state.elements]
  );

  // Open upload modal with specified tab ('media' for images & videos, 'file' for documents)
  const handleOpenUpload = useCallback((tab: 'media' | 'file' = 'media') => {
    setUploadDefaultTab(tab);
    setIsUploadOpen(true);
  }, []);

  // Upload one or multiple media items (images or videos)
  const handleUploadMedia = useCallback(
    (items: UploadMediaItem[]) => {
      if (items.length === 0) return;

      const baseCenterX = Math.round((-state.pan.x + window.innerWidth / 2 - 160) / state.zoom);
      const baseCenterY = Math.round((-state.pan.y + window.innerHeight / 2 - 140) / state.zoom);

      const newElements: Record<string, CanvasElement> = {};
      const newSelectedIds: string[] = [];

      items.forEach((item, index) => {
        const id = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const w = item.width || (item.isVideo ? 380 : 320);
        const h = item.height || (item.isVideo ? 260 : 320);

        const col = index % 3;
        const row = Math.floor(index / 3);
        const posX = baseCenterX + col * (w + 24);
        const posY = baseCenterY + row * (h + 24);

        const isGeneric =
          !item.caption ||
          /^(image|video|screenshot|pasted[\s_-]?image|web[\s_-]?image)(\.\w+)?$/i.test(
            item.caption.trim()
          );
        const captionVal = isGeneric ? '' : item.caption?.replace(/\.[^/.]+$/, '').trim() || '';

        const newEl: CanvasElement = {
          id,
          boardId: state.currentBoardId,
          type: 'image',
          x: posX,
          y: posY,
          width: w,
          height: h,
          zIndex: Object.keys(state.elements).length + index + 1,
          color: '#ffffff',
          data: {
            url: item.url,
            caption: captionVal,
            isVideo: Boolean(item.isVideo),
            exactSizeApplied: Boolean(item.width && item.height),
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        newElements[id] = newEl;
        newSelectedIds.push(id);
      });

      setState((prev) => ({
        ...prev,
        elements: {
          ...prev.elements,
          ...newElements,
        },
        selectedElementIds: newSelectedIds,
      }));
    },
    [state.pan, state.zoom, state.currentBoardId, state.elements]
  );

  // Upload one or multiple document/file items
  const handleUploadFiles = useCallback(
    (files: UploadFileItem[]) => {
      if (files.length === 0) return;

      const baseCenterX = Math.round((-state.pan.x + window.innerWidth / 2 - 150) / state.zoom);
      const baseCenterY = Math.round((-state.pan.y + window.innerHeight / 2 - 45) / state.zoom);

      const newElements: Record<string, CanvasElement> = {};
      const newSelectedIds: string[] = [];

      files.forEach((file, index) => {
        const id = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const w = 300;
        const h = 86;
        const posX = baseCenterX + (index % 2) * (w + 20);
        const posY = baseCenterY + Math.floor(index / 2) * (h + 16);

        const newEl: CanvasElement = {
          id,
          boardId: state.currentBoardId,
          type: 'file',
          x: posX,
          y: posY,
          width: w,
          height: h,
          zIndex: Object.keys(state.elements).length + index + 1,
          color: '#ffffff',
          data: {
            fileName: file.fileName,
            fileSize: file.fileSize,
            fileType: file.fileType,
            downloadUrl: file.downloadUrl || '',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        newElements[id] = newEl;
        newSelectedIds.push(id);
      });

      setState((prev) => ({
        ...prev,
        elements: {
          ...prev.elements,
          ...newElements,
        },
        selectedElementIds: newSelectedIds,
      }));
    },
    [state.pan, state.zoom, state.currentBoardId, state.elements]
  );

  // Global Clipboard Paste: supports image files, screenshots, image URLs, and copied elements
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // 1. Check for Image files (e.g. screenshots, copied image files)
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const img = new Image();
            img.onload = () => {
              const MAX_W = 720;
              const MAX_H = 560;
              let w = img.naturalWidth;
              let h = img.naturalHeight;
              if (w > MAX_W || h > MAX_H) {
                const scale = Math.min(MAX_W / w, MAX_H / h);
                w = Math.round(w * scale);
                h = Math.round(h * scale);
              }
              w = Math.max(200, w);
              handleAddImageWithData(dataUrl, undefined, undefined, '', w, h);
            };
            img.onerror = () => {
              handleAddImageWithData(dataUrl, undefined, undefined, '');
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
          return;
        }
      }

      // If typing in an input, don't intercept text pastes
      if (isInput) return;

      // 2. Check for Text / URL clipboard
      const text = e.clipboardData?.getData('text/plain')?.trim();
      if (text) {
        // If image URL
        const isImageUrl =
          /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(text) ||
          /(images\.unsplash\.com|i\.imgur\.com|media\.giphy\.com)/i.test(text);

        if (isImageUrl) {
          e.preventDefault();
          const img = new Image();
          img.onload = () => {
            const MAX_W = 720;
            const MAX_H = 560;
            let w = img.naturalWidth;
            let h = img.naturalHeight;
            if (w > MAX_W || h > MAX_H) {
              const scale = Math.min(MAX_W / w, MAX_H / h);
              w = Math.round(w * scale);
              h = Math.round(h * scale);
            }
            w = Math.max(200, w);
            handleAddImageWithData(text, undefined, undefined, '', w, h);
          };
          img.onerror = () => {
            handleAddImageWithData(text, undefined, undefined, '');
          };
          img.src = text;
          return;
        }

        // Check if user copied canvas cards JSON (internal copy paste)
        try {
          const parsed = JSON.parse(text);
          if (
            parsed &&
            parsed.__folioboard_copy__ &&
            Array.isArray(parsed.elements)
          ) {
            e.preventDefault();
            const newElements: Record<string, CanvasElement> = {};
            const newSelectedIds: string[] = [];

            parsed.elements.forEach((orig: CanvasElement, idx: number) => {
              const newId = `el_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`;
              newElements[newId] = {
                ...orig,
                id: newId,
                boardId: state.currentBoardId,
                x: orig.x + 30,
                y: orig.y + 30,
                zIndex: Object.keys(state.elements).length + idx + 1,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              newSelectedIds.push(newId);
            });

            setState((prev) => ({
              ...prev,
              elements: { ...prev.elements, ...newElements },
              selectedElementIds: newSelectedIds,
            }));
            return;
          }
        } catch {}

        // 3. Check if user pasted a Web Link / URL
        if (isWebUrl(text)) {
          e.preventDefault();
          const meta = parseUrlMetadata(text);
          const width = 320;
          const height = meta.image ? 250 : 160;
          const posX = Math.round(
            (-state.pan.x + window.innerWidth / 2 - width / 2) / state.zoom
          );
          const posY = Math.round(
            (-state.pan.y + window.innerHeight / 2 - height / 2) / state.zoom
          );

          const id = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          const newLinkEl: CanvasElement = {
            id,
            boardId: state.currentBoardId,
            type: 'link',
            x: posX,
            y: posY,
            width,
            height,
            zIndex: Object.keys(state.elements).length + 1,
            color: '#ffffff',
            data: {
              url: meta.url,
              title: meta.title,
              description: meta.description,
              domain: meta.domain,
              favicon: meta.favicon,
              image: meta.image || '',
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          setState((prev) => ({
            ...prev,
            elements: { ...prev.elements, [id]: newLinkEl },
            selectedElementIds: [id],
          }));
          return;
        }

        // 4. Plain text / notes / code pasted
        if (text.length > 0) {
          e.preventDefault();
          const isShort = text.length < 120 && !text.includes('\n');
          const width = isShort
            ? 280
            : Math.min(460, Math.max(300, Math.round(Math.sqrt(text.length * 160))));
          const height = isShort
            ? 160
            : Math.min(420, Math.max(180, Math.round(text.length * 0.75)));
          const posX = Math.round(
            (-state.pan.x + window.innerWidth / 2 - width / 2) / state.zoom
          );
          const posY = Math.round(
            (-state.pan.y + window.innerHeight / 2 - height / 2) / state.zoom
          );

          const id = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          const newNoteEl: CanvasElement = {
            id,
            boardId: state.currentBoardId,
            type: 'note',
            x: posX,
            y: posY,
            width,
            height,
            zIndex: Object.keys(state.elements).length + 1,
            color: '#ffffff',
            data: {
              title: '',
              content: text,
              fontSize: 'md',
              fontFamily: 'sans',
              textAlign: 'left',
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          setState((prev) => ({
            ...prev,
            elements: { ...prev.elements, [id]: newNoteEl },
            selectedElementIds: [id],
          }));
          return;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleAddImageWithData, state.currentBoardId, state.elements, state.pan, state.zoom]);

  // Global Clipboard Copy: Ctrl+C / Cmd+C copies selected elements
  useEffect(() => {
    const handleCopy = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && state.selectedElementIds.length > 0) {
        const selected = state.selectedElementIds
          .map((id) => state.elements[id])
          .filter(Boolean);

        if (selected.length > 0) {
          const payload = JSON.stringify({
            __folioboard_copy__: true,
            elements: selected,
          });
          navigator.clipboard.writeText(payload);
        }
      }
    };

    window.addEventListener('keydown', handleCopy);
    return () => window.removeEventListener('keydown', handleCopy);
  }, [state.selectedElementIds, state.elements]);

  // Delete element
  const handleDeleteElement = useCallback((id: string) => {
    setState((prev) => {
      const { [id]: _, ...remainingElements } = prev.elements;
      // Also delete any connections attached to this element
      const remainingConnections: Record<string, Connection> = {};
      Object.values(prev.connections).forEach((conn) => {
        if (conn.fromId !== id && conn.toId !== id) {
          remainingConnections[conn.id] = conn;
        }
      });

      return {
        ...prev,
        elements: remainingElements,
        connections: remainingConnections,
        selectedElementIds: prev.selectedElementIds.filter((elId) => elId !== id),
      };
    });
  }, []);

  // Delete selected elements atomically
  const handleDeleteSelected = useCallback(() => {
    setState((prev) => {
      if (prev.selectedElementIds.length === 0) return prev;
      const idsToDelete = new Set(prev.selectedElementIds);
      const remainingElements: Record<string, CanvasElement> = {};
      Object.values(prev.elements).forEach((el) => {
        if (!idsToDelete.has(el.id)) {
          remainingElements[el.id] = el;
        }
      });

      const remainingConnections: Record<string, Connection> = {};
      Object.values(prev.connections).forEach((conn) => {
        if (!idsToDelete.has(conn.fromId) && !idsToDelete.has(conn.toId)) {
          remainingConnections[conn.id] = conn;
        }
      });

      return {
        ...prev,
        elements: remainingElements,
        connections: remainingConnections,
        selectedElementIds: [],
      };
    });
  }, []);

  // Duplicate element
  const handleDuplicateElement = useCallback((id: string) => {
    setState((prev) => {
      const original = prev.elements[id];
      if (!original) return prev;

      const newId = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const duplicated: CanvasElement = {
        ...original,
        id: newId,
        x: original.x + 30,
        y: original.y + 30,
        zIndex: Object.keys(prev.elements).length + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return {
        ...prev,
        elements: {
          ...prev.elements,
          [newId]: duplicated,
        },
        selectedElementIds: [newId],
      };
    });
  }, []);

  // Add line connection
  const handleAddConnection = (
    fromId: string,
    toId: string,
    fromAnchor: AnchorPosition,
    toAnchor: AnchorPosition
  ) => {
    const connId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newConn: Connection = {
      id: connId,
      boardId: state.currentBoardId,
      fromId,
      toId,
      fromAnchor,
      toAnchor,
      style: 'curved',
    };

    setState((prev) => ({
      ...prev,
      connections: {
        ...prev.connections,
        [connId]: newConn,
      },
    }));
  };

  // Delete connection
  const handleDeleteConnection = (connId: string) => {
    setState((prev) => {
      const { [connId]: _, ...remaining } = prev.connections;
      return {
        ...prev,
        connections: remaining,
      };
    });
  };

  // Update connection label
  const handleUpdateConnectionLabel = (connId: string, label: string) => {
    setState((prev) => {
      const conn = prev.connections[connId];
      if (!conn) return prev;
      return {
        ...prev,
        connections: {
          ...prev.connections,
          [connId]: { ...conn, label },
        },
      };
    });
  };

  // Reset current board
  const handleResetBoard = () => {
    showAppDialog({
      type: 'danger',
      title: 'Clear Current Board',
      message:
        'Are you sure you want to clear all cards, notes, and connections from this board? This action cannot be undone.',
      confirmLabel: 'Clear All Elements',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        setState((prev) => {
          const remainingElements: Record<string, CanvasElement> = {};
          Object.values(prev.elements).forEach((el) => {
            if (el.boardId !== prev.currentBoardId) {
              remainingElements[el.id] = el;
            }
          });

          const remainingConnections: Record<string, Connection> = {};
          Object.values(prev.connections).forEach((conn) => {
            if (conn.boardId !== prev.currentBoardId) {
              remainingConnections[conn.id] = conn;
            }
          });

          return {
            ...prev,
            elements: remainingElements,
            connections: remainingConnections,
            selectedElementIds: [],
          };
        });
      },
    });
  };

  // Load pre-configured template
  const handleLoadTemplate = (templateKey: string) => {
    const tpl = TEMPLATES[templateKey];
    if (!tpl) return;

    setState((prev) => ({
      ...prev,
      currentBoardId: 'root',
      boards: tpl.boards,
      elements: tpl.elements,
      connections: tpl.connections,
      pan: { x: 50, y: 50 },
      zoom: 1,
      selectedElementIds: [],
    }));
  };


  // Select item from search modal
  const handleSelectFromSearch = (elementId: string, boardId: string) => {
    const el = state.elements[elementId];
    if (!el) return;

    setState((prev) => ({
      ...prev,
      currentBoardId: boardId,
      selectedElementIds: [elementId],
      pan: {
        x: window.innerWidth / 2 - el.x * prev.zoom - (el.width * prev.zoom) / 2,
        y: window.innerHeight / 2 - el.y * prev.zoom - (el.height * prev.zoom) / 2,
      },
    }));
  };

  // ========================================================================
  // Keyboard Shortcut Handlers & Undo/Redo
  // ========================================================================

  // Push current state to history for undo
  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-49), { elements: state.elements, connections: state.connections }]);
    setFuture([]);
  }, [state.elements, state.connections]);

  // Undo
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [{ elements: state.elements, connections: state.connections }, ...f.slice(0, 49)]);
    setHistory((h) => h.slice(0, -1));
    setState((s) => ({ ...s, elements: prev.elements, connections: prev.connections }));
  }, [history, state.elements, state.connections]);

  // Redo
  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h.slice(-49), { elements: state.elements, connections: state.connections }]);
    setFuture((f) => f.slice(1));
    setState((s) => ({ ...s, elements: next.elements, connections: next.connections }));
  }, [future, state.elements, state.connections]);

  // Nudge selected elements
  const handleNudgeSelected = useCallback((dx: number, dy: number) => {
    if (state.selectedElementIds.length === 0) return;
    pushHistory();
    setState((prev) => {
      const newElements = { ...prev.elements };
      state.selectedElementIds.forEach((id) => {
        const el = newElements[id];
        if (el) {
          newElements[id] = {
            ...el,
            x: el.x + dx,
            y: el.y + dy,
            updatedAt: Date.now(),
          };
        }
      });
      return { ...prev, elements: newElements };
    });
  }, [state.selectedElementIds, pushHistory]);

  // Select all elements on current board
  const handleSelectAll = useCallback(() => {
    const allIds = Object.values(state.elements)
      .filter((el) => el.boardId === state.currentBoardId)
      .map((el) => el.id);
    setState((p) => ({ ...p, selectedElementIds: allIds }));
  }, [state.elements, state.currentBoardId]);

  // Deselect all
  const handleDeselectAll = useCallback(() => {
    setState((p) => ({ ...p, selectedElementIds: [] }));
  }, []);

  // Cut selected elements (copy + delete)
  const handleCutSelected = useCallback(() => {
    if (state.selectedElementIds.length === 0) return;
    // Copy to clipboard first
    const selected = state.selectedElementIds
      .map((id) => state.elements[id])
      .filter(Boolean);
    if (selected.length > 0) {
      const payload = JSON.stringify({
        __folioboard_copy__: true,
        elements: selected,
      });
      navigator.clipboard.writeText(payload);
    }
    // Then delete
    handleDeleteSelected();
  }, [state.selectedElementIds, state.elements, handleDeleteSelected]);

  // Bring forward / send backward
  const handleBringForward = useCallback(() => {
    if (state.selectedElementIds.length === 0) return;
    pushHistory();
    setState((prev) => {
      const newElements = { ...prev.elements };
      state.selectedElementIds.forEach((id) => {
        const el = newElements[id];
        if (el) {
          newElements[id] = { ...el, zIndex: (el.zIndex || 1) + 1, updatedAt: Date.now() };
        }
      });
      return { ...prev, elements: newElements };
    });
  }, [state.selectedElementIds, pushHistory]);

  const handleSendBackward = useCallback(() => {
    if (state.selectedElementIds.length === 0) return;
    pushHistory();
    setState((prev) => {
      const newElements = { ...prev.elements };
      state.selectedElementIds.forEach((id) => {
        const el = newElements[id];
        if (el) {
          newElements[id] = { ...el, zIndex: Math.max(0, (el.zIndex || 1) - 1), updatedAt: Date.now() };
        }
      });
      return { ...prev, elements: newElements };
    });
  }, [state.selectedElementIds, pushHistory]);

  // Zoom controls
  const handleZoomIn = useCallback(() => setState((p) => ({ ...p, zoom: Math.min(2.5, p.zoom + 0.15) })), []);
  const handleZoomOut = useCallback(() => setState((p) => ({ ...p, zoom: Math.max(0.25, p.zoom - 0.15) })), []);
  const handleResetZoom = useCallback(() => setState((p) => ({ ...p, zoom: 1, pan: { x: 40, y: 40 } })), []);
  const handleFitView = useCallback(() => {
    const visible = Object.values(state.elements).filter((el) => el.boardId === state.currentBoardId);
    if (visible.length === 0) {
      setState((p) => ({ ...p, pan: { x: 40, y: 40 }, zoom: 1 }));
      return;
    }
    const minX = Math.min(...visible.map((el) => el.x));
    const minY = Math.min(...visible.map((el) => el.y));
    setState((p) => ({ ...p, pan: { x: -minX + 80, y: -minY + 80 }, zoom: 0.9 }));
  }, [state.elements, state.currentBoardId]);

  // Navigate to parent board
  const handleNavigateParentBoard = useCallback(() => {
    const currentB = state.boards[state.currentBoardId];
    const parentId = currentB?.parentId;
    if (parentId) {
      setState((p) => ({ ...p, currentBoardId: parentId, selectedElementIds: [], pan: { x: 60, y: 60 }, zoom: 1 }));
    }
  }, [state.boards, state.currentBoardId]);

  const canNavigateUp = !!state.boards[state.currentBoardId]?.parentId;

  // ========================================================================
  // Register Global Keyboard Shortcuts
  // ========================================================================

  useKeyboardShortcuts({
    onSelectTool: setActiveTool,
    onAddElement: handleAddElementFromSidebar,
    onSelectAll: handleSelectAll,
    onDeselectAll: handleDeselectAll,
    onDeleteSelected: handleDeleteSelected,
    onDuplicateSelected: () => state.selectedElementIds.forEach((id) => handleDuplicateElement(id)),
    onCutSelected: handleCutSelected,
    onNudgeSelected: handleNudgeSelected,
    onBringForward: handleBringForward,
    onSendBackward: handleSendBackward,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onResetZoom: handleResetZoom,
    onFitView: handleFitView,
    onNavigateParentBoard: handleNavigateParentBoard,
    onOpenSearch: () => setIsSearchOpen(true),
    onOpenExport: () => setIsExportOpen(true),
    onOpenHelp: () => setIsHelpOpen(true),
    onUndo: handleUndo,
    onRedo: handleRedo,
    hasSelection: state.selectedElementIds.length > 0,
    canNavigateUp,
  });

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${state.theme === 'dark' ? 'dark' : ''}`}>
      {/* Top Header */}
      <Header
        currentBoard={currentBoard}
        breadcrumbs={breadcrumbs}
        onNavigateBoard={handleNavigateBoard}
        onUpdateBoardTitle={handleUpdateBoardTitle}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onResetBoard={handleResetBoard}
        gridVisible={state.gridVisible}
        onToggleGrid={() => setState((p) => ({ ...p, gridVisible: !p.gridVisible }))}
        gridSnap={state.gridSnap}
        onToggleSnap={() => setState((p) => ({ ...p, gridSnap: !p.gridSnap }))}
        theme={state.theme}
        onToggleTheme={() =>
          setState((p) => ({ ...p, theme: p.theme === 'light' ? 'dark' : 'light' }))
        }
        zoom={state.zoom}
      />

      {/* Main Workspace Area (Left Toolbar + Infinite Canvas) */}
      <div className="flex flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden">
        <Sidebar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onAddElement={handleAddElementFromSidebar}
          onOpenUpload={handleOpenUpload}
          onOpenTemplates={() => setIsTemplatesOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onDeleteSelected={handleDeleteSelected}
          hasSelection={state.selectedElementIds.length > 0}
          onStartConnectingMode={() => {
            if (state.selectedElementIds.length > 0) {
              setConnectingSource({
                fromId: state.selectedElementIds[0],
                fromAnchor: 'right',
              });
            } else {
              showAppDialog({
                type: 'info',
                title: 'Select a Card First',
                message:
                  'Select any card or note on the canvas first to start drawing a connection line.',
                confirmLabel: 'Got it',
              });
            }
          }}
        />

        <Canvas
          currentBoardId={state.currentBoardId}
          elements={state.elements}
          connections={state.connections}
          pan={state.pan}
          zoom={state.zoom}
          selectedElementIds={state.selectedElementIds}
          gridSnap={state.gridSnap}
          gridVisible={state.gridVisible}
          theme={state.theme}
          activeTool={activeTool}
          onPanChange={(pan) => setState((p) => ({ ...p, pan }))}
          onZoomChange={(zoom) => setState((p) => ({ ...p, zoom }))}
          onSelectElements={(ids) => setState((p) => ({ ...p, selectedElementIds: ids }))}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onAddElementAtCoords={handleAddElementAtCoords}
          onAddImageWithData={handleAddImageWithData}
          onNavigateBoard={handleNavigateBoard}
          onAddConnection={handleAddConnection}
          onDeleteConnection={handleDeleteConnection}
          onUpdateConnectionLabel={handleUpdateConnectionLabel}
          connectingSource={connectingSource}
          setConnectingSource={setConnectingSource}
        />
      </div>

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        elements={state.elements}
        boards={state.boards}
        onSelectElement={handleSelectFromSearch}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        state={state}
        onImportState={(newState) => setState(newState)}
      />

      <TemplateModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onLoadTemplate={handleLoadTemplate}
      />

      <UploadModal
        key={isUploadOpen ? `upload_${uploadDefaultTab}` : 'upload_closed'}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultTab={uploadDefaultTab}
        onUploadMedia={handleUploadMedia}
        onUploadFiles={handleUploadFiles}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Global In-App Dialog / Alerts */}
      <AppDialog
        isOpen={isDialogOpen}
        options={dialogOptions}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}

export default App;
