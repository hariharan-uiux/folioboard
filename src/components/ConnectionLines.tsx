import React from 'react';
import type { Connection, CanvasElement, AnchorPosition } from '../types/milanote';
import { X } from 'lucide-react';

interface ConnectionLinesProps {
  connections: Record<string, Connection>;
  elements: Record<string, CanvasElement>;
  currentBoardId: string;
  onDeleteConnection: (id: string) => void;
  onUpdateConnectionLabel?: (id: string, label: string) => void;
  activeConnecting?: {
    fromId: string;
    fromAnchor: AnchorPosition;
    currentPoint: { x: number; y: number };
  } | null;
}

export function getAnchorPoint(el: CanvasElement, anchor: AnchorPosition): { x: number; y: number } {
  const { x, y, width, height } = el;
  switch (anchor) {
    case 'top':
      return { x: x + width / 2, y };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
    case 'right':
      return { x: x + width, y: y + height / 2 };
  }
}

function getBezierPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  anchor1: AnchorPosition,
  anchor2: AnchorPosition
): string {
  const dx = Math.abs(p2.x - p1.x) * 0.5;
  const dy = Math.abs(p2.y - p1.y) * 0.5;

  let cp1 = { ...p1 };
  let cp2 = { ...p2 };

  switch (anchor1) {
    case 'right':
      cp1.x += Math.max(dx, 40);
      break;
    case 'left':
      cp1.x -= Math.max(dx, 40);
      break;
    case 'bottom':
      cp1.y += Math.max(dy, 40);
      break;
    case 'top':
      cp1.y -= Math.max(dy, 40);
      break;
  }

  switch (anchor2) {
    case 'right':
      cp2.x += Math.max(dx, 40);
      break;
    case 'left':
      cp2.x -= Math.max(dx, 40);
      break;
    case 'bottom':
      cp2.y += Math.max(dy, 40);
      break;
    case 'top':
      cp2.y -= Math.max(dy, 40);
      break;
  }

  return `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  connections,
  elements,
  currentBoardId,
  onDeleteConnection,
  onUpdateConnectionLabel,
  activeConnecting,
}) => {
  const boardConnections = Object.values(connections).filter(
    (conn) => conn.boardId === currentBoardId
  );

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
      <defs>
        <marker
          id="arrow-end"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
        </marker>
        <marker
          id="arrow-end-active"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3b82f6" />
        </marker>
      </defs>

      {boardConnections.map((conn) => {
        const fromEl = elements[conn.fromId];
        const toEl = elements[conn.toId];
        if (!fromEl || !toEl) return null;

        const p1 = getAnchorPoint(fromEl, conn.fromAnchor);
        const p2 = getAnchorPoint(toEl, conn.toAnchor);
        const path = getBezierPath(p1, p2, conn.fromAnchor, conn.toAnchor);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        return (
          <g key={conn.id} className="group pointer-events-auto cursor-pointer">
            {/* Wider invisible stroke for easy clicking */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth="18"
              className="pointer-events-stroke"
              onClick={() => onDeleteConnection(conn.id)}
            />
            {/* Visible connector line */}
            <path
              d={path}
              fill="none"
              stroke={conn.color || '#94a3b8'}
              strokeWidth="2"
              strokeDasharray={conn.style === 'straight' ? '4 4' : 'none'}
              markerEnd="url(#arrow-end)"
              className="transition-colors group-hover:stroke-blue-500"
            />

            {/* Label or Delete pill at midpoint */}
            <foreignObject
              x={midX - 50}
              y={midY - 14}
              width="100"
              height="28"
              className="overflow-visible pointer-events-auto"
            >
              <div className="flex items-center justify-center">
                {conn.label ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 border border-neutral-200 shadow-2xs text-[10px] font-medium text-neutral-600 group-hover:border-blue-400 backdrop-blur-xs">
                    <input
                      type="text"
                      value={conn.label}
                      onChange={(e) => onUpdateConnectionLabel?.(conn.id, e.target.value)}
                      className="bg-transparent text-center outline-none w-14 truncate"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={() => onDeleteConnection(conn.id)}
                      className="text-neutral-400 hover:text-red-500 transition-colors ml-0.5"
                      title="Delete connection"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onDeleteConnection(conn.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white border border-neutral-200 rounded-full text-neutral-400 hover:text-red-500 shadow-2xs"
                    title="Remove link"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </foreignObject>
          </g>
        );
      })}

      {/* Live drawing connection */}
      {activeConnecting && elements[activeConnecting.fromId] && (
        (() => {
          const fromEl = elements[activeConnecting.fromId];
          const p1 = getAnchorPoint(fromEl, activeConnecting.fromAnchor);
          const p2 = activeConnecting.currentPoint;
          const path = `M ${p1.x} ${p1.y} C ${p1.x + 60} ${p1.y}, ${p2.x - 60} ${p2.y}, ${p2.x} ${p2.y}`;

          return (
            <path
              d={path}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              markerEnd="url(#arrow-end-active)"
            />
          );
        })()
      )}
    </svg>
  );
};
