import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note, CanvasState, GridPosition } from '../../models';
import { NotesService } from '../../services/notes.service';
import { CanvasService } from '../../services/canvas.service';
import { GridComponent } from '../grid/grid.component';
import { NoteComponent } from '../note/note.component';
import { AddButtonComponent } from '../add-button/add-button.component';
import { NotesPanelComponent } from '../notes-panel/notes-panel.component';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, GridComponent, NoteComponent, AddButtonComponent, NotesPanelComponent],
  template: `
    <div class="canvas-container" [class.dragging]="isDraggingNote">
      <!-- Notes Panel -->
      <app-notes-panel
        [notes]="notes"
        [activeNoteId]="activeNoteId"
        (navigateToNote)="navigateToNote($event)">
      </app-notes-panel>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-group">
          <button (click)="addNoteAtCenter()" class="toolbar-btn primary">+ Add Note</button>
          <button (click)="toggleAddButtons()" class="toolbar-btn">
            {{ showAddButtons ? '✓ Quick Add' : '+ Quick Add' }}
          </button>
        </div>
        <div class="toolbar-group">
          <button (click)="toggleGrid()" class="toolbar-btn">
            {{ canvasState.settings.showGrid ? '✓ Grid' : 'Grid' }}
          </button>
          <button (click)="resetView()" class="toolbar-btn" title="Center and reset canvas position">
            Reset View
          </button>
          <button (click)="deleteAllNotes()" class="toolbar-btn danger" title="Delete all notes">Delete All</button>
        </div>
        <div class="zoom-controls toolbar-group">
          <button (click)="zoomOut()" class="toolbar-btn" title="Zoom Out (Ctrl + -)">−</button>
          <button (click)="resetZoom()" class="toolbar-btn" title="Reset Zoom (Ctrl + 0)">
            {{ (canvasState.viewport.zoom * 100).toFixed(0) }}%
          </button>
          <button (click)="zoomIn()" class="toolbar-btn" title="Zoom In (Ctrl + +)">+</button>
        </div>
        <div class="toolbar-info">
          <span class="notes-count" title="Total notes">📝 {{ notes.length }}</span>
          <span class="coordinates" *ngIf="mousePosition">
            ({{ mousePosition.gridX }}, {{ mousePosition.gridY }})
          </span>
        </div>
        <span class="drag-status" *ngIf="isDraggingNote">🚫 Dragging</span>
      </div>
      
      <!-- Canvas Wrapper -->
      <div class="canvas-wrapper">
        <!-- Main Canvas Area -->
        <div 
          class="canvas-area"
          [style.--zoom-level]="canvasState.viewport.zoom"
          [style.--offset-x.px]="canvasOffset.x"
          [style.--offset-y.px]="canvasOffset.y"
          (wheel)="onCanvasWheel($event)"
          (mousemove)="onMouseMove($event)"
          (mousedown)="onCanvasMouseDown($event)"
          (click)="onCanvasClick($event)">
          
          <!-- Centered Container -->
          <div class="notes-container">
            <app-grid [settings]="canvasState.settings"></app-grid>
            <!-- Single Add Button at Mouse Position -->
            <app-add-button
              *ngIf="showAddButtons && mousePosition && !isDraggingNote && !isPositionOccupied(mousePosition)"
              [position]="mousePosition"
              [cellWidth]="canvasState.settings.cellWidth"
              [cellHeight]="canvasState.settings.cellHeight"
              (addNote)="onAddButtonClick($event)">
            </app-add-button>
            
            <!-- Notes -->
            <app-note 
              *ngFor="let note of notes"
              [note]="note"
              [settings]="canvasState.settings"
              (contentChanged)="updateNoteContent(note.id, $event)"
              (positionChanged)="updateNotePosition(note.id, $event)"
              (delete)="deleteNote(note.id)"
              (dragStarted)="onNoteDragStart()"
              (dragEnded)="onNoteDragEnd()">
            </app-note>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .canvas-container {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      position: relative;
      background: #f8f9fa;
      padding-left: 300px; /* Make room for notes panel */
    }

    .canvas-container.dragging {
      cursor: grabbing !important;
    }

    .canvas-area {
      width: 10000px;
      height: 10000px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform-origin: center center;
      cursor: grab;
      transform: translate(-50%, -50%) 
                translate(var(--offset-x, 0px), var(--offset-y, 0px))
                scale(var(--zoom-level, 1));
      transition: transform 0.1s ease;
    }

    .canvas-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
    }
    
    .toolbar {
      position: fixed;
      top: 20px;
      left: calc(50% + 150px); /* Offset by half the panel width */
      transform: translateX(-50%);
      z-index: 1000;
      background: white;
      padding: 12px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 12px;
      backdrop-filter: blur(8px);
      background-color: rgba(255, 255, 255, 0.9);
    }
    
    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      border-left: 1px solid #ddd;
      border-right: 1px solid #ddd;
    }

    .toolbar-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .toolbar-btn:hover {
      background: #f5f5f5;
      border-color: #ccc;
    }

    .toolbar-btn.primary {
      background: #007bff;
      color: white;
      border-color: #0056b3;
    }

    .toolbar-btn.danger {
      background: #dc3545;
      color: white;
      border-color: #b21f2d;
    }

    .toolbar-btn.primary:hover {
      background: #0056b3;
    }

    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      border-right: 1px solid #eee;
    }

    .toolbar-group:last-child {
      border-right: none;
    }

    .toolbar-info {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      color: #666;
    }
    
    .notes-count, .coordinates, .drag-status {
      font-size: 14px;
      color: #666;
      white-space: nowrap;
    }

    .drag-status {
      color: #ff4444;
      font-weight: bold;
    }
    
    .canvas-area {
      position: absolute;
      width: 20000px;
      height: 20000px;
      top: 50%;
      left: 50%;
      transform-origin: center;
      cursor: default;
      will-change: transform;
      transform: translate(calc(-50% + var(--offset-x, 0px)), 
                         calc(-50% + var(--offset-y, 0px))) 
                 scale(var(--zoom-level, 1));
      /* Center content in the canvas */
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Create a centered container for notes */
    .notes-container {
      position: absolute;
      width: 10000px;
      height: 10000px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .canvas-container.dragging .canvas-area {
      cursor: grabbing;
      transition: none !important;
    }

    .canvas-area:not(.dragging) {
      transition: transform 0.1s ease-out;
    }
  `]
})
export class CanvasComponent implements OnInit, OnDestroy {
  // bound wheel handler for global listening (prevents page zoom outside canvas)
  private boundGlobalWheelHandler: ((e: WheelEvent) => void) | null = null;
  private notesService = inject(NotesService);
  private canvasService = inject(CanvasService);

