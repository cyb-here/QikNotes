import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note } from '../../models';

@Component({
  selector: 'app-notes-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notes-panel">
      <div class="panel-header">
        <h2>Notes ({{ notes.length }})</h2>
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Search notes..." 
            [(ngModel)]="searchText"
            (input)="filterNotes()">
        </div>
      </div>

      <div class="notes-list">
        <div 
          *ngFor="let note of filteredNotes" 
          class="note-item"
          [class.active]="note.id === activeNoteId"
          (click)="onNoteClick(note)">
          <div class="note-content">
            <p class="note-preview">{{ getPreviewText(note.content) }}</p>
            <span class="note-meta">
              Position: ({{ note.position.gridX }}, {{ note.position.gridY }})
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notes-panel {
      width: 300px;
      height: 100vh;
      background: white;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
      box-shadow: 2px 0 8px rgba(0,0,0,0.1);
    }

    .panel-header {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .panel-header h2 {
      margin: 0 0 12px 0;
      font-size: 18px;
      color: #333;
    }

    .search-box input {
      width: 90%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      outline: none;
    }

    .search-box input:focus {
      border-color: #4285f4;
    }

    .notes-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .note-item {
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 8px;
      cursor: pointer;
      border: 1px solid #eee;
      transition: all 0.2s ease;
    }

    .note-item:hover {
      background: #f5f5f5;
      border-color: #ddd;
    }

    .note-item.active {
      background: #e3f2fd;
      border-color: #4285f4;
    }

    .note-preview {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #333;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .note-meta {
      font-size: 12px;
      color: #666;
    }

    /* Scrollbar styling */
    .notes-list::-webkit-scrollbar {
      width: 8px;
    }

    .notes-list::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .notes-list::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 4px;
    }

    .notes-list::-webkit-scrollbar-thumb:hover {
      background: #bbb;
    }
  `]
})
export class NotesPanelComponent {
  @Input({ required: true }) notes: Note[] = [];
  @Input() activeNoteId: string | null = null;
  @Output() navigateToNote = new EventEmitter<Note>();

  searchText = '';
  filteredNotes: Note[] = [];

  ngOnInit() {
    this.filteredNotes = this.notes;
  }

  ngOnChanges() {
    this.filterNotes();
  }

  filterNotes() {
    if (!this.searchText) {
      this.filteredNotes = [...this.notes].sort((a, b) => 
        b.updatedAt.getTime() - a.updatedAt.getTime()
      );
      return;
    }

    const searchLower = this.searchText.toLowerCase();
    this.filteredNotes = this.notes
      .filter(note => note.content.toLowerCase().includes(searchLower))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getPreviewText(content: string): string {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }

  onNoteClick(note: Note): void {
    this.navigateToNote.emit(note);
  }
}