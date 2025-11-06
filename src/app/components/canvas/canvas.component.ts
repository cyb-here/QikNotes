import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note, CanvasState, GridPosition } from '../../models';
import { NotesService } from '../../services/notes.service';
import { CanvasService } from '../../services/canvas.service';
import { GridComponent } from '../grid/grid.component';
import { NoteComponent } from '../note/note.component';
import { AddButtonComponent } from '../add-button/add-button.component';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, GridComponent, NoteComponent, AddButtonComponent],
  template: `
    <div class="canvas-container" [class.dragging]="isDraggingNote">
      <!-- Toolbar -->
      <div class="toolbar">
        <button (click)="addNoteAtCenter()" class="toolbar-btn">+ Add Note</button>
        <button (click)="toggleGrid()" class="toolbar-btn">
          {{ canvasState.settings.showGrid ? 'Hide Grid' : 'Show Grid' }}
        </button>
        <button (click)="toggleAddButtons()" class="toolbar-btn">
          {{ showAddButtons ? 'Hide + Button' : 'Show + Button' }}
        </button>
        <span class="notes-count">Notes: {{ notes.length }}</span>
        <span class="coordinates" *ngIf="mousePosition">
          X: {{ mousePosition.gridX }}, Y: {{ mousePosition.gridY }}
        </span>
        <span class="drag-status" *ngIf="isDraggingNote">🚫 Dragging</span>
      </div>
      
      <!-- Main Canvas Area -->
      <div 
        class="canvas-area"
        (mousemove)="onMouseMove($event)"
        (mousedown)="onCanvasMouseDown($event)"
        (click)="onCanvasClick($event)">
        
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
  `,
  styles: [`
    .canvas-container {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      position: relative;
      background: #f8f9fa;
    }

    .canvas-container.dragging .canvas-area {
      cursor: grabbing;
    }
    
    .toolbar {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 100;
      background: white;
      padding: 12px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
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
    
    .notes-count, .coordinates, .drag-status {
      font-size: 14px;
      color: #666;
      margin-left: 8px;
    }

    .drag-status {
      color: #ff4444;
      font-weight: bold;
    }
    
    .canvas-area {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      cursor: crosshair;
    }

    .canvas-container.dragging .canvas-area {
      cursor: grabbing;
    }
  `]
})
export class CanvasComponent implements OnInit {
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
  private canvasMouseDownTime = 0;
  private isClickFromCanvas = false;

  ngOnInit(): void {
    // Load notes
    this.notesService.getNotes().subscribe(notes => {
      this.notes = notes;
    });

    // Load canvas state
    this.canvasService.getState().subscribe(state => {
      this.canvasState = state;
    });
  }

  onMouseMove(event: MouseEvent): void {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.mousePosition = {
      gridX: Math.floor(x / this.canvasState.settings.cellWidth),
      gridY: Math.floor(y / this.canvasState.settings.cellHeight)
    };
  }

  onCanvasMouseDown(event: MouseEvent): void {
    // Only track mousedown on the actual canvas (not on notes or buttons)
    if (event.target === event.currentTarget) {
      this.canvasMouseDownTime = Date.now();
      this.isClickFromCanvas = true;
    } else {
      this.isClickFromCanvas = false;
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
    this.addNoteAtPosition({ gridX: 5, gridY: 3 });
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
}