  notes: Note[] = [];
  canvasState: CanvasState = {
    viewport: { centerX: 0, centerY: 0, zoom: 1 },
    settings: { showGrid: true, cellWidth: 200, cellHeight: 150 }
  };

  showAddButtons = true;
  mousePosition: GridPosition | null = null;
  isDraggingNote = false;
  isDraggingCanvas = false;
  isSpacePressed = false;
  canvasOffset = { x: 0, y: 0 };
  activeNoteId: string | null = null;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private canvasMouseDownTime = 0;
  private isClickFromCanvas = false;
  private potentialCanvasPan = false;

  private updateCanvasPosition(): void {
    // No need for explicit update since we're using CSS variables
    // This method exists to maintain clean architecture
  }

  async resetView(): Promise<void> {
    // Reset canvas position
    this.canvasOffset = { x: 0, y: 0 };
    
    // Reset zoom to default
    await this.resetZoom();
    
    // Update the canvas position
    this.updateCanvasPosition();
  }

  @HostListener('window:keydown', ['$event'])
  async onKeyPress(event: KeyboardEvent): Promise<void> {
    // Check if Ctrl/Cmd key is pressed
    if (event.ctrlKey || event.metaKey) {
      switch(event.key) {
        case '=':
        case '+':
          event.preventDefault();
          await this.zoomIn();
          break;
        case '-':
          event.preventDefault();
          await this.zoomOut();
          break;
        case '0':
          event.preventDefault();
          await this.resetZoom();
          break;
      }
    }
    
    // Handle spacebar for canvas dragging
    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault();
      this.isSpacePressed = true;
      if (!this.isDraggingCanvas) {
        document.body.style.cursor = 'grab';
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      event.preventDefault();
      this.isSpacePressed = false;
      if (!this.isDraggingCanvas) {
        document.body.style.cursor = 'default';
      }
    }
  }

  @HostListener('window:mouseup', ['$event'])
  onGlobalMouseUp(event: MouseEvent): void {
    if (this.isDraggingCanvas) {
      this.isDraggingCanvas = false;
      document.body.style.cursor = 'default';
      event.preventDefault();
      event.stopPropagation();
    }
    // If we were in a potential pan (left-button down on canvas), clear it on mouse up
    this.potentialCanvasPan = false;
  }

