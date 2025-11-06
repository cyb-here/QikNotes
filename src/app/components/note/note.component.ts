import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note, CanvasSettings } from '../../models';

@Component({
  selector: 'app-note',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="note" 
      [style.left.px]="getNotePosition().left"
      [style.top.px]="getNotePosition().top"
      [style.width.px]="getNoteSize().width"
      [style.height.px]="getNoteSize().height">
      
      <div class="note-header">
        <button class="delete-btn" (click)="onDelete()">×</button>
      </div>
      
      <textarea 
        class="note-content"
        [(ngModel)]="note.content"
        (blur)="onContentChange()"
        placeholder="Start typing...">
      </textarea>
    </div>
  `,
  styles: [`
    .note {
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 8px;
      cursor: text;
      overflow: hidden;
    }
    
    .note-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 4px;
    }
    
    .delete-btn {
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .delete-btn:hover {
      background: #cc0000;
    }
    
    .note-content {
      width: 100%;
      height: calc(100% - 30px);
      border: none;
      resize: none;
      outline: none;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.4;
    }
  `]
})
export class NoteComponent {
  @Input({ required: true }) note!: Note;
  @Input({ required: true }) settings!: CanvasSettings;
  @Output() contentChanged = new EventEmitter<string>();
  @Output() delete = new EventEmitter<void>();

  getNotePosition(): { left: number, top: number } {
    return {
      left: this.note.position.gridX * this.settings.cellWidth,
      top: this.note.position.gridY * this.settings.cellHeight
    };
  }

  getNoteSize(): { width: number, height: number } {
    return {
      width: this.note.size.width * this.settings.cellWidth - 16,
      height: this.note.size.height * this.settings.cellHeight - 16
    };
  }

  onContentChange(): void {
    this.contentChanged.emit(this.note.content);
  }

  onDelete(): void {
    this.delete.emit();
  }
}