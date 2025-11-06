import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note, CanvasState } from '../../models';
import { NotesService } from '../../services/notes.service';
import { CanvasService } from '../../services/canvas.service';
import { GridComponent } from '../grid/grid.component';
import { NoteComponent } from '../note/note.component';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, GridComponent, NoteComponent],
  template: `
    <div class="canvas-container">
      <!-- Toolbar -->
      <div class="toolbar">
        <button (click)="addNoteAtCenter()" class="toolbar-btn">+ Add Note</button>
        <button (click)="toggleGrid()" class="toolbar-btn">
          {{ canvasState.settings.showGrid ? 'Hide Grid' : 'Show Grid' }}
        </button>
        <span class="notes-count">Notes: {{ notes.length }}</span>
      </div>
      
      <!-- Main Canvas Area -->
      <div class="canvas-area">
        <app-grid [settings]="canvasState.settings"></app-grid>
        
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
    
    .notes-count {
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

  addNoteAtCenter(): void {
    this.notesService.createNote({ gridX: 5, gridY: 3 });
  }

  updateNoteContent(noteId: string, content: string): void {
    this.notesService.updateNote(noteId, content);
  }

  deleteNote(noteId: string): void {
    this.notesService.deleteNote(noteId);
  }

  toggleGrid(): void {
    this.canvasService.toggleGrid();
  }
}