  @HostListener('window:mousemove', ['$event'])
  onGlobalMouseMove(event: MouseEvent): void {
    if (this.isDraggingCanvas) {
      event.preventDefault();
      event.stopPropagation();

      const dx = event.clientX - this.lastMouseX;
      const dy = event.clientY - this.lastMouseY;

      this.canvasOffset.x += dx;
      this.canvasOffset.y += dy;

      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      return;
    }

    // If the left mouse was pressed on the canvas and user moved a bit, start panning
    if (this.potentialCanvasPan) {
      const dx = event.clientX - this.lastMouseX;
      const dy = event.clientY - this.lastMouseY;
      // small threshold to avoid accidental pans on clicks
      if (Math.abs(dx) + Math.abs(dy) > 6) {
        this.isDraggingCanvas = true;
        document.body.style.cursor = 'grabbing';
        // reset last positions so the first movement doesn't jump
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
      }
    }
  }

  calculateGridPosition(clientX: number, clientY: number, rect: DOMRect): GridPosition {
    // Calculate position relative to the canvas center (5000, 5000)
    const x = (clientX - rect.left - this.canvasOffset.x) / this.canvasState.viewport.zoom;
    const y = (clientY - rect.top - this.canvasOffset.y) / this.canvasState.viewport.zoom;

    // Convert to grid coordinates
    return {
      gridX: Math.floor(x / this.canvasState.settings.cellWidth) - 25, // Center is at (0,0)
      gridY: Math.floor(y / this.canvasState.settings.cellHeight) - 25
    };
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDraggingCanvas) {
      return;
    }

