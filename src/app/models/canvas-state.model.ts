export interface CanvasState {
  viewport: Viewport;
  settings: CanvasSettings;
}

export interface Viewport {
  centerX: number;
  centerY: number;
  zoom: number;
}

export interface CanvasSettings {
  showGrid: boolean;
  cellWidth: number;
  cellHeight: number;
}