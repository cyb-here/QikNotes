import { Component, Input, Output, EventEmitter, ElementRef, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note, CanvasSettings, GridPosition } from '../../models';

@Component({
  selector: 'app-note',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="note-container"
      [class.dragging]="isDragging"
      [style.transform]="'translate(' + (5000 + (note.position.gridX * settings.cellWidth)) + 'px, ' + (5000 + (note.position.gridY * settings.cellHeight) - 40) + 'px)'">
      
      <!-- Button Area -->
      <div class="button-area">
        <button class="drag-btn" 
                (mousedown)="onDragStart($event)"
                (click)="$event.stopPropagation()"
                title="Drag note">
          <span class="drag-icon">⋮⋮</span>
        </button>
        
        <button class="delete-btn-float" 
                (click)="onDelete($event)"
                title="Delete note">
          ×
        </button>
      </div>

      <div 
        class="note" 
        [class.focused]="isFocused"
        [attr.data-note-id]="note.id"
        [style.width.px]="(note.size.width * settings.cellWidth) - 24"
        [style.height.px]="(note.size.height * settings.cellHeight) - 24"
        (click)="onNoteClick($event)">
        
        <div 
          #contentEditable
          class="note-content"
          contenteditable="true"
          (input)="onContentInput()"
          (blur)="onContentChange()"
          (focus)="onContentFocus()"
          (mousedown)="onTextAreaMouseDown($event)"
          (click)="$event.stopPropagation()"
          data-placeholder="Start typing...">
        </div>
      </div>
    </div>
  `,
  styles: [`
    .note-container {
      position: absolute;
      left: 0;
      top: 0;
      transform-origin: center center;
      will-change: transform;
      z-index: 1;
      pointer-events: none;
    }

    .note-container:hover {
      z-index: 10;
    }

    .note-container.dragging {
      z-index: 1000;
    }

    /* Button Area - covers the button space */
    .button-area {
      position: relative;
      height: 40px;
      pointer-events: auto;
      z-index: 1000;
    }

    /* Floating Drag Button */
    .drag-btn {
      position: absolute;
      top: 0;
      left: 8px;
      right: 48px;
      height: 28px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ccc;
      font-size: 11px;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: translateY(-4px);
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
    }

    .drag-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(0);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .drag-btn:active {
      cursor: grabbing;
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .drag-icon {
      line-height: 1;
      user-select: none;
    }

    .note-container:hover .drag-btn,
    .button-area:hover .drag-btn {
      opacity: 1;
      transform: translateY(0);
    }

    .drag-btn:hover {
      opacity: 1;
      transform: translateY(0);
    }

    .note-container.dragging .drag-btn {
      opacity: 1;
      transform: translateY(0);
    }

    /* Floating Delete Button */
    .delete-btn-float {
      position: absolute;
      top: 0;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255, 68, 68, 0.15);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 107, 107, 0.3);
      color: #ff6b6b;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      line-height: 1;
      pointer-events: auto;
    }

    .delete-btn-float:hover {
      background: rgba(255, 68, 68, 0.3);
      color: #fff;
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(255, 68, 68, 0.4);
    }

    .delete-btn-float:active {
      transform: scale(0.95);
    }

    .note-container:hover .delete-btn-float,
    .button-area:hover .delete-btn-float {
      opacity: 1;
      transform: scale(1);
    }

    .delete-btn-float:hover {
      opacity: 1;
      transform: scale(1.1);
    }

    .note {
      position: relative;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 8px;
      overflow: hidden;
      transition: box-shadow 0.2s, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      user-select: none;
      pointer-events: auto;
    }

    .note-container.dragging .note {
      box-shadow: 0 5px 20px rgba(0,0,0,0.5);
      cursor: grabbing;
      transition: box-shadow 0.2s;
    }

    .note.focused {
      border-color: #4285f4;
      box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.3), 0 2px 8px rgba(0,0,0,0.3);
    }
    
    .note-content {
      width: 100%;
      height: 100%;
      border: none;
      resize: none;
      outline: none;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.4;
      cursor: text;
      background: transparent;
      color: #1f2937;
      user-select: text;
      overflow: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .note-content[data-placeholder]:empty:before {
      content: attr(data-placeholder);
      color: #9ca3af;
      cursor: text;
    }

    .note-container.dragging .note-content {
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
  @Output() dragCancelled = new EventEmitter<void>();
  @Output() dragMove = new EventEmitter<{ gridX: number; gridY: number; width: number; height: number }>();
  @Output() noteClicked = new EventEmitter<void>();
  
  @ViewChild('contentEditable') contentEditable!: ElementRef<HTMLDivElement>;

  isDragging = false;
  isFocused = false;
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
    
    console.log('Note rendered:', {
      id: this.note.id,
      position: this.note.position,
      worldPos: {
        x: 5000 + (this.note.position.gridX * this.settings.cellWidth),
        y: 5000 + (this.note.position.gridY * this.settings.cellHeight)
      },
      element: this.elementRef.nativeElement
    });
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
      const containerElement = this.elementRef.nativeElement.querySelector('.note-container') as HTMLElement;
      if (containerElement) {
        const baseX = 5000 + (this.originalPosition.gridX * this.settings.cellWidth);
        const baseY = 5000 + (this.originalPosition.gridY * this.settings.cellHeight) - 40;
        const translateX = baseX + pixelDeltaX;
        const translateY = baseY + pixelDeltaY;
        containerElement.style.transform = `translate(${translateX}px, ${translateY}px)`;
      }
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    
    if (this.hasDragged) {
      // Calculate final position from current transform
      const containerElement = this.elementRef.nativeElement.querySelector('.note-container') as HTMLElement;
      if (containerElement) {
        const transform = containerElement.style.transform;
        
        // Parse the translate values from the transform
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (match) {
          const translateX = parseFloat(match[1]);
          const translateY = parseFloat(match[2]) + 40; // Add back the 40px offset
          
          const newPosition: GridPosition = {
            gridX: Math.round((translateX - 5000) / this.settings.cellWidth),
            gridY: Math.round((translateY - 5000) / this.settings.cellHeight)
          };

          // Immediately snap to grid position visually
          const snappedX = 5000 + (newPosition.gridX * this.settings.cellWidth);
          const snappedY = 5000 + (newPosition.gridY * this.settings.cellHeight) - 40;
          containerElement.style.transform = `translate(${snappedX}px, ${snappedY}px)`;

          // Emit final position for saving (this will trigger Angular update)
          this.positionChanged.emit(newPosition);
          
          // Emit drag ended
          this.dragEnded.emit();
          
          // The inline style will be overridden by Angular's binding on next change detection
        }
      }
      
      // Prevent the click event from bubbling to canvas
      event.stopPropagation();
      event.preventDefault();
    }
    
    this.hasDragged = false;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Cancel drag if Escape is pressed while dragging
    if (event.key === 'Escape' && this.isDragging) {
      event.preventDefault();
      event.stopPropagation();
      
      this.isDragging = false;
      this.hasDragged = false;
      
      // Reset visual position to original
      const containerElement = this.elementRef.nativeElement.querySelector('.note-container') as HTMLElement;
      if (containerElement) {
        containerElement.style.transform = '';
      }
      
      // Emit drag cancelled
      this.dragCancelled.emit();
    }
  }

  onDragStart(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Don't set initial transform - let Angular's binding handle it
    // We'll update it during drag in onMouseMove
    
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
      width: this.note.size.width * this.settings.cellWidth - 24,
      height: this.note.size.height * this.settings.cellHeight - 24
    };
  }

  onContentInput(): void {
    if (!this.contentEditable) return;
    
    const contentDiv = this.contentEditable.nativeElement;
    const noteElement = this.elementRef.nativeElement.querySelector('.note') as HTMLElement;
    
    if (!noteElement) return;
    
    // Store that we're currently focused
    const wasFocused = document.activeElement === contentDiv;
    
    // Save cursor position before any updates
    const selection = window.getSelection();
    let savedRange: Range | null = null;
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }
    
    // Update note content from contenteditable
    this.note.content = contentDiv.innerHTML;
    
    // Calculate size synchronously to avoid timing issues
    this.calculateAndEmitSize(contentDiv);
    
    // Restore focus and selection immediately if we were focused
    if (wasFocused && savedRange) {
      // Use a microtask to restore after Angular's change detection
      Promise.resolve().then(() => {
        if (document.activeElement !== contentDiv) {
          contentDiv.focus();
        }
        try {
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(savedRange);
          }
        } catch (e) {
          // If range is invalid after content change, just focus at end
          contentDiv.focus();
          const range = document.createRange();
          range.selectNodeContents(contentDiv);
          range.collapse(false);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      });
    }
  }

  private restoreCursorPosition(element: HTMLElement, position: number): void {
    const selection = window.getSelection();
    if (!selection) return;

    let charCount = 0;

    function traverseNodes(node: Node): boolean {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (charCount + textLength >= position) {
          const range = document.createRange();
          range.setStart(node, Math.min(position - charCount, textLength));
          range.collapse(true);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
          return true;
        }
        charCount += textLength;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          if (traverseNodes(node.childNodes[i])) {
            return true;
          }
        }
      }
      return false;
    }

    traverseNodes(element);
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
    this.isFocused = false;
  }

  onContentFocus(): void {
    this.isFocused = true;
  }

  focusContent(): void {
    if (this.contentEditable) {
      const contentDiv = this.contentEditable.nativeElement;
      contentDiv.focus();
      
      // Place cursor at the end of the content
      const range = document.createRange();
      const sel = window.getSelection();
      
      if (contentDiv.childNodes.length > 0) {
        const lastNode = contentDiv.childNodes[contentDiv.childNodes.length - 1];
        range.setStart(lastNode, lastNode.textContent?.length || 0);
      } else {
        range.setStart(contentDiv, 0);
      }
      
      range.collapse(true);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit();
  }

  onNoteClick(event: MouseEvent): void {
    // Emit note clicked event for highlighting in the list
    this.noteClicked.emit();
  }
}