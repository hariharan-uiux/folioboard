import React, { useRef, useState, useEffect } from 'react';
import type { CanvasElement, SketchStroke } from '../../types/milanote';
import { RotateCcw, PenTool } from 'lucide-react';

interface SketchElementProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  isSelected: boolean;
}

const PEN_COLORS = ['#2d3748', '#ffffff', '#e29578', '#83c5be', '#3b82f6', '#ef4444'];

export const SketchElement: React.FC<SketchElementProps> = ({ element, onUpdate }) => {
  const data = element.data || { strokes: [] };
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(PEN_COLORS[0]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);

  const strokes: SketchStroke[] = data.strokes || [];

  // Redraw canvas on stroke update or resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width || 2;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    if (currentStroke.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2.5;
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke, currentColor]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    setCurrentStroke([coords]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.stopPropagation();
    const coords = getCanvasCoords(e);
    setCurrentStroke((prev) => [...prev, coords]);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.stopPropagation();
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      const newStroke: SketchStroke = {
        color: currentColor,
        width: 2.5,
        points: currentStroke,
      };
      onUpdate(element.id, {
        data: { ...data, strokes: [...strokes, newStroke] },
      });
    }
    setCurrentStroke([]);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(element.id, {
      data: { ...data, strokes: [] },
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#1e2024] rounded-lg overflow-hidden border border-neutral-200/90 dark:border-neutral-700/80 shadow-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50/80 dark:bg-neutral-800/80 border-b border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-200">Doodle / Sketch</span>
        </div>
        <div className="flex items-center gap-1.5">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setCurrentColor(c)}
              className={`w-3.5 h-3.5 rounded-full border ${
                currentColor === c
                  ? 'ring-2 ring-neutral-400 dark:ring-white scale-110'
                  : 'border-black/10 dark:border-white/20'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            onClick={handleClear}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 ml-1"
            title="Clear drawing"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 bg-white dark:bg-[#15171a] cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={element.width || 280}
          height={Math.max((element.height || 220) - 40, 140)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};
