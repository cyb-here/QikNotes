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
    <div class="canvas-container">
      <!-- Toolbar -->
      <div class="toolbar">
        <button (click)="addNoteAtCenter()" class="toolbar-btn">+ Add Note</button>
        <button (click)="toggleGrid()" class="toolbar-btn">
          {{ canvasState.settings.showGrid ? 'Hide Grid' : 'Show Grid' }}
        </button>
        <button (click)="toggleAddButtons()" class="toolbar-btn">
          {{ showAddButtons ? 'Hide + Buttons' : 'Show + Buttons' }}
        </button>
        <span class="notes-count">Notes: {{ notes.length }}</span>
        <span class="coordinates" *ngIf="mousePosition">
          X: {{ mousePosition.gridX }}, Y: {{ mousePosition.gridY }}
        </span>
      </div>
      
      <!-- Main Canvas Area -->
      <div 
        class="canvas-area"
        (mousemove)="onMouseMove($event)"
        (click)="onCanvasClick($event)">
        
        <app-grid [settings]="canvasState.settings"></app-grid>
        
        <!-- Contextual Add Buttons -->
        <app-add-button
          *ngFor="let position of getVisibleAddButtonPositions()"
          [position]="position"
          [cellWidth]="canvasState.settings.cellWidth"
          [cellHeight]="canvasState.settings.cellHeight"
          (addNote)="addNoteAtPosition($event)">
        </app-add-button>
        
        <!-- Notes -->
        <app-note 
          *ngFor="let note of notes"
          [note]="note"
          [settings]="canvasState.settings"
          (contentChanged)="updateNoteContent(note.id, $event)"
          (delete)="deleteNote(note.id)">
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
    
    .notes-count, .coordinates {
      font-size: 14px;
      color: #666;
      margin-left: 8px;
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

  onCanvasClick(event: MouseEvent): void {
    // If clicking on empty canvas (not a note or button), show add button at that position
    if (event.target === event.currentTarget && this.mousePosition) {
      this.addNoteAtPosition(this.mousePosition);
    }
  }

  getVisibleAddButtonPositions(): GridPosition[] {
    if (!this.showAddButtons || !this.mousePosition) return [];

    // Show add buttons around the mouse position
    const positions: GridPosition[] = [];
    const range = 2;

    for (let x = -range; x <= range; x++) {
      for (let y = -range; y <= range; y++) {
        const pos: GridPosition = {
          gridX: this.mousePosition.gridX + x,
          gridY: this.mousePosition.gridY + y
        };

        // Only show if no note exists at this position
        if (!this.isPositionOccupied(pos)) {
          positions.push(pos);
        }
      }
    }

    return positions;
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
    this.notesService.createNote(position).then(note => {
      console.log('Note created at position:', position);
    }).catch(error => {
      console.error('Error creating note:', error);
    });
  }

  updateNoteContent(noteId: string, content: string): void {
    this.notesService.updateNote(noteId, content).catch(error => {
      console.error('Error updating note:', error);
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
  }
}