    const canvas = event.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    this.mousePosition = this.calculateGridPosition(event.clientX, event.clientY, rect);
  }

  ngOnInit(): void {
    // Load notes
    this.notesService.getNotes().subscribe(notes => {
      this.notes = notes;
    });

    // Load canvas state
    this.canvasService.getState().subscribe(state => {
      this.canvasState = state;
    });

    // Prevent global pinch/ctrl-wheel zoom from affecting the entire app
    // except when the pointer is over the canvas area. We use a non-passive
    // listener so we can call preventDefault().
    this.boundGlobalWheelHandler = (e: WheelEvent) => {
      try {
        if (e.ctrlKey || e.metaKey) {
          const canvasEl = document.querySelector('.canvas-area');
          if (canvasEl && !(canvasEl as HTMLElement).contains(e.target as Node)) {
            // Prevent browser-level zoom when the gesture is not on canvas
            e.preventDefault();
          }
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('wheel', this.boundGlobalWheelHandler as EventListener, { passive: false });
  }

  ngOnDestroy(): void {
    if (this.boundGlobalWheelHandler) {
      window.removeEventListener('wheel', this.boundGlobalWheelHandler as EventListener);
      this.boundGlobalWheelHandler = null;
    }
  }

  onCanvasWheel(event: WheelEvent): void {
    // Always prevent page/viewport zoom/scroll when wheel happens on canvas
    event.preventDefault();
    event.stopPropagation();
    // Distinguish between pinch-to-zoom (ctrl/meta + wheel) and two-finger
    // scroll (pan). Many touchpads emit wheel events for both gestures.
    const isPinch = event.ctrlKey || event.metaKey;

    // Normalize delta depending on deltaMode (0=pixel,1=line,2=page)
    let dx = event.deltaX;
    let dy = event.deltaY;
    if (event.deltaMode === 1) { // lines
      dx *= 16;
      dy *= 16;
    } else if (event.deltaMode === 2) { // pages
      dx *= window.innerHeight;
      dy *= window.innerHeight;
    }

    if (isPinch) {
      // Use an exponential mapping for smooth zooming
      const factor = Math.exp(-dy * 0.002);
      this.canvasService.zoomBy(factor).catch(err => console.error('Zoom failed', err));
    } else {
      // Treat as pan (two-finger scroll). Invert deltas so the content moves
      // with the fingers. Scale by 1/zoom so panning feels consistent at different zooms.
      const scale = 1 / Math.max(0.1, this.canvasState.viewport.zoom);
      this.canvasOffset.x -= dx * scale;
      this.canvasOffset.y -= dy * scale;
    }
  }

  async zoomIn(): Promise<void> {
    await this.canvasService.zoomIn();
  }

  async zoomOut(): Promise<void> {
    await this.canvasService.zoomOut();
  }

  async resetZoom(): Promise<void> {
    await this.canvasService.resetZoom();
  }

  onCanvasMouseDown(event: MouseEvent): void {
    // Handle middle mouse button or left click + space for canvas dragging
    if (event.button === 1 || (event.button === 0 && this.isSpacePressed)) {
      event.preventDefault();
      event.stopPropagation();
      
      // Only start dragging if clicking on the canvas itself
      if (event.target === event.currentTarget) {
        this.isDraggingCanvas = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        document.body.style.cursor = 'grabbing';
      }
      return;
    }

    // Only track mousedown on the actual canvas (not on notes or buttons)
    if (event.target === event.currentTarget) {
      // record time for click detection
      this.canvasMouseDownTime = Date.now();
      this.isClickFromCanvas = true;
      // prepare for potential left-button pan: wait for small movement to start panning
      if (event.button === 0) {
        this.potentialCanvasPan = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
      }
    } else {
      this.isClickFromCanvas = false;
      this.potentialCanvasPan = false;
    }
  }

  onCanvasClick(event: MouseEvent): void {
    // Only create note if:
    // 1. Clicking on empty canvas (not on notes or buttons)
    // 2. Not currently dragging a note
    // 3. The mousedown originated from the canvas
    // 4. It was a quick click (not part of a drag operation)
    const clickDuration = Date.now() - this.canvasMouseDownTime;
    
    if (event.target === event.currentTarget && 
        this.mousePosition && 
        !this.isDraggingNote && 
    this.isClickFromCanvas &&
    !this.isDraggingCanvas &&
        clickDuration < 200) {
      
      this.addNoteAtPosition(this.mousePosition);
    }
    
    this.isClickFromCanvas = false;
  }

  onAddButtonClick(position: GridPosition): void {
    console.log('🎯 Add button clicked! Creating note at:', position);
    this.addNoteAtPosition(position);
  }

  isPositionOccupied(position: GridPosition): boolean {
    return this.notes.some(note => 
      note.position.gridX === position.gridX && 
      note.position.gridY === position.gridY
    );
  }

  addNoteAtCenter(): void {
    // Add note at the center of the grid (0,0)
    this.addNoteAtPosition({ gridX: 0, gridY: 0 });
  }

  addNoteAtPosition(position: GridPosition): void {
    console.log('Creating note at position:', position);
    this.notesService.createNote(position).then(note => {
      console.log('Note created successfully:', note);
    }).catch(error => {
      console.error('Error creating note:', error);
    });
  }

  updateNoteContent(noteId: string, content: string): void {
    this.notesService.updateNote(noteId, content).catch(error => {
      console.error('Error updating note:', error);
    });
  }

  updateNotePosition(noteId: string, newPosition: GridPosition): void {
    this.notesService.updateNotePosition(noteId, newPosition).catch(error => {
      console.error('Error updating note position:', error);
    });
  }

  deleteNote(noteId: string): void {
    this.notesService.deleteNote(noteId).catch(error => {
      console.error('Error deleting note:', error);
    });
  }

  async deleteAllNotes(): Promise<void> {
    const ok = window.confirm('Delete ALL notes? This cannot be undone.');
    if (!ok) return;

    try {
      await this.notesService.deleteAllNotes();
      this.activeNoteId = null;
      console.log('All notes removed from canvas');
    } catch (error) {
      console.error('Failed to delete all notes:', error);
    }
  }

  toggleGrid(): void {
    this.canvasService.toggleGrid();
  }

  toggleAddButtons(): void {
    this.showAddButtons = !this.showAddButtons;
    console.log('Add button toggled. Now visible:', this.showAddButtons);
  }

  onNoteDragStart(): void {
    this.isDraggingNote = true;
  }

  onNoteDragEnd(): void {
    setTimeout(() => {
      this.isDraggingNote = false;
    }, 50);
  }

  navigateToNote(note: Note): void {
    this.activeNoteId = note.id;
    
    // Calculate the target position
    const targetX = 5000 + (note.position.gridX * this.canvasState.settings.cellWidth);
    const targetY = 5000 + (note.position.gridY * this.canvasState.settings.cellHeight);
    
    // Center the note by setting the canvas offset
    this.canvasOffset.x = -targetX + window.innerWidth / 2;
    this.canvasOffset.y = -targetY + window.innerHeight / 2;
    
    // Highlight effect
    const noteElement = document.querySelector(`[data-note-id="${note.id}"]`) as HTMLElement;
    if (noteElement) {
      noteElement.classList.add('highlight');
      setTimeout(() => noteElement.classList.remove('highlight'), 2000);
    }
  }
}