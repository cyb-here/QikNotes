import { Component, Input, Output, EventEmitter, ElementRef, HostListener, ViewChild, AfterViewInit } from '@angular/core';
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
      [style.width.px]="(note.size.width * settings.cellWidth) - 16"
      [style.height.px]="(note.size.height * settings.cellHeight) - 16">
      
      <!-- Drag Handle -->
      <div class="drag-handle" 
           (mousedown)="onDragStart($event)"
           (click)="$event.stopPropagation()">
        ⋮⋮
      </div>
      
      <div class="note-header">
        <button class="delete-btn" (click)="onDelete($event)">×</button>
      </div>
      
      <div 
        #contentEditable
        class="note-content"
        contenteditable="true"
        (input)="onContentInput()"
        (blur)="onContentChange()"
        (mousedown)="onTextAreaMouseDown($event)"
        (click)="$event.stopPropagation()"
        data-placeholder="Start typing...">
      </div>
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
      transition: box-shadow 0.2s;
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
      cursor: grabbing;
      transition: none;
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
      overflow: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .note-content[data-placeholder]:empty:before {
      content: attr(data-placeholder);
      color: #999;
      cursor: text;
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
export class NoteComponent implements AfterViewInit {
  @Input({ required: true }) note!: Note;
  @Input({ required: true }) settings!: CanvasSettings;
  @Input() zoom: number = 1; // Current zoom level from canvas
  @Output() contentChanged = new EventEmitter<string>();
  @Output() delete = new EventEmitter<void>();
  @Output() positionChanged = new EventEmitter<GridPosition>();
  @Output() sizeChanged = new EventEmitter<{ width: number; height: number }>();
  @Output() dragStarted = new EventEmitter<void>();
  @Output() dragEnded = new EventEmitter<void>();
  @Output() dragMove = new EventEmitter<{ gridX: number; gridY: number; width: number; height: number }>();
  
  @ViewChild('contentEditable') contentEditable!: ElementRef<HTMLDivElement>;

  isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private originalPosition: GridPosition = { gridX: 0, gridY: 0 };
  private hasDragged = false;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    // Set initial content in the contenteditable div
    if (this.contentEditable && this.note.content) {
      this.contentEditable.nativeElement.innerHTML = this.note.content;
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    // Check if we've moved enough to consider it a drag (not a click)
    const deltaX = Math.abs(event.clientX - this.dragStartX);
    const deltaY = Math.abs(event.clientY - this.dragStartY);
    
    if (deltaX > 5 || deltaY > 5) {
      this.hasDragged = true;
      event.preventDefault();
      
      // Calculate pixel delta (smooth movement) - scale by zoom
      const pixelDeltaX = (event.clientX - this.dragStartX) / this.zoom;
      const pixelDeltaY = (event.clientY - this.dragStartY) / this.zoom;
      
      // Calculate grid position for overlap detection (rounded)
      const gridDeltaX = Math.round(pixelDeltaX / this.settings.cellWidth);
      const gridDeltaY = Math.round(pixelDeltaY / this.settings.cellHeight);
      
      // Emit current drag position for overlap detection
      const currentGridX = this.originalPosition.gridX + gridDeltaX;
      const currentGridY = this.originalPosition.gridY + gridDeltaY;
      this.dragMove.emit({
        gridX: currentGridX,
        gridY: currentGridY,
        width: this.note.size.width,
        height: this.note.size.height
      });
      
      // Update visual position during drag using smooth pixel movement
      const noteElement = this.elementRef.nativeElement.querySelector('.note') as HTMLElement;
      if (noteElement) {
        const baseX = 5000 + (this.originalPosition.gridX * this.settings.cellWidth);
        const baseY = 5000 + (this.originalPosition.gridY * this.settings.cellHeight);
        const translateX = baseX + pixelDeltaX;
        const translateY = baseY + pixelDeltaY;
        noteElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(1.02)`;
      }
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    
    if (this.hasDragged) {
      // Calculate final grid position from the current transform
      const noteElement = this.elementRef.nativeElement.querySelector('.note') as HTMLElement;
      if (noteElement) {
        const transform = noteElement.style.transform;
        
        // Parse the translate values from the transform
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (match) {
          const translateX = parseFloat(match[1]);
          const translateY = parseFloat(match[2]);
          
          const newPosition: GridPosition = {
            gridX: Math.round((translateX - 5000) / this.settings.cellWidth),
            gridY: Math.round((translateY - 5000) / this.settings.cellHeight)
          };

          // Only update if position actually changed
          if (newPosition.gridX !== this.originalPosition.gridX || newPosition.gridY !== this.originalPosition.gridY) {
            this.positionChanged.emit(newPosition);
          }
        }
        
        // Reset transform (parent will update it)
        noteElement.style.transform = '';
      }
      
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
    
    // Set initial transform position BEFORE setting isDragging to true
    const noteElement = this.elementRef.nativeElement.querySelector('.note') as HTMLElement;
    if (noteElement) {
      const translateX = 5000 + (this.note.position.gridX * this.settings.cellWidth);
      const translateY = 5000 + (this.note.position.gridY * this.settings.cellHeight);
      noteElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(1.02)`;
    }
    
    // Now set isDragging after the transform is already in place
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

  onContentInput(): void {
    if (!this.contentEditable) return;
    
    const contentDiv = this.contentEditable.nativeElement;
    const noteElement = this.elementRef.nativeElement.querySelector('.note') as HTMLElement;
    
    if (!noteElement) return;
    
    // Update note content from contenteditable
    this.note.content = contentDiv.innerHTML;
    
    // Use requestAnimationFrame to ensure DOM has updated before measuring
    requestAnimationFrame(() => {
      this.calculateAndEmitSize(contentDiv);
    });
  }

  private calculateAndEmitSize(contentDiv: HTMLDivElement): void {
    // Calculate required dimensions based on content
    const minWidth = 1; // Minimum 1 grid unit
    const minHeight = 1; // Minimum 1 grid unit
    
    // Save current height and temporarily set to auto to get natural height
    const currentHeight = contentDiv.style.height;
    contentDiv.style.height = 'auto';
    
    // Force reflow
    void contentDiv.offsetHeight;
    
    // Calculate height based on natural scrollHeight
    const naturalHeight = contentDiv.scrollHeight;
    
    // Restore original height
    contentDiv.style.height = currentHeight;
    
    const requiredHeight = (naturalHeight + 50) / this.settings.cellHeight;
    const newHeight = Math.max(minHeight, Math.ceil(requiredHeight * 2) / 2); // Round to 0.5 units
    
    // Calculate width by checking content width
    const textContent = contentDiv.textContent || '';
    
    // If content is empty or only whitespace, set to minimum width
    if (!textContent.trim()) {
      const minimalSize = { width: minWidth, height: Math.max(minHeight, newHeight) };
      if (minimalSize.width !== this.note.size.width || minimalSize.height !== this.note.size.height) {
        console.log('Empty content - shrinking to minimum:', minimalSize);
        this.sizeChanged.emit(minimalSize);
      }
      return;
    }
    
    const lines = textContent.split('\n');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = window.getComputedStyle(contentDiv).font;
      
      let maxLineWidth = 0;
      for (const line of lines) {
        // Measure each line, including empty lines
        const metrics = context.measureText(line || ' '); // Use space for empty lines
        if (metrics.width > maxLineWidth) {
          maxLineWidth = metrics.width;
        }
      }
      
      // Add padding for borders and padding (30px)
      const requiredWidth = (maxLineWidth + 30) / this.settings.cellWidth;
      const newWidth = Math.max(minWidth, Math.ceil(requiredWidth * 2) / 2); // Round to 0.5 units
      
      // Log size calculations for debugging
      console.log('Size calculation:', {
        textLength: textContent.length,
        lines: lines.length,
        maxLineWidth,
        requiredWidth,
        newWidth,
        newHeight,
        currentWidth: this.note.size.width,
        currentHeight: this.note.size.height
      });
      
      // Always emit size change to ensure proper shrinking
      if (newWidth !== this.note.size.width || newHeight !== this.note.size.height) {
        console.log('Emitting size change:', { width: newWidth, height: newHeight });
        this.sizeChanged.emit({ width: newWidth, height: newHeight });
      }
    }
  }

  onContentChange(): void {
    if (this.contentEditable) {
      const content = this.contentEditable.nativeElement.innerHTML;
      this.contentChanged.emit(content);
    }
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit();
  }
}