export interface Note {
  id: string;
  position: GridPosition;
  content: string;
  size: GridSize;
  createdAt: Date;
  updatedAt: Date;
}

export interface GridPosition {
  gridX: number;
  gridY: number;
}

export interface GridSize {
  width: number;
  height: number;
}