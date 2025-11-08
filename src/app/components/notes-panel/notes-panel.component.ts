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
        <div class="header-title">
          <h2>Qik-Notes ({{ notes.length }})</h2>
          <span class="beta-badge">BETA</span>
        </div>
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

      <div class="release-notes">
        <div class="release-header" (click)="toggleReleaseNotes()">
          <div class="release-title">
            <span class="emoji">📋</span>
            <h3>Release Notes</h3>
          </div>
          <span class="toggle-icon">{{ isReleaseNotesExpanded ? '▼' : '▶' }}</span>
        </div>
        
        <div class="release-content" [class.expanded]="isReleaseNotesExpanded">
          <div class="section-header">
            <span class="emoji">✨</span>
            <h3>Features</h3>
          </div>
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-emoji">📴</span>
              <span class="feature-text"><strong>Works offline</strong> in your browser storage</span>
            </div>
            <div class="feature-item">
              <span class="feature-emoji">📐</span>
              <span class="feature-text"><strong>Flexible Notes</strong> - Auto resize while you type</span>
            </div>
            <div class="feature-item">
              <span class="feature-emoji">✍️</span>
              <span class="feature-text"><strong>Rich Text</strong> - Bold, italic, underline, font size and more</span>
            </div>
            <div class="feature-item">
              <span class="feature-emoji">💾</span>
              <span class="feature-text"><strong>Auto-Save</strong> - Notes saved automatically to browser</span>
            </div>
            <div class="feature-item">
              <span class="feature-emoji">🔍</span>
              <span class="feature-text"><strong>Search</strong> - Find notes quickly in the left panel</span>
            </div>
            <div class="feature-item">
              <span class="feature-emoji">🎨</span>
              <span class="feature-text"><strong>3 themes, 3 fonts</strong> app wide</span>
            </div>
          </div>
          
          <div class="section-header upcoming">
            <span class="emoji">🚀</span>
            <h3>Upcoming</h3>
          </div>
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-emoji">🌌</span>
              <span class="feature-text"><strong>Infinite Canvas</strong> - Pan and zoom freely (Spacebar + Drag)</span>
            </div>
            <div class="feature-item">
              <span class="feature-emoji">➕</span>
              <span class="feature-text"><strong>Quick Add</strong> - Hover over canvas to see + button</span>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <a href="https://github.com/cyb-here/QikNotes" target="_blank" rel="noopener noreferrer" class="github-button">
          <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          View on GitHub
        </a>
      </div>
    </div>
  `,
  styles: [`
    .notes-panel {
      width: 300px;
      height: 100vh;
      border-right: 1px solid;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
    }

    .panel-header {
      padding: 16px;
      border-bottom: 1px solid;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .panel-header h2 {
      margin: 0;
      font-size: 18px;
    }

    .beta-badge {
      display: inline-block;
      padding: 2px 8px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #1e1e1e;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
    }

    .search-box input {
      width: 90%;
      padding: 8px 12px;
      border: 1px solid;
      border-radius: 4px;
      font-size: 14px;
      outline: none;
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
      border: 1px solid;
      transition: all 0.2s ease;
    }

    .note-preview {
      margin: 0 0 8px 0;
      font-size: 14px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .note-meta {
      font-size: 12px;
    }

    .release-notes {
      border-top: 1px solid;
    }

    .release-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .release-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .release-title .emoji {
      font-size: 16px;
    }

    .release-title h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    .toggle-icon {
      font-size: 12px;
      transition: transform 0.2s ease;
    }

    .release-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
      padding: 0 16px;
    }

    .release-content.expanded {
      max-height: 400px;
      padding: 16px;
      overflow-y: auto;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      margin-top: 0;
    }

    .section-header.upcoming {
      margin-top: 16px;
    }

    .section-header .emoji {
      font-size: 16px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
    }

    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      border-left: 2px solid;
      transition: all 0.2s ease;
    }

    .feature-emoji {
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .feature-text {
      font-size: 11px;
      line-height: 1.4;
    }

    .feature-text strong {
      font-weight: 600;
    }

    .panel-footer {
      padding: 12px 16px;
      border-top: 1px solid;
    }

    .github-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      background: #238636;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s ease;
    }

    .github-button:hover {
      background: #2ea043;
    }

    .github-button svg {
      flex-shrink: 0;
    }

    /* Scrollbar styling */
    .notes-list::-webkit-scrollbar,
    .release-content::-webkit-scrollbar {
      width: 0px;
      display: none;
    }

    .notes-list::-webkit-scrollbar-track,
    .release-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .notes-list::-webkit-scrollbar-thumb,
    .release-content::-webkit-scrollbar-thumb {
      background: transparent;
    }

    .notes-list::-webkit-scrollbar-thumb:hover,
    .release-content::-webkit-scrollbar-thumb:hover {
      background: transparent;
    }

    /* Hide scrollbars for Firefox */
    .notes-list,
    .release-content {
      scrollbar-width: none;
    }

    /* Mobile Responsive Styles */
    @media (max-width: 768px) {
      .notes-panel {
        box-shadow: 4px 0 16px rgba(0, 0, 0, 0.2);
      }

      .panel-header h2 {
        font-size: 16px;
      }

      .search-box input {
        width: 88%;
        font-size: 13px;
      }

      .note-preview {
        font-size: 13px;
      }

      .note-meta {
        font-size: 11px;
      }
    }

    @media (max-width: 480px) {
      .notes-panel {
        width: 280px;
      }

      .panel-header {
        padding: 12px;
      }

      .panel-header h2 {
        font-size: 15px;
      }

      .beta-badge {
        font-size: 9px;
        padding: 2px 6px;
      }

      .search-box input {
        padding: 6px 10px;
        font-size: 12px;
      }

      .note-item {
        padding: 10px;
      }

      .release-header {
        padding: 10px 12px;
      }

      .release-title h3 {
        font-size: 13px;
      }

      .panel-footer {
        padding: 10px 12px;
      }

      .github-button {
        padding: 8px 12px;
        font-size: 13px;
      }
    }
  `]
})
export class NotesPanelComponent {
  @Input({ required: true }) notes: Note[] = [];
  @Input() activeNoteId: string | null = null;
  @Output() navigateToNote = new EventEmitter<Note>();

  searchText = '';
  filteredNotes: Note[] = [];
  isReleaseNotesExpanded = false;

  ngOnInit() {
    this.filteredNotes = this.notes;
  }

  ngOnChanges() {
    this.filterNotes();
  }

  toggleReleaseNotes() {
    this.isReleaseNotesExpanded = !this.isReleaseNotesExpanded;
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
    // Strip HTML tags to show plain text only
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  }

  onNoteClick(note: Note): void {
    this.navigateToNote.emit(note);
  }
}