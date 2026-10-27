import type { CanvasState, CanvasElement, Connection } from '../types/folioboard';
import { TEMPLATES } from './templates';

const STORAGE_KEY = 'folioboard_canvas_state_v1';

export function getInitialState(): CanvasState {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem('thuli_canvas_state_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.boards && parsed.elements) {
        return {
          currentBoardId: parsed.currentBoardId || 'root',
          boards: parsed.boards,
          elements: parsed.elements,
          connections: parsed.connections || {},
          pan: parsed.pan || { x: 0, y: 0 },
          zoom: parsed.zoom || 1,
          selectedElementIds: [],
          gridSnap: parsed.gridSnap ?? true,
          gridVisible: parsed.gridVisible ?? true,
          theme: parsed.theme || 'light',
        };
      }
    }
  } catch (e) {
    console.error('Error loading state from localStorage:', e);
  }

  // Fallback to Brand Moodboard template
  const defaultTemplate = TEMPLATES.brandMoodboard;
  return {
    currentBoardId: 'root',
    boards: defaultTemplate.boards,
    elements: defaultTemplate.elements,
    connections: defaultTemplate.connections,
    pan: { x: 40, y: 40 },
    zoom: 1,
    selectedElementIds: [],
    gridSnap: true,
    gridVisible: true,
    theme: 'light',
  };
}

export function saveStateToStorage(state: CanvasState) {
  try {
    const toSave = {
      currentBoardId: state.currentBoardId,
      boards: state.boards,
      elements: state.elements,
      connections: state.connections,
      pan: state.pan,
      zoom: state.zoom,
      gridSnap: state.gridSnap,
      gridVisible: state.gridVisible,
      theme: state.theme,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function exportBoardAsJSON(state: CanvasState, boardId: string): string {
  const currentBoard = state.boards[boardId];
  const boardElements: Record<string, CanvasElement> = {};
  const boardConnections: Record<string, Connection> = {};

  Object.values(state.elements).forEach((el) => {
    if (el.boardId === boardId) {
      boardElements[el.id] = el;
    }
  });

  Object.values(state.connections).forEach((conn) => {
    if (conn.boardId === boardId) {
      boardConnections[conn.id] = conn;
    }
  });

  const payload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    board: currentBoard,
    elements: boardElements,
    connections: boardConnections,
  };

  return JSON.stringify(payload, null, 2);
}

export function exportBoardAsMarkdown(state: CanvasState, boardId: string): string {
  const currentBoard = state.boards[boardId] || { title: 'Folioboard Board' };
  let md = `# ${currentBoard.title}\n\n`;
  if (currentBoard.description) {
    md += `> ${currentBoard.description}\n\n---\n\n`;
  }

  const boardElements = Object.values(state.elements).filter((el) => el.boardId === boardId);

  // Group by type
  const notes = boardElements.filter((el) => el.type === 'note');
  const tasks = boardElements.filter((el) => el.type === 'task');
  const links = boardElements.filter((el) => el.type === 'link');
  const images = boardElements.filter((el) => el.type === 'image');
  const colors = boardElements.filter((el) => el.type === 'color');
  const boards = boardElements.filter((el) => el.type === 'board');

  if (notes.length > 0) {
    md += `## Notes & Thoughts\n\n`;
    notes.forEach((n) => {
      if (n.data?.title) md += `### ${n.data.title}\n`;
      md += `${n.data?.content || ''}\n\n`;
    });
  }

  if (tasks.length > 0) {
    md += `## Tasks & Action Items\n\n`;
    tasks.forEach((t) => {
      md += `### ${t.data?.title || 'Checklist'}\n`;
      t.data?.items?.forEach((item: any) => {
        md += `- [${item.completed ? 'x' : ' '}] ${item.text}\n`;
      });
      md += `\n`;
    });
  }

  if (links.length > 0) {
    md += `## Bookmarks & References\n\n`;
    links.forEach((l) => {
      md += `- [${l.data?.title || l.data?.url}](${l.data?.url}) - ${l.data?.description || ''}\n`;
    });
    md += `\n`;
  }

  if (colors.length > 0) {
    md += `## Color Palette\n\n`;
    colors.forEach((c) => {
      md += `- **${c.data?.name || 'Color'}**: \`${c.data?.hex}\` (${c.data?.category || 'Palette'})\n`;
    });
    md += `\n`;
  }

  if (images.length > 0) {
    md += `## Visual References\n\n`;
    images.forEach((img) => {
      md += `![${img.data?.caption || 'Image'}](${img.data?.url})\n*${img.data?.caption || ''}*\n\n`;
    });
  }

  if (boards.length > 0) {
    md += `## Nested Sub-Boards\n\n`;
    boards.forEach((b) => {
      md += `- **${b.data?.title || 'Sub-board'}**: ${b.data?.description || ''}\n`;
    });
    md += `\n`;
  }

  return md;
}
