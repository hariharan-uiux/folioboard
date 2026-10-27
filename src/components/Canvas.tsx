import React, { useRef, useState, useCallback, useEffect } from 'react';
import type {
  CanvasElement,
  Connection,
  ElementType,
  AnchorPosition,
} from '../types/folioboard';
import { ConnectionLines } from './ConnectionLines';
import { FloatingToolbar } from './FloatingToolbar';
import { NoteElement } from './elements/NoteElement';
import { ImageElement } from './elements/ImageElement';
import { LinkElement } from './elements/LinkElement';
import { TaskElement } from './elements/TaskElement';
import { BoardElement } from './elements/BoardElement';
import { ColumnElement } from './elements/ColumnElement';
import { ColorElement } from './elements/ColorElement';
import { SketchElement } from './elements/SketchElement';
import { FileElement } from './elements/FileElement';
import { ContextMenu } from './ContextMenu';
import { DuotoneIcon } from './DuotoneIcon';
import { Plus, Minus, Maximize, ZoomIn, Lock } from 'lucide-react';
import { isWebUrl, parseUrlMetadata } from '../utils/urlHelper';

interface CanvasProps {
  currentBoardId: string;
  elements: Record<string, CanvasElement>;
  connections: Record<string, Connection>;
  pan: { x: number; y: number };
  zoom: number;
  selectedElementIds: string[];
  gridSnap: boolean;
  gridVisible: boolean;
  theme: 'light' | 'dark';
  activeTool: 'select' | 'hand';
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onSelectElements: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onAddElementAtCoords: (
    type: ElementType,
    x: number,
    y: number,
    customData?: any,
    customW?: number,
    customH?: number
  ) => void;
  onAddImageWithData: (
    dataUrl: string,
    x: number,
    y: number,
    name?: string,
    customW?: number,
    customH?: number
  ) => void;
  onNavigateBoard: (boardId: string) => void;
  onAddConnection: (
    fromId: string,
    toId: string,
    fromAnchor: AnchorPosition,
    toAnchor: AnchorPosition
  ) => void;
  onDeleteConnection: (id: string) => void;
  onUpdateConnectionLabel: (id: string, label: string) => void;
  connectingSource: { fromId: string; fromAnchor: AnchorPosition } | null;
  setConnectingSource: (
    source: { fromId: string; fromAnchor: AnchorPosition } | null
  ) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  currentBoardId,
  elements,
  connections,
  pan,
  zoom,
  selectedElementIds,
  gridSnap,
  gridVisible,
  theme,
  activeTool,
  onPanChange,
  onZoomChange,
  onSelectElements,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onAddElementAtCoords,
  onAddImageWithData,
  onNavigateBoard,
  onAddConnection,
  onDeleteConnection,
  onUpdateConnectionLabel,
  connectingSource,
  setConnectingSource,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Spacebar pan state
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Dragging Canvas (Panning)
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging Cards with threshold to prevent accidental shifts on click
  const [dragCandidate, setDragCandidate] = useState<{
    id: string;
    startX: number;
    startY: number;
    clientStartX: number;
    clientStartY: number;
  } | null>(null);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Resizing Cards
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    width: number;
    height: number;
    mouseX: number;
    mouseY: number;
    x?: number;
    y?: number;
    handle?: 'se' | 'sw' | 'ne' | 'nw';
  }>({ width: 0, height: 0, mouseX: 0, mouseY: 0 });

  // Live connecting line tracking
  const [mouseCanvasCoords, setMouseCanvasCoords] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Marquee box selection (default for Arrow/Select tool!)
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId: string;
  } | null>(null);

  // Spacebar keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const snapValue = (val: number) => {
    if (!gridSnap) return val;
    return Math.round(val / 20) * 20;
  };

  const getCardBg = (color?: string) => {
    if (theme === 'dark') {
      if (!color || color === '#ffffff' || color === '#fafafb') {
        return '#1e2024';
      }
    }
    return color || '#ffffff';
  };

  // Convert client viewport coordinates to canvas coordinates
  const clientToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // Native Wheel listener: handles zoom, vertical scroll, and horizontal scroll (Shift + Wheel / trackpad)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const nextZoom = Math.min(Math.max(zoom * zoomFactor, 0.25), 2.5);

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newPanX = mouseX - ((mouseX - pan.x) / zoom) * nextZoom;
        const newPanY = mouseY - ((mouseY - pan.y) / zoom) * nextZoom;

        onZoomChange(nextZoom);
        onPanChange({ x: newPanX, y: newPanY });
      } else {
        const multiplier = e.deltaMode === 1 ? 24 : e.deltaMode === 2 ? window.innerHeight : 1;
        let dx = e.deltaX * multiplier;
        let dy = e.deltaY * multiplier;

        // Shift + Wheel converts vertical wheel movement into horizontal scroll
        if (e.shiftKey && Math.abs(dx) < 0.01 && Math.abs(dy) > 0) {
          dx = dy;
          dy = 0;
        }

        onPanChange({
          x: pan.x - dx,
          y: pan.y - dy,
        });
      }
    };

    container.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelNative);
    };
  }, [pan, zoom, onPanChange, onZoomChange]);

  // Canvas background pointer down
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement)?.closest?.('[role="menu"]')) {
      return;
    }

    if (contextMenu) {
      setContextMenu(null);
    }

    // If Space is held, middle-click, altKey, or Hand tool mode -> PAN canvas
    if (e.button === 1 || e.altKey || isSpacePressed || activeTool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Default Left-Click: Arrow tool draws marquee box to SELECT contents!
    if (e.button === 0) {
      const c = clientToCanvas(e.clientX, e.clientY);
      setIsMarqueeSelecting(true);
      setMarqueeStart(c);
      setMarqueeEnd(c);
      if (!e.shiftKey) {
        onSelectElements([]);
      }
    }

    if (connectingSource) {
      setConnectingSource(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = clientToCanvas(e.clientX, e.clientY);
    setMouseCanvasCoords(coords);

    if (isPanning) {
      onPanChange({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (isMarqueeSelecting && marqueeStart) {
      setMarqueeEnd(coords);
    } else if (dragCandidate && !draggingElementId) {
      // Check drag threshold (4px) before initiating element move
      const dist = Math.hypot(
        e.clientX - dragCandidate.clientStartX,
        e.clientY - dragCandidate.clientStartY
      );
      if (dist > 4) {
        setDraggingElementId(dragCandidate.id);
        const el = elements[dragCandidate.id];
        if (el) {
          setDragOffset({
            x: coords.x - el.x,
            y: coords.y - el.y,
          });
        }
      }
    } else if (draggingElementId && elements[draggingElementId]) {
      const draggedEl = elements[draggingElementId];
      const newX = snapValue(coords.x - dragOffset.x);
      const newY = snapValue(coords.y - dragOffset.y);

      const dx = newX - draggedEl.x;
      const dy = newY - draggedEl.y;

      if (dx !== 0 || dy !== 0) {
        if (selectedElementIds.includes(draggingElementId) && selectedElementIds.length > 1) {
          selectedElementIds.forEach((id) => {
            const item = elements[id];
            if (item) {
              onUpdateElement(id, {
                x: snapValue(item.x + dx),
                y: snapValue(item.y + dy),
              });
            }
          });
        } else {
          onUpdateElement(draggingElementId, { x: newX, y: newY });
        }
      }
    } else if (resizingId && elements[resizingId]) {
      const el = elements[resizingId];
      const deltaX = (e.clientX - resizeStart.mouseX) / zoom;
      const deltaY = (e.clientY - resizeStart.mouseY) / zoom;
      const handle = resizeStart.handle || 'se';
      const isImage = el.type === 'image';
      const aspectRatio = resizeStart.width / Math.max(1, resizeStart.height);

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.x ?? el.x;
      let newY = resizeStart.y ?? el.y;

      if (isImage) {
        // For images, preserve aspect ratio proportionally
        if (e.shiftKey) {
          // Freeform if Shift held
          if (handle === 'se') {
            newWidth = Math.max(100, snapValue(resizeStart.width + deltaX));
            newHeight = Math.max(80, snapValue(resizeStart.height + deltaY));
          } else if (handle === 'sw') {
            newWidth = Math.max(100, snapValue(resizeStart.width - deltaX));
            newHeight = Math.max(80, snapValue(resizeStart.height + deltaY));
            newX = snapValue((resizeStart.x ?? el.x) + (resizeStart.width - newWidth));
          } else if (handle === 'ne') {
            newWidth = Math.max(100, snapValue(resizeStart.width + deltaX));
            newHeight = Math.max(80, snapValue(resizeStart.height - deltaY));
            newY = snapValue((resizeStart.y ?? el.y) + (resizeStart.height - newHeight));
          } else if (handle === 'nw') {
            newWidth = Math.max(100, snapValue(resizeStart.width - deltaX));
            newHeight = Math.max(80, snapValue(resizeStart.height - deltaY));
            newX = snapValue((resizeStart.x ?? el.x) + (resizeStart.width - newWidth));
            newY = snapValue((resizeStart.y ?? el.y) + (resizeStart.height - newHeight));
          }
        } else {
          // Proportional scaling
          let d = 0;
          if (handle === 'se') {
            d = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY * aspectRatio;
            newWidth = Math.max(100, Math.round(resizeStart.width + d));
            newHeight = Math.max(80, Math.round(newWidth / aspectRatio));
          } else if (handle === 'sw') {
            d = Math.abs(deltaX) > Math.abs(deltaY) ? -deltaX : deltaY * aspectRatio;
            newWidth = Math.max(100, Math.round(resizeStart.width + d));
            newHeight = Math.max(80, Math.round(newWidth / aspectRatio));
            newX = (resizeStart.x ?? el.x) + (resizeStart.width - newWidth);
          } else if (handle === 'ne') {
            d = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : -deltaY * aspectRatio;
            newWidth = Math.max(100, Math.round(resizeStart.width + d));
            newHeight = Math.max(80, Math.round(newWidth / aspectRatio));
            newY = (resizeStart.y ?? el.y) + (resizeStart.height - newHeight);
          } else if (handle === 'nw') {
            d = Math.abs(deltaX) > Math.abs(deltaY) ? -deltaX : -deltaY * aspectRatio;
            newWidth = Math.max(100, Math.round(resizeStart.width + d));
            newHeight = Math.max(80, Math.round(newWidth / aspectRatio));
            newX = (resizeStart.x ?? el.x) + (resizeStart.width - newWidth);
            newY = (resizeStart.y ?? el.y) + (resizeStart.height - newHeight);
          }
        }
      } else {
        // Standard elements
        if (handle === 'se') {
          newWidth = Math.max(160, snapValue(resizeStart.width + deltaX));
          newHeight = Math.max(90, snapValue(resizeStart.height + deltaY));
        } else if (handle === 'sw') {
          newWidth = Math.max(160, snapValue(resizeStart.width - deltaX));
          newHeight = Math.max(90, snapValue(resizeStart.height + deltaY));
          newX = snapValue((resizeStart.x ?? el.x) + (resizeStart.width - newWidth));
        } else if (handle === 'ne') {
          newWidth = Math.max(160, snapValue(resizeStart.width + deltaX));
          newHeight = Math.max(90, snapValue(resizeStart.height - deltaY));
          newY = snapValue((resizeStart.y ?? el.y) + (resizeStart.height - newHeight));
        } else if (handle === 'nw') {
          newWidth = Math.max(160, snapValue(resizeStart.width - deltaX));
          newHeight = Math.max(90, snapValue(resizeStart.height - deltaY));
          newX = snapValue((resizeStart.x ?? el.x) + (resizeStart.width - newWidth));
          newY = snapValue((resizeStart.y ?? el.y) + (resizeStart.height - newHeight));
        }
      }

      onUpdateElement(resizingId, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (dragCandidate) setDragCandidate(null);
    if (draggingElementId) setDraggingElementId(null);
    if (resizingId) setResizingId(null);

    // Finalize Marquee Selection of contents
    if (isMarqueeSelecting && marqueeStart && marqueeEnd) {
      const minX = Math.min(marqueeStart.x, marqueeEnd.x);
      const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
      const minY = Math.min(marqueeStart.y, marqueeEnd.y);
      const maxY = Math.max(marqueeStart.y, marqueeEnd.y);

      // Only select if box has size > 4px
      if (Math.abs(maxX - minX) > 4 || Math.abs(maxY - minY) > 4) {
        const selected = Object.values(elements)
          .filter((el) => el.boardId === currentBoardId)
          .filter((el) => {
            return (
              el.x < maxX &&
              el.x + el.width > minX &&
              el.y < maxY &&
              el.y + el.height > minY
            );
          })
          .map((el) => el.id);

        onSelectElements(selected);
      }
      setIsMarqueeSelecting(false);
      setMarqueeStart(null);
      setMarqueeEnd(null);
    }
  };

  // Card pointer down (Selects initially; prepares drag candidate)
  const handleElementMouseDown = (
    e: React.MouseEvent,
    el: CanvasElement
  ) => {
    e.stopPropagation();

    // Right-click handled by onContextMenu
    if (e.button === 2) {
      return;
    }

    if (contextMenu) {
      setContextMenu(null);
    }

    // If Hand tool or space is active, treat as pan
    if (isSpacePressed || activeTool === 'hand' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.shiftKey) {
      if (selectedElementIds.includes(el.id)) {
        onSelectElements(selectedElementIds.filter((id) => id !== el.id));
      } else {
        onSelectElements([...selectedElementIds, el.id]);
      }
    } else {
      if (!selectedElementIds.includes(el.id)) {
        onSelectElements([el.id]);
      }
    }

    // Locked elements cannot be dragged
    if (el.locked) {
      return;
    }

    const coords = clientToCanvas(e.clientX, e.clientY);
    setDragCandidate({
      id: el.id,
      startX: coords.x,
      startY: coords.y,
      clientStartX: e.clientX,
      clientStartY: e.clientY,
    });
  };

  // Right-Click Context Menu Trigger on Canvas Elements
  const handleElementContextMenu = (e: React.MouseEvent, el: CanvasElement) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedElementIds.includes(el.id)) {
      onSelectElements([el.id]);
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elementId: el.id,
    });
  };

  // Context Menu Actions
  const handleContextMenuCut = () => {
    if (!contextMenu) return;
    const el = elements[contextMenu.elementId];
    if (el) {
      const payload = JSON.stringify({
        __folioboard_copy__: true,
        elements: [el],
      });
      navigator.clipboard.writeText(payload);
      onDeleteElement(el.id);
    }
    setContextMenu(null);
  };

  const handleContextMenuCopy = () => {
    if (!contextMenu) return;
    const el = elements[contextMenu.elementId];
    if (el) {
      const payload = JSON.stringify({
        __folioboard_copy__: true,
        elements: [el],
      });
      navigator.clipboard.writeText(payload);
    }
    setContextMenu(null);
  };

  const handleContextMenuDuplicate = () => {
    if (!contextMenu) return;
    onDuplicateElement(contextMenu.elementId);
    setContextMenu(null);
  };

  const handleContextMenuDelete = () => {
    if (!contextMenu) return;
    const targetId = contextMenu.elementId;
    if (selectedElementIds.includes(targetId) && selectedElementIds.length > 1) {
      selectedElementIds.forEach((id) => onDeleteElement(id));
    } else {
      onDeleteElement(targetId);
    }
    setContextMenu(null);
  };

  const handleContextMenuDownloadOriginal = () => {
    if (!contextMenu) return;
    const el = elements[contextMenu.elementId];
    if (el && el.data?.url) {
      const url = el.data.url;
      const link = document.createElement('a');
      link.href = url;
      link.download = el.data.caption || 'image.png';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setContextMenu(null);
  };

  const handleContextMenuReplaceImage = () => {
    if (!contextMenu) return;
    const elId = contextMenu.elementId;
    const el = elements[elId];
    if (!el) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          const img = new Image();
          img.onload = () => {
            onUpdateElement(elId, {
              data: {
                ...el.data,
                url: dataUrl,
                caption: file.name.replace(/\.[^/.]+$/, ''),
                exactSizeApplied: true,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
              },
              updatedAt: Date.now(),
            });
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
    setContextMenu(null);
  };

  const handleContextMenuToggleCropToGrid = () => {
    if (!contextMenu) return;
    const el = elements[contextMenu.elementId];
    if (el) {
      const current = el.data?.cropToGrid !== false;
      onUpdateElement(el.id, {
        data: {
          ...el.data,
          cropToGrid: !current,
        },
        updatedAt: Date.now(),
      });
    }
    setContextMenu(null);
  };

  const handleContextMenuToggleLock = () => {
    if (!contextMenu) return;
    const el = elements[contextMenu.elementId];
    if (el) {
      onUpdateElement(el.id, {
        locked: !el.locked,
        updatedAt: Date.now(),
      });
    }
    setContextMenu(null);
  };

  const handleContextMenuBringToFront = () => {
    if (!contextMenu) return;
    const el = elements[contextMenu.elementId];
    if (el) {
      const maxZ = boardElements.reduce(
        (max, item) => Math.max(max, item.zIndex || 1),
        1
      );
      onUpdateElement(el.id, {
        zIndex: maxZ + 1,
        updatedAt: Date.now(),
      });
    }
    setContextMenu(null);
  };

  const handleContextMenuSendToBack = () => {
    if (!contextMenu) return;
    const el = elements[contextMenu.elementId];
    if (el) {
      const minZ = boardElements.reduce(
        (min, item) => Math.min(min, item.zIndex || 1),
        1
      );
      onUpdateElement(el.id, {
        zIndex: Math.max(0, minZ - 1),
        updatedAt: Date.now(),
      });
    }
    setContextMenu(null);
  };

  // Anchor click / connect handling
  const handleAnchorMouseDown = (
    e: React.MouseEvent,
    el: CanvasElement,
    anchor: AnchorPosition
  ) => {
    e.stopPropagation();
    if (!connectingSource) {
      setConnectingSource({ fromId: el.id, fromAnchor: anchor });
    } else {
      if (connectingSource.fromId !== el.id) {
        onAddConnection(connectingSource.fromId, el.id, connectingSource.fromAnchor, anchor);
      }
      setConnectingSource(null);
    }
  };

  // Drop tool item onto canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const coords = clientToCanvas(e.clientX, e.clientY);

    // 1. Check for files dropped from OS (e.g. image files, videos, documents)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
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
            onAddImageWithData(
              dataUrl,
              snapValue(coords.x - w / 2),
              snapValue(coords.y - h / 2),
              file.name,
              w,
              h
            );
          };
          img.onerror = () => {
            onAddImageWithData(
              dataUrl,
              snapValue(coords.x - 160),
              snapValue(coords.y - 140),
              file.name
            );
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
        return;
      } else if (file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg)$/i.test(file.name)) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          onAddElementAtCoords(
            'image',
            snapValue(coords.x - 180),
            snapValue(coords.y - 130),
            {
              url: dataUrl,
              caption: file.name.replace(/\.[^/.]+$/, ''),
              isVideo: true,
              exactSizeApplied: true,
            },
            380,
            260
          );
        };
        reader.readAsDataURL(file);
        return;
      } else {
        // Document / other file
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const sizeStr =
            file.size > 1024 * 1024
              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.round(file.size / 1024)} KB`;
          const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
          onAddElementAtCoords(
            'file',
            snapValue(coords.x - 150),
            snapValue(coords.y - 45),
            {
              fileName: file.name,
              fileSize: sizeStr,
              fileType: ext,
              downloadUrl: dataUrl,
            },
            300,
            86
          );
        };
        reader.readAsDataURL(file);
        return;
      }
    }

    // 2. Check for web image dragged directly from another website/tab
    const uri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (
      uri &&
      (/\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(uri) ||
        /(images\.unsplash\.com|i\.imgur\.com|media\.giphy\.com)/i.test(uri))
    ) {
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
        onAddImageWithData(
          uri,
          snapValue(coords.x - w / 2),
          snapValue(coords.y - h / 2),
          '',
          w,
          h
        );
      };
      img.onerror = () => {
        onAddImageWithData(
          uri,
          snapValue(coords.x - 160),
          snapValue(coords.y - 140),
          ''
        );
      };
      img.src = uri;
      return;
    }

    // 3. Check for sidebar tools
    const type = (e.dataTransfer.getData('application/folioboard-type') ||
      e.dataTransfer.getData('application/folioboard-type')) as ElementType | 'upload';
    if (type === 'upload') {
      onAddElementAtCoords(
        'image',
        snapValue(coords.x - 160),
        snapValue(coords.y - 140),
        { url: '', caption: '' },
        320,
        280
      );
      return;
    }
    if (type) {
      onAddElementAtCoords(type, snapValue(coords.x - 140), snapValue(coords.y - 80));
      return;
    }

    // 4. Check for dropped web URLs
    if (uri && isWebUrl(uri)) {
      const meta = parseUrlMetadata(uri);
      onAddElementAtCoords(
        'link',
        snapValue(coords.x - 160),
        snapValue(coords.y - 80),
        {
          url: meta.url,
          title: meta.title,
          description: meta.description,
          domain: meta.domain,
          favicon: meta.favicon,
          image: meta.image || '',
        },
        320,
        meta.image ? 250 : 160
      );
      return;
    }

    // 5. Check for dropped plain text
    const plainText = e.dataTransfer.getData('text/plain')?.trim();
    if (plainText && plainText.length > 0) {
      if (isWebUrl(plainText)) {
        const meta = parseUrlMetadata(plainText);
        onAddElementAtCoords(
          'link',
          snapValue(coords.x - 160),
          snapValue(coords.y - 80),
          {
            url: meta.url,
            title: meta.title,
            description: meta.description,
            domain: meta.domain,
            favicon: meta.favicon,
            image: meta.image || '',
          },
          320,
          meta.image ? 250 : 160
        );
        return;
      }

      onAddElementAtCoords(
        'note',
        snapValue(coords.x - 140),
        snapValue(coords.y - 90),
        {
          title: '',
          content: plainText,
          fontSize: 'md',
          fontFamily: 'sans',
          textAlign: 'left',
        },
        280,
        180
      );
    }
  };

  const handleMouseMoveRef = useRef(handleMouseMove);
  const handleMouseUpRef = useRef(handleMouseUp);

  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
  });

  // Window pointer listeners during active drag / pan / resize / marquee
  useEffect(() => {
    if (!isPanning && !isMarqueeSelecting && !dragCandidate && !draggingElementId && !resizingId) {
      return;
    }

    const onWindowMouseMove = (e: MouseEvent) => {
      handleMouseMoveRef.current(e as unknown as React.MouseEvent);
    };

    const onWindowMouseUp = () => {
      handleMouseUpRef.current();
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [isPanning, isMarqueeSelecting, dragCandidate, draggingElementId, resizingId]);

  // Global keydown (Delete, Duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach((id) => onDeleteElement(id));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach((id) => onDuplicateElement(id));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, onDeleteElement, onDuplicateElement]);

  const boardElements = Object.values(elements).filter(
    (el) => el.boardId === currentBoardId
  );

  const getCanvasCursor = () => {
    if (draggingElementId) return 'grabbing';
    if (isPanning) return 'grabbing';
    if (isSpacePressed || activeTool === 'hand') return 'grab';
    if (isMarqueeSelecting) return 'crosshair';
    return 'default';
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu(null);
      }}
      style={{ cursor: getCanvasCursor() }}
      className={`relative flex-1 w-full h-full overflow-hidden select-none transition-colors ${
        gridVisible
          ? theme === 'dark'
            ? 'canvas-grid-dark'
            : 'canvas-grid'
          : theme === 'dark'
          ? 'bg-[#121316]'
          : 'bg-[#fafafb]'
      }`}
    >
      {/* Canvas Viewport Transformer */}
      <div
        className="absolute origin-top-left will-change-transform"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: '50000px',
          height: '50000px',
        }}
      >
        {/* Render Connection Lines */}
        <ConnectionLines
          connections={connections}
          elements={elements}
          currentBoardId={currentBoardId}
          onDeleteConnection={onDeleteConnection}
          onUpdateConnectionLabel={onUpdateConnectionLabel}
          activeConnecting={
            connectingSource
              ? {
                  fromId: connectingSource.fromId,
                  fromAnchor: connectingSource.fromAnchor,
                  currentPoint: mouseCanvasCoords,
                }
              : null
          }
        />

        {/* Marquee Selection Box */}
        {isMarqueeSelecting && marqueeStart && marqueeEnd && (
          <div
            className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none rounded-lg z-40"
            style={{
              left: Math.min(marqueeStart.x, marqueeEnd.x),
              top: Math.min(marqueeStart.y, marqueeEnd.y),
              width: Math.abs(marqueeEnd.x - marqueeStart.x),
              height: Math.abs(marqueeEnd.y - marqueeStart.y),
            }}
          />
        )}

        {/* Render Canvas Elements */}
        {boardElements.map((el) => {
          const isSelected = selectedElementIds.includes(el.id);
          const isDragging =
            draggingElementId === el.id ||
            (Boolean(draggingElementId) && isSelected);
          const computedBg = getCardBg(el.color);

          return (
            <div
              key={el.id}
              id={`el-${el.id}`}
              onMouseDown={(e) => handleElementMouseDown(e, el)}
              onContextMenu={(e) => handleElementContextMenu(e, el)}
              className={`absolute rounded-xl select-none group/card ${
                el.type === 'column'
                  ? 'border-2 border-dashed border-neutral-300 dark:border-neutral-700/90 bg-neutral-100/60 dark:bg-[#18191c]/70'
                  : 'border border-neutral-200/90 dark:border-neutral-700/80'
              } ${
                isDragging
                  ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20 dark:shadow-blue-500/30 opacity-95 cursor-grabbing z-50'
                  : isSelected
                  ? 'ring-2 ring-blue-500 shadow-xl cursor-grab'
                  : el.type === 'column'
                  ? ''
                  : 'shadow-xs hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 cursor-grab'
              }`}
              style={{
                transform: `translate(${el.x}px, ${el.y}px)${
                  isDragging
                    ? ' scale(1.025) rotate(-0.5deg)'
                    : ' scale(1) rotate(0deg)'
                }`,
                width: `${el.width}px`,
                height: `${el.height}px`,
                backgroundColor: el.type === 'column' ? undefined : computedBg,
                zIndex: isDragging ? 50 : isSelected ? 30 : el.zIndex || 1,
                willChange: 'transform',
                transition: isDragging
                  ? 'box-shadow 0.15s ease, opacity 0.15s ease'
                  : 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, opacity 0.2s ease',
              }}
            >
              {/* Floating Toolbar above selected element */}
              {isSelected && !draggingElementId && selectedElementIds.length === 1 && (
                <FloatingToolbar
                  element={el}
                  zoom={zoom}
                  onUpdateColor={(c) => onUpdateElement(el.id, { color: c })}
                  onDuplicate={() => onDuplicateElement(el.id)}
                  onDelete={() => onDeleteElement(el.id)}
                  onBringForward={() =>
                    onUpdateElement(el.id, { zIndex: (el.zIndex || 1) + 1 })
                  }
                  onSendBackward={() =>
                    onUpdateElement(el.id, { zIndex: Math.max(0, (el.zIndex || 1) - 1) })
                  }
                  onStartConnection={(fromId, anchor) =>
                    setConnectingSource({ fromId, fromAnchor: anchor })
                  }
                />
              )}

              {/* Element Content according to type */}
              <div className="w-full h-full overflow-hidden rounded-xl">
                {el.type === 'note' && (
                  <NoteElement
                    element={el}
                    onUpdate={onUpdateElement}
                    isSelected={isSelected}
                  />
                )}
                {el.type === 'image' && (
                  <ImageElement
                    element={el}
                    onUpdate={onUpdateElement}
                    isSelected={isSelected}
                  />
                )}
                {el.type === 'link' && (
                  <LinkElement
                    element={el}
                    onUpdate={onUpdateElement}
                    isSelected={isSelected}
                  />
                )}
                {el.type === 'task' && (
                  <TaskElement
                    element={el}
                    onUpdate={onUpdateElement}
                    isSelected={isSelected}
                  />
                )}
                {el.type === 'board' && (
                  <BoardElement
                    element={el}
                    onUpdate={onUpdateElement}
                    onNavigateBoard={onNavigateBoard}
                    childItemCount={
                      Object.values(elements).filter(
                        (child) => child.boardId === (el.data?.targetBoardId || el.id)
                      ).length
                    }
                    isSelected={isSelected}
                  />
                )}
                {el.type === 'column' && (
                  <ColumnElement
                    element={el}
                    onUpdate={onUpdateElement}
                    isSelected={isSelected}
                  />
                )}
                {el.type === 'color' && (
                  <ColorElement
                    element={el}
                    onUpdate={onUpdateElement}
                    isSelected={isSelected}
                  />
                )}
                {el.type === 'sketch' && (
                  <SketchElement
                    element={el}
                    onUpdate={onUpdateElement}
                    isSelected={isSelected}
                  />
                )}
                {el.type === 'file' && (
                  <FileElement
                    element={el}
                    onUpdate={onUpdateElement}
                    isSelected={isSelected}
                  />
                )}
              </div>

              {/* 4 Connection Anchors (top, right, bottom, left) on hover */}
              {!draggingElementId && (
                <>
                  <button
                    onMouseDown={(e) => handleAnchorMouseDown(e, el, 'top')}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white dark:bg-neutral-800 border-2 border-neutral-400 dark:border-neutral-500 opacity-0 group-hover/card:opacity-100 hover:border-blue-500 dark:hover:border-blue-400 hover:scale-125 transition-all z-20 cursor-crosshair shadow-2xs"
                    title="Connect from Top"
                  />
                  <button
                    onMouseDown={(e) => handleAnchorMouseDown(e, el, 'right')}
                    className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white dark:bg-neutral-800 border-2 border-neutral-400 dark:border-neutral-500 opacity-0 group-hover/card:opacity-100 hover:border-blue-500 dark:hover:border-blue-400 hover:scale-125 transition-all z-20 cursor-crosshair shadow-2xs"
                    title="Connect from Right"
                  />
                  <button
                    onMouseDown={(e) => handleAnchorMouseDown(e, el, 'bottom')}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white dark:bg-neutral-800 border-2 border-neutral-400 dark:border-neutral-500 opacity-0 group-hover/card:opacity-100 hover:border-blue-500 dark:hover:border-blue-400 hover:scale-125 transition-all z-20 cursor-crosshair shadow-2xs"
                    title="Connect from Bottom"
                  />
                  <button
                    onMouseDown={(e) => handleAnchorMouseDown(e, el, 'left')}
                    className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white dark:bg-neutral-800 border-2 border-neutral-400 dark:border-neutral-500 opacity-0 group-hover/card:opacity-100 hover:border-blue-500 dark:hover:border-blue-400 hover:scale-125 transition-all z-20 cursor-crosshair shadow-2xs"
                    title="Connect from Left"
                  />
                </>
              )}

              {/* Lock Indicator Badge */}
              {el.locked && (
                <div
                  className="absolute top-2 right-2 p-1 rounded-md bg-black/60 backdrop-blur-xs text-white/90 z-20 pointer-events-auto cursor-pointer hover:bg-black/80 transition-colors"
                  title="Locked position (Right-click to unlock)"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateElement(el.id, { locked: false, updatedAt: Date.now() });
                  }}
                >
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {/* 4 Corner Resize Handles */}
              {(isSelected || el.type === 'image') && !el.locked && !draggingElementId && (
                <>
                  {/* Top-Left (NW) */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (!selectedElementIds.includes(el.id)) onSelectElements([el.id]);
                      setResizingId(el.id);
                      setResizeStart({
                        width: el.width,
                        height: el.height,
                        mouseX: e.clientX,
                        mouseY: e.clientY,
                        x: el.x,
                        y: el.y,
                        handle: 'nw',
                      });
                    }}
                    className={`absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white dark:bg-neutral-900 border-2 border-blue-500 rounded-xs cursor-nwse-resize shadow-xs hover:scale-125 transition-transform z-30 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
                    }`}
                    title="Drag corner to resize"
                  />
                  {/* Top-Right (NE) */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (!selectedElementIds.includes(el.id)) onSelectElements([el.id]);
                      setResizingId(el.id);
                      setResizeStart({
                        width: el.width,
                        height: el.height,
                        mouseX: e.clientX,
                        mouseY: e.clientY,
                        x: el.x,
                        y: el.y,
                        handle: 'ne',
                      });
                    }}
                    className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white dark:bg-neutral-900 border-2 border-blue-500 rounded-xs cursor-nesw-resize shadow-xs hover:scale-125 transition-transform z-30 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
                    }`}
                    title="Drag corner to resize"
                  />
                  {/* Bottom-Left (SW) */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (!selectedElementIds.includes(el.id)) onSelectElements([el.id]);
                      setResizingId(el.id);
                      setResizeStart({
                        width: el.width,
                        height: el.height,
                        mouseX: e.clientX,
                        mouseY: e.clientY,
                        x: el.x,
                        y: el.y,
                        handle: 'sw',
                      });
                    }}
                    className={`absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white dark:bg-neutral-900 border-2 border-blue-500 rounded-xs cursor-nesw-resize shadow-xs hover:scale-125 transition-transform z-30 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
                    }`}
                    title="Drag corner to resize"
                  />
                  {/* Bottom-Right (SE) */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (!selectedElementIds.includes(el.id)) onSelectElements([el.id]);
                      setResizingId(el.id);
                      setResizeStart({
                        width: el.width,
                        height: el.height,
                        mouseX: e.clientX,
                        mouseY: e.clientY,
                        x: el.x,
                        y: el.y,
                        handle: 'se',
                      });
                    }}
                    className={`absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white dark:bg-neutral-900 border-2 border-blue-500 rounded-xs cursor-nwse-resize shadow-xs hover:scale-125 transition-transform z-30 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
                    }`}
                    title="Drag corner to resize"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Bottom-Right Zoom & View Controls */}
      <div className="absolute bottom-6 right-6 flex items-center gap-1 p-1 bg-white/95 dark:bg-[#1e2024]/95 backdrop-blur-md rounded-xl border border-neutral-200/90 dark:border-neutral-700 shadow-lg select-none z-30 transition-colors">
        <button
          onClick={() => onZoomChange(Math.max(0.25, zoom - 0.15))}
          className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Zoom out"
        >
          <DuotoneIcon icon={Minus} className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            onZoomChange(1.0);
            onPanChange({ x: 40, y: 40 });
          }}
          className="px-2 py-1 text-xs font-medium font-mono text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          title="Reset zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={() => onZoomChange(Math.min(2.5, zoom + 0.15))}
          className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Zoom in"
        >
          <DuotoneIcon icon={Plus} className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />

        <button
          onClick={() => {
            const visible = boardElements;
            if (visible.length === 0) {
              onPanChange({ x: 40, y: 40 });
              onZoomChange(1);
              return;
            }
            const minX = Math.min(...visible.map((el) => el.x));
            const minY = Math.min(...visible.map((el) => el.y));
            onPanChange({ x: -minX + 80, y: -minY + 80 });
            onZoomChange(0.9);
          }}
          className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Fit to content"
        >
          <DuotoneIcon icon={Maximize} className="w-4 h-4" />
        </button>
      </div>

      {/* Quick helper banner if board is blank */}
      {boardElements.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="p-6 bg-white/90 dark:bg-[#1e2024]/90 backdrop-blur-md rounded-2xl border border-neutral-200/80 dark:border-neutral-700 shadow-lg text-center max-w-sm pointer-events-auto transition-colors">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center mx-auto mb-3">
              <DuotoneIcon icon={ZoomIn} className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">Your board is empty</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-4">
              Drag tools from the left sidebar or click below to start organizing your ideas.
            </p>
            <button
              onClick={() => onAddElementAtCoords('note', 100, 100)}
              className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-lg text-xs font-medium transition-colors"
            >
              Add First Note
            </button>
          </div>
        </div>
      )}

      {/* Right-Click Context Menu */}
      {contextMenu && elements[contextMenu.elementId] && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          element={elements[contextMenu.elementId]}
          onClose={() => setContextMenu(null)}
          onCut={handleContextMenuCut}
          onCopy={handleContextMenuCopy}
          onDuplicate={handleContextMenuDuplicate}
          onDelete={handleContextMenuDelete}
          onDownloadOriginal={handleContextMenuDownloadOriginal}
          onReplaceImage={handleContextMenuReplaceImage}
          onToggleCropToGrid={handleContextMenuToggleCropToGrid}
          onToggleLock={handleContextMenuToggleLock}
          onBringToFront={handleContextMenuBringToFront}
          onSendToBack={handleContextMenuSendToBack}
        />
      )}
    </div>
  );
};
