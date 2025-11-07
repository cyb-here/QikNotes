import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CanvasState, CanvasSettings } from '../models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  private storage = inject(StorageService);
  
  private defaultState: CanvasState = {
    viewport: {
      centerX: 0,
      centerY: 0,
      zoom: 1
    },
    settings: {
      showGrid: true,
      cellWidth: 200,
      cellHeight: 150
    }
  };

  private state: CanvasState = { ...this.defaultState };
  private stateSubject = new BehaviorSubject<CanvasState>(this.state);

  constructor() {
    this.loadState();
  }

  getState(): BehaviorSubject<CanvasState> {
    return this.stateSubject;
  }

  async toggleGrid(): Promise<void> {
    this.state.settings.showGrid = !this.state.settings.showGrid;
    await this.saveAndNotify();
  }

  async zoomIn(): Promise<void> {
    this.state.viewport.zoom = Math.min(3, this.state.viewport.zoom + 0.1);
    await this.saveAndNotify();
  }

  async zoomOut(): Promise<void> {
    this.state.viewport.zoom = Math.max(0.2, this.state.viewport.zoom - 0.1);
    await this.saveAndNotify();
  }

  async resetZoom(): Promise<void> {
    this.state.viewport.zoom = 1;
    await this.saveAndNotify();
  }

  /**
   * Zoom by a multiplicative factor. Useful for smooth wheel/pinch zoom.
   */
  async zoomBy(factor: number): Promise<void> {
    const next = this.state.viewport.zoom * factor;
    this.state.viewport.zoom = Math.min(3, Math.max(0.2, next));
    await this.saveAndNotify();
  }

  private async loadState(): Promise<void> {
    try {
      const savedState = await this.storage.getCanvasState();
      if (savedState) {
        this.state = { ...this.defaultState, ...savedState };
      }
      this.stateSubject.next(this.state);
    } catch (error) {
      console.error('Failed to load canvas state:', error);
      this.stateSubject.next(this.state);
    }
  }

  private async saveAndNotify(): Promise<void> {
    try {
      await this.storage.saveCanvasState(this.state);
      this.stateSubject.next(this.state);
    } catch (error) {
      console.error('Failed to save canvas state:', error);
    }
  }
}