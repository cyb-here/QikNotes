import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note, CanvasSettings, GridPosition } from '../../models';

@Component({
  selector: 'app-note',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="note" 
      [class.dragging]="isDragging"
      [attr.data-note-id]="note.id"
      [style.transform]="'translate(' + (5000 + (note.position.gridX * settings.cellWidth)) + 'px, ' + (5000 + (note.position.gridY * settings.cellHeight)) + 'px)'"
      [style.width.px]="settings.cellWidth - 16"
      [style.height.px]="settings.cellHeight - 16">
      
      <!-- Drag Handle -->
      <div class="drag-handle" 
           (mousedown)="onDragStart($event)"
           (click)="$event.stopPropagation()">
        ⋮⋮
      </div>
      
      <div class="note-header">
        <button class="delete-btn" (click)="onDelete($event)">×</button>
      </div>
      
      <textarea 
        class="note-content"
        [(ngModel)]="note.content"
        (blur)="onContentChange()"
        (mousedown)="onTextAreaMouseDown($event)"
        (click)="$event.stopPropagation()"
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
      overflow: hidden;
      transition: box-shadow 0.2s, transform 0.1s ease;
      left: 0;
      top: 0;
      user-select: none;
      /* Position relative to center of notes-container */
      left: calc(5000px + (var(--note-x)));
      top: calc(5000px + (var(--note-y)));
      width: calc(var(--note-width) - 16px);
      height: calc(var(--note-height) - 16px);
      transform-origin: center center;
      will-change: transform;
      z-index: 1;
    }

    .note.dragging {
      box-shadow: 0 5px 20px rgba(0,0,0,0.3);
      z-index: 1000;
      transform: scale(1.02);
      cursor: grabbing;
    }
    
    .drag-handle {
      position: absolute;
      top: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 12px;
      background: #e0e0e0;
      border-radius: 3px;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #666;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .note:hover .drag-handle {
      opacity: 1;
    }

    .drag-handle:hover {
      background: #d0d0d0;
    }

    .note.dragging .drag-handle {
      cursor: grabbing;
      opacity: 1;
    }
    
    .note-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 4px;
      margin-top: 8px;
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
      z-index: 1001;
    }
    
    .delete-btn:hover {
      background: #cc0000;
    }
    
    .note-content {
      width: 100%;
      height: calc(100% - 40px);
      border: none;
      resize: none;
      outline: none;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.4;
      cursor: text;
      background: transparent;
      user-select: text;
    }

    .note.dragging .note-content {
      pointer-events: none;
    }

    @keyframes highlight {
      0%, 100% {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      50% {
        box-shadow: 0 4px 20px rgba(66, 133, 244, 0.5);
      }
    }

    .note.highlight {
      animation: highlight 1s ease-in-out;
      border-color: #4285f4;
    }
  `]
})
export class NoteComponent {
  @Input({ required: true }) note!: Note;
  @Input({ required: true }) settings!: CanvasSettings;
  @Output() contentChanged = new EventEmitter<string>();
  @Output() delete = new EventEmitter<void>();
  @Output() positionChanged = new EventEmitter<GridPosition>();
  @Output() dragStarted = new EventEmitter<void>();
  @Output() dragEnded = new EventEmitter<void>();

  isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private originalPosition: GridPosition = { gridX: 0, gridY: 0 };
  private hasDragged = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    // Check if we've moved enough to consider it a drag (not a click)
    const deltaX = Math.abs(event.clientX - this.dragStartX);
    const deltaY = Math.abs(event.clientY - this.dragStartY);
    
    if (deltaX > 5 || deltaY > 5) {
      this.hasDragged = true;
      event.preventDefault();
      
      const gridDeltaX = Math.round((event.clientX - this.dragStartX) / this.settings.cellWidth);
      const gridDeltaY = Math.round((event.clientY - this.dragStartY) / this.settings.cellHeight);
      
      // Update visual position during drag
      const element = this.elementRef.nativeElement;
      element.style.left = `${(this.originalPosition.gridX + gridDeltaX) * this.settings.cellWidth}px`;
      element.style.top = `${(this.originalPosition.gridY + gridDeltaY) * this.settings.cellHeight}px`;
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    
    if (this.hasDragged) {
      // Calculate final grid position
      const element = this.elementRef.nativeElement;
      const computedStyle = getComputedStyle(element);
      const left = parseInt(computedStyle.left);
      const top = parseInt(computedStyle.top);
      
      const newPosition: GridPosition = {
        gridX: Math.round(left / this.settings.cellWidth),
        gridY: Math.round(top / this.settings.cellHeight)
      };

      // Only update if position actually changed
      if (newPosition.gridX !== this.originalPosition.gridX || newPosition.gridY !== this.originalPosition.gridY) {
        this.positionChanged.emit(newPosition);
      }
      
      // Reset visual position (parent will update it)
      element.style.left = '';
      element.style.top = '';
      
      // Prevent the click event from bubbling to canvas
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Emit drag ended
    this.dragEnded.emit();
    this.hasDragged = false;
  }

  onDragStart(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.isDragging = true;
    this.hasDragged = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.originalPosition = { ...this.note.position };
    
    // Emit drag started
    this.dragStarted.emit();
  }

  onTextAreaMouseDown(event: MouseEvent): void {
    // Stop textarea mousedown from triggering drag
    event.stopPropagation();
  }

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

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit();
  }
}