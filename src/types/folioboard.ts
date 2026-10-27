export type ElementType =
  | 'note'
  | 'image'
  | 'link'
  | 'task'
  | 'board'
  | 'column'
  | 'color'
  | 'sketch'
  | 'file';

export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SketchStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface NoteData {
  title?: string;
  content: string;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  fontFamily?: 'sans' | 'serif' | 'mono';
  textAlign?: 'left' | 'center' | 'right';
}

export interface ImageData {
  url: string;
  caption?: string;
  alt?: string;
  aspectRatio?: number;
  cropToGrid?: boolean;
}

export interface LinkData {
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  image?: string;
  domain?: string;
}

export interface TaskData {
  title: string;
  items: TaskItem[];
}

export interface BoardData {
  title: string;
  description?: string;
  icon?: string;
  targetBoardId: string;
  color?: string;
}

export interface ColumnData {
  title: string;
  cardIds?: string[];
}

export interface ColorData {
  hex: string;
  name: string;
  category?: string;
}

export interface SketchData {
  strokes: SketchStroke[];
}

export interface FileData {
  fileName: string;
  fileSize: string;
  fileType: string;
  downloadUrl?: string;
}

export type ElementData =
  | { type: 'note'; data: NoteData }
  | { type: 'image'; data: ImageData }
  | { type: 'link'; data: LinkData }
  | { type: 'task'; data: TaskData }
  | { type: 'board'; data: BoardData }
  | { type: 'column'; data: ColumnData }
  | { type: 'color'; data: ColorData }
  | { type: 'sketch'; data: SketchData }
  | { type: 'file'; data: FileData };

export interface CanvasElement {
  id: string;
  boardId: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  color: string;
  data: any;
  createdAt: number;
  updatedAt: number;
  locked?: boolean;
}

export interface Connection {
  id: string;
  boardId: string;
  fromId: string;
  toId: string;
  fromAnchor: AnchorPosition;
  toAnchor: AnchorPosition;
  label?: string;
  color?: string;
  style: 'curved' | 'straight';
}

export interface Board {
  id: string;
  parentId: string | null;
  title: string;
  description?: string;
  createdAt: number;
}

export interface CanvasState {
  currentBoardId: string;
  boards: Record<string, Board>;
  elements: Record<string, CanvasElement>;
  connections: Record<string, Connection>;
  pan: { x: number; y: number };
  zoom: number;
  selectedElementIds: string[];
  gridSnap: boolean;
  gridVisible: boolean;
  theme: 'light' | 'dark';
}
