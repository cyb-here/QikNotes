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
        <div class="toolbar-group formatting-group">
          <button (mousedown)="$event.preventDefault()" (click)="formatText('bold')" class="toolbar-btn format-btn" title="Bold (Ctrl+B)">
            <strong>B</strong>
          </button>
          <button (mousedown)="$event.preventDefault()" (click)="formatText('italic')" class="toolbar-btn format-btn" title="Italic (Ctrl+I)">
            <em>I</em>
          </button>
          <button (mousedown)="$event.preventDefault()" (click)="formatText('underline')" class="toolbar-btn format-btn" title="Underline (Ctrl+U)">
            <u>U</u>
          </button>
          <button (mousedown)="$event.preventDefault()" (click)="formatText('strikeThrough')" class="toolbar-btn format-btn" title="Strikethrough">
            <s>S</s>
          </button>
          <select (mousedown)="$event.stopPropagation()" (change)="setFontSize($event)" class="font-size-dropdown" title="Font Size">
            <option value="">Size</option>
            <option value="8">8px</option>
            <option value="10">10px</option>
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
            <option value="28">28px</option>
            <option value="32">32px</option>
            <option value="36">36px</option>
            <option value="42">42px</option>
            <option value="48">48px</option>
            <option value="56">56px</option>
            <option value="64">64px</option>
            <option value="72">72px</option>
          </select>
          <button (mousedown)="$event.preventDefault()" (click)="increaseFontSize()" class="toolbar-btn format-btn" title="Increase Font Size">
            A+
          </button>
          <button (mousedown)="$event.preventDefault()" (click)="decreaseFontSize()" class="toolbar-btn format-btn" title="Decrease Font Size">
            A-
          </button>
        </div>
        <div class="toolbar-group">
          <button (click)="toggleGrid()" class="toolbar-btn">
            {{ canvasState.settings.showGrid ? '✓ Grid' : 'Grid' }}
          </button>
          <button (click)="cycleFontMode()" class="toolbar-btn" title="Toggle Font">
            {{ fontMode === 'comic' ? '🎨 Comic' : (fontMode === 'serif' ? '📖 Serif' : '🔤 Sans') }}
          </button>
          <button (click)="cycleThemeMode()" class="toolbar-btn" title="Toggle Theme">
            {{ themeMode === 'dark' ? '🌙 Dark' : (themeMode === 'oled' ? '⚫ OLED' : '☀️ Light') }}
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
          [class.no-transition]="isNavigating"
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
              [zoom]="canvasState.viewport.zoom"
              [class.no-transition]="isNavigating && note.id === activeNoteId"
              (contentChanged)="updateNoteContent(note.id, $event)"
              (positionChanged)="updateNotePosition(note.id, $event)"
              (sizeChanged)="updateNoteSize(note.id, $event)"
              (dragMove)="onNoteDragMove(note.id, $event)"
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
      top: 0;
      left: 0;
      transform-origin: center center;
      cursor: grab;
      transform: 
        /* Apply navigation offset */
        translate(var(--offset-x, 0px), var(--offset-y, 0px))
        /* Apply zoom */
        scale(var(--zoom-level, 1));
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .canvas-area.no-transition {
      transition: none !important;
    }

    /* Debug center cross */
    .canvas-area::after {
      content: '';
      position: absolute;
      left: 5000px;
      top: 5000px;
      width: 20px;
      height: 20px;
      background: 
        linear-gradient(to right, transparent calc(50% - 1px), red calc(50% - 1px), red calc(50% + 1px), transparent calc(50% + 1px)),
        linear-gradient(to bottom, transparent calc(50% - 1px), red calc(50% - 1px), red calc(50% + 1px), transparent calc(50% + 1px));
      transform: translate(-50%, -50%);
      pointer-events: none;
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

    .formatting-group {
      border-left: 2px solid #ddd;
    }

    .format-btn {
      min-width: 36px;
      padding: 6px 10px;
      font-weight: bold;
    }

    .format-btn strong,
    .format-btn em,
    .format-btn u,
    .format-btn s {
      font-size: 14px;
      pointer-events: none;
    }

    .format-btn:active {
      background: #e0e0e0;
      transform: scale(0.95);
    }

    .font-size-dropdown {
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 13px;
      outline: none;
      transition: all 0.2s;
    }

    .font-size-dropdown:hover {
      background: #f5f5f5;
      border-color: #ccc;
    }

    .font-size-dropdown:focus {
      border-color: #007bff;
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

    /* Disable transitions on notes during navigation */
    ::ng-deep app-note.no-transition .note {
      transition: none !important;
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
  isNavigating = false;
  // themeMode: 'light' | 'dark' | 'oled'
  themeMode: string = 'light';
  // fontMode: 'sans' | 'comic' | 'serif'
  fontMode: string = 'sans';
  focusedTextarea: HTMLTextAreaElement | null = null;
  private savedSelection: Range | null = null;
  private savedElement: HTMLElement | null = null;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private canvasMouseDownTime = 0;
  private isClickFromCanvas = false;
  private potentialCanvasPan = false;

  private updateCanvasPosition(): void {
    // No need for explicit update since we're using CSS variables
    // This method exists to maintain clean architecture
  }

  private fixInvalidNotePositions(): void {
    // Fix any notes with NaN or invalid coordinates
    let recoveryIndex = 0; // Track how many notes we've recovered
    
    // Find the leftmost note position
    let leftmostX = 0;
    for (const note of this.notes) {
      if (isFinite(note.position.gridX) && note.position.gridX < leftmostX) {
        leftmostX = note.position.gridX;
      }
    }
    
    // Place recovered notes 4 blocks to the left of the leftmost note
    const recoveryZoneX = leftmostX - 4;
    
    for (const note of this.notes) {
      let needsUpdate = false;
      let newPosition = { ...note.position };
      
      if (!isFinite(note.position.gridX) || !isFinite(note.position.gridY)) {
        console.warn('Fixing invalid position for note:', note.id, 'Current position:', note.position);
        
        // Arrange recovered notes vertically in the recovery zone
        newPosition = {
          gridX: recoveryZoneX,
          gridY: recoveryIndex * 2  // 2 grid units apart vertically
        };
        
        needsUpdate = true;
        recoveryIndex++;
      }
      
      if (needsUpdate) {
        console.log('Moving note to recovery position:', newPosition);
        this.notesService.updateNotePosition(note.id, newPosition).catch((error: unknown) => {
          console.error('Error fixing note position:', error);
        });
      }
    }
    
    if (recoveryIndex > 0) {
      console.log(`Recovered ${recoveryIndex} note(s) with invalid positions to recovery zone at x=${recoveryZoneX}`);
    }
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
      // Check if user is typing in a contenteditable or textarea
      const target = event.target as HTMLElement;
      const isInEditor = target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true';
      
      switch(event.key.toLowerCase()) {
        case '=':
        case '+':
          if (!isInEditor) {
            event.preventDefault();
            await this.zoomIn();
          }
          break;
        case '-':
          if (!isInEditor) {
            event.preventDefault();
            await this.zoomOut();
          }
          break;
        case '0':
          if (!isInEditor) {
            event.preventDefault();
            await this.resetZoom();
          }
          break;
        case 'b':
          if (isInEditor) {
            event.preventDefault();
            this.formatText('bold');
          }
          break;
        case 'i':
          if (isInEditor) {
            event.preventDefault();
            this.formatText('italic');
          }
          break;
        case 'u':
          if (isInEditor) {
            event.preventDefault();
            this.formatText('underline');
          }
          break;
      }
    }
    
    // Handle spacebar for canvas dragging (but not when typing in editor)
    if (event.code === 'Space' && !event.repeat) {
      // Check if user is typing in a contenteditable or textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true') {
        return; // Allow normal space typing
      }
      
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
      // Check if user was typing in a contenteditable or textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true') {
        return; // Don't interfere with typing
      }
      
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
    // Load theme preference (supports 'light' | 'dark' | 'oled')
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'oled') {
      this.themeMode = savedTheme;
    } else {
      // Back-compat: check old boolean key 'darkMode'
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode) {
        try {
          const wasDark = JSON.parse(savedDarkMode);
          this.themeMode = wasDark ? 'dark' : 'light';
        } catch {
          this.themeMode = 'light';
        }
      }
    }

    // Apply body class for the active theme
    document.body.classList.remove('dark-mode', 'oled-mode');
    if (this.themeMode === 'dark') document.body.classList.add('dark-mode');
    if (this.themeMode === 'oled') document.body.classList.add('oled-mode');

    // Load font preference (supports 'sans' | 'comic' | 'serif')
    const savedFont = localStorage.getItem('fontMode');
    if (savedFont === 'sans' || savedFont === 'comic' || savedFont === 'serif') {
      this.fontMode = savedFont;
    }

    // Apply body class for the active font
    document.body.classList.remove('font-sans', 'font-comic', 'font-serif');
    document.body.classList.add(`font-${this.fontMode}`);

    // Listen for selection changes to save the selection
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      const activeElement = document.activeElement;
      if (selection && selection.rangeCount > 0 && 
          activeElement && activeElement.getAttribute('contenteditable') === 'true') {
        this.savedSelection = selection.getRangeAt(0).cloneRange();
        this.savedElement = activeElement as HTMLElement;
      }
    });
    
    // Load notes
    this.notesService.getNotes().subscribe(notes => {
      this.notes = notes;
      // Clean up any notes with invalid coordinates
      this.fixInvalidNotePositions();
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
      // Use an exponential mapping for smooth zooming (increased from 0.002 to 0.005 for faster zoom)
      const factor = Math.exp(-dy * 0.005);
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
    // Find the note being moved
    const movedNote = this.notes.find(n => n.id === noteId);
    if (!movedNote) {
      this.notesService.updateNotePosition(noteId, newPosition).catch(error => {
        console.error('Error updating note position:', error);
      });
      return;
    }

    // Check for overlaps and push other notes away
    this.resolveOverlapsForMovedNote(movedNote, newPosition);

    // Update the note position
    this.notesService.updateNotePosition(noteId, newPosition).catch(error => {
      console.error('Error updating note position:', error);
    });
  }

  private resolveOverlapsForMovedNote(movedNote: Note, newPosition: GridPosition): void {
    // Validate input position
    if (!isFinite(newPosition.gridX) || !isFinite(newPosition.gridY)) {
      console.error('Invalid position for moved note:', newPosition);
      return;
    }
    
    const movedNoteRight = newPosition.gridX + movedNote.size.width;
    const movedNoteBottom = newPosition.gridY + movedNote.size.height;
    
    const processedNotes = new Set<string>();
    
    // Iteratively resolve overlaps (cascade push)
    let hasOverlaps = true;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops
    
    while (hasOverlaps && iterations < maxIterations) {
      hasOverlaps = false;
      iterations++;
      
      for (const otherNote of this.notes) {
        if (otherNote.id === movedNote.id) continue;
        
        // Validate other note's position
        if (!isFinite(otherNote.position.gridX) || !isFinite(otherNote.position.gridY)) {
          console.error('Skipping note with invalid position:', otherNote.id);
          continue;
        }
        
        const otherLeft = otherNote.position.gridX;
        const otherRight = otherNote.position.gridX + otherNote.size.width;
        const otherTop = otherNote.position.gridY;
        const otherBottom = otherNote.position.gridY + otherNote.size.height;
        
        // Check if notes overlap
        const overlapsX = !(movedNoteRight <= otherLeft || newPosition.gridX >= otherRight);
        const overlapsY = !(movedNoteBottom <= otherTop || newPosition.gridY >= otherBottom);
        
        if (overlapsX && overlapsY) {
          hasOverlaps = true;
          
          // Calculate overlap amounts in each direction
          const overlapLeft = movedNoteRight - otherLeft;
          const overlapRight = otherRight - newPosition.gridX;
          const overlapTop = movedNoteBottom - otherTop;
          const overlapBottom = otherBottom - newPosition.gridY;
          
          // Find minimum overlap direction
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
          
          let newOtherPosition: GridPosition;
          
          // Push in the direction with least overlap (no gap)
          if (minOverlap === overlapLeft) {
            // Push right
            newOtherPosition = {
              gridX: movedNoteRight,
              gridY: otherNote.position.gridY
            };
          } else if (minOverlap === overlapRight) {
            // Push left
            newOtherPosition = {
              gridX: newPosition.gridX - otherNote.size.width,
              gridY: otherNote.position.gridY
            };
          } else if (minOverlap === overlapTop) {
            // Push down
            newOtherPosition = {
              gridX: otherNote.position.gridX,
              gridY: movedNoteBottom
            };
          } else {
            // Push up
            newOtherPosition = {
              gridX: otherNote.position.gridX,
              gridY: newPosition.gridY - otherNote.size.height
            };
          }
          
          // Validate calculated position before updating
          if (isFinite(newOtherPosition.gridX) && isFinite(newOtherPosition.gridY)) {
            // Update the other note's position
            this.notesService.updateNotePosition(otherNote.id, newOtherPosition).catch((error: unknown) => {
              console.error('Error pushing note:', error);
            });
            
            processedNotes.add(otherNote.id);
          } else {
            console.error('Calculated invalid position for note:', otherNote.id, newOtherPosition);
          }
        }
      }
    }
  }

  updateNoteSize(noteId: string, newSize: { width: number; height: number }): void {
    // Find the note being resized
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;

    // Check for collisions and adjust other notes if needed
    this.adjustNotesForResize(note, newSize);

    // Update the note size
    this.notesService.updateNoteSize(noteId, newSize).catch((error: unknown) => {
      console.error('Error updating note size:', error);
    });
  }

  private adjustNotesForResize(resizingNote: Note, newSize: { width: number; height: number }): void {
    const oldSize = resizingNote.size;
    
    // Calculate the bounds of the resizing note
    const oldRight = resizingNote.position.gridX + oldSize.width;
    const oldBottom = resizingNote.position.gridY + oldSize.height;
    const newRight = resizingNote.position.gridX + newSize.width;
    const newBottom = resizingNote.position.gridY + newSize.height;

    // Only check if note is expanding
    if (newSize.width <= oldSize.width && newSize.height <= oldSize.height) {
      return;
    }

    // Calculate expansion amounts
    const expandedRight = newSize.width > oldSize.width;
    const expandedDown = newSize.height > oldSize.height;

    // Find notes that would be overlapped and push them away
    const processedNotes = new Set<string>();
    let hasOverlaps = true;
    let iterations = 0;
    const maxIterations = 10;
    
    while (hasOverlaps && iterations < maxIterations) {
      hasOverlaps = false;
      iterations++;
      
      for (const otherNote of this.notes) {
        if (otherNote.id === resizingNote.id || processedNotes.has(otherNote.id)) continue;

        // Validate other note's position
        if (!isFinite(otherNote.position.gridX) || !isFinite(otherNote.position.gridY)) {
          continue;
        }

        const otherLeft = otherNote.position.gridX;
        const otherRight = otherNote.position.gridX + otherNote.size.width;
        const otherTop = otherNote.position.gridY;
        const otherBottom = otherNote.position.gridY + otherNote.size.height;

        // Check for overlap with the NEW size
        const overlapsX = otherLeft < newRight && otherRight > resizingNote.position.gridX;
        const overlapsY = otherTop < newBottom && otherBottom > resizingNote.position.gridY;

        if (overlapsX && overlapsY) {
          hasOverlaps = true;
          
          // Determine push direction based on which side is expanding
          let newOtherPosition: GridPosition | null = null;
          
          if (expandedRight && expandedDown) {
            // Expanding both directions - push based on proximity
            const distanceRight = otherLeft - oldRight;
            const distanceDown = otherTop - oldBottom;
            
            if (distanceRight >= 0 && distanceRight <= distanceDown) {
              // Push right
              newOtherPosition = {
                gridX: newRight,
                gridY: otherNote.position.gridY
              };
            } else if (distanceDown >= 0) {
              // Push down
              newOtherPosition = {
                gridX: otherNote.position.gridX,
                gridY: newBottom
              };
            } else {
              // Overlap exists but note was already there - push right by default
              newOtherPosition = {
                gridX: newRight,
                gridY: otherNote.position.gridY
              };
            }
          } else if (expandedRight) {
            // Only expanding right - push right
            newOtherPosition = {
              gridX: newRight,
              gridY: otherNote.position.gridY
            };
          } else if (expandedDown) {
            // Only expanding down - push down
            newOtherPosition = {
              gridX: otherNote.position.gridX,
              gridY: newBottom
            };
          }
          
          if (newOtherPosition && isFinite(newOtherPosition.gridX) && isFinite(newOtherPosition.gridY)) {
            this.notesService.updateNotePosition(otherNote.id, newOtherPosition).catch((error: unknown) => {
              console.error('Error pushing note during resize:', error);
            });
            processedNotes.add(otherNote.id);
          }
        }
      }
    }
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

  cycleFontMode(): void {
    // Cycle through: sans -> comic -> serif -> sans
    if (this.fontMode === 'sans') this.fontMode = 'comic';
    else if (this.fontMode === 'comic') this.fontMode = 'serif';
    else this.fontMode = 'sans';

    // Persist
    localStorage.setItem('fontMode', this.fontMode);

    // Update body classes
    document.body.classList.remove('font-sans', 'font-comic', 'font-serif');
    document.body.classList.add(`font-${this.fontMode}`);
  }

  cycleThemeMode(): void {
    // Cycle through: light -> dark -> oled -> light
    if (this.themeMode === 'light') this.themeMode = 'dark';
    else if (this.themeMode === 'dark') this.themeMode = 'oled';
    else this.themeMode = 'light';

    // Persist
    localStorage.setItem('themeMode', this.themeMode);

    // Update body classes
    document.body.classList.remove('dark-mode', 'oled-mode');
    if (this.themeMode === 'dark') document.body.classList.add('dark-mode');
    if (this.themeMode === 'oled') document.body.classList.add('oled-mode');
  }

  toggleAddButtons(): void {
    this.showAddButtons = !this.showAddButtons;
    console.log('Add button toggled. Now visible:', this.showAddButtons);
  }

  formatText(command: string): void {
    console.log('formatText called with command:', command);
    
    // Try to use saved selection first
    if (this.savedSelection && this.savedElement) {
      console.log('Using saved selection');
      this.savedElement.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(this.savedSelection);
      }
    }
    
    const activeElement = document.activeElement;
    console.log('activeElement:', activeElement);
    console.log('contenteditable:', activeElement?.getAttribute('contenteditable'));
    
    if (activeElement && activeElement.getAttribute('contenteditable') === 'true') {
      // Save selection before executing command
      const selection = window.getSelection();
      console.log('selection:', selection);
      console.log('rangeCount:', selection?.rangeCount);
      
      if (!selection || selection.rangeCount === 0) {
        console.log('No selection found');
        return;
      }
      
      // Store the current range
      const range = selection.getRangeAt(0);
      console.log('range:', range);
      console.log('selected text:', range.toString());
      
      // Execute the command
      const result = document.execCommand(command, false, undefined);
      console.log('execCommand result:', result);
      
      // Trigger input event to save changes
      const event = new Event('input', { bubbles: true });
      activeElement.dispatchEvent(event);
      
      // Save the new selection
      if (selection.rangeCount > 0) {
        this.savedSelection = selection.getRangeAt(0).cloneRange();
        this.savedElement = activeElement as HTMLElement;
      }
      
      // Keep focus
      (activeElement as HTMLElement).focus();
    } else {
      console.log('Active element is not contenteditable');
    }
  }

  increaseFontSize(): void {
    console.log('increaseFontSize called');
    
    // Try to use saved selection first
    if (this.savedSelection && this.savedElement) {
      this.savedElement.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(this.savedSelection);
      }
    }
    
    const activeElement = document.activeElement;
    console.log('activeElement:', activeElement);
    
    if (activeElement && activeElement.getAttribute('contenteditable') === 'true') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        console.log('No selection');
        return;
      }
      
      const range = selection.getRangeAt(0);
      console.log('range text:', range.toString());
      
      // If no text is selected, do nothing
      if (range.toString().length === 0) {
        console.log('No text selected');
        return;
      }
      
      // Get current font size from selected text
      let currentSize = 14; // default in px
      const parentElement = range.startContainer.parentElement;
      if (parentElement) {
        const computedStyle = window.getComputedStyle(parentElement);
        currentSize = parseInt(computedStyle.fontSize);
        console.log('Current font size:', currentSize);
      }
      
      // Increment size (max 72px) - big range for variety
      const newSize = Math.min(72, currentSize + 4); // Increase by 4px, max 72px
      console.log('New font size:', newSize);
      
      // Wrap selection in span with new font size
      const span = document.createElement('span');
      span.style.fontSize = newSize + 'px';
      
      try {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
        console.log('Font size applied successfully');
        
        // Select the newly created span
        range.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        console.error('Error applying font size:', e);
      }
      
      // Trigger input event
      const event = new Event('input', { bubbles: true });
      activeElement.dispatchEvent(event);
      
      // Save selection
      const newSelection = window.getSelection();
      if (newSelection && newSelection.rangeCount > 0) {
        this.savedSelection = newSelection.getRangeAt(0).cloneRange();
        this.savedElement = activeElement as HTMLElement;
      }
      
      (activeElement as HTMLElement).focus();
    }
  }

  decreaseFontSize(): void {
    console.log('decreaseFontSize called');
    
    // Try to use saved selection first
    if (this.savedSelection && this.savedElement) {
      this.savedElement.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(this.savedSelection);
      }
    }
    
    const activeElement = document.activeElement;
    console.log('activeElement:', activeElement);
    
    if (activeElement && activeElement.getAttribute('contenteditable') === 'true') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        console.log('No selection');
        return;
      }
      
      const range = selection.getRangeAt(0);
      console.log('range text:', range.toString());
      
      // If no text is selected, do nothing
      if (range.toString().length === 0) {
        console.log('No text selected');
        return;
      }
      
      // Get current font size from selected text
      let currentSize = 14; // default in px
      const parentElement = range.startContainer.parentElement;
      if (parentElement) {
        const computedStyle = window.getComputedStyle(parentElement);
        currentSize = parseInt(computedStyle.fontSize);
        console.log('Current font size:', currentSize);
      }
      
      // Decrement size (min 6px) - big range for variety
      const newSize = Math.max(6, currentSize - 4); // Decrease by 4px, min 6px
      console.log('New font size:', newSize);
      
      // Wrap selection in span with new font size
      const span = document.createElement('span');
      span.style.fontSize = newSize + 'px';
      
      try {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
        console.log('Font size applied successfully');
        
        // Select the newly created span
        range.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        console.error('Error applying font size:', e);
      }
      
      // Trigger input event
      const event = new Event('input', { bubbles: true });
      activeElement.dispatchEvent(event);
      
      // Save selection
      const newSelection = window.getSelection();
      if (newSelection && newSelection.rangeCount > 0) {
        this.savedSelection = newSelection.getRangeAt(0).cloneRange();
        this.savedElement = activeElement as HTMLElement;
      }
      
      (activeElement as HTMLElement).focus();
    }
  }

  setFontSize(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const size = selectElement.value;
    
    // Reset dropdown to placeholder
    selectElement.value = '';
    
    if (!size) return;
    
    console.log('setFontSize called with size:', size);
    
    // Try to use saved selection first
    if (this.savedSelection && this.savedElement) {
      this.savedElement.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(this.savedSelection);
      }
    }
    
    const activeElement = document.activeElement;
    console.log('activeElement:', activeElement);
    
    if (activeElement && activeElement.getAttribute('contenteditable') === 'true') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        console.log('No selection');
        return;
      }
      
      const range = selection.getRangeAt(0);
      console.log('range text:', range.toString());
      
      // If no text is selected, do nothing
      if (range.toString().length === 0) {
        console.log('No text selected');
        return;
      }
      
      const newSize = parseInt(size);
      console.log('Setting font size to:', newSize);
      
      // Wrap selection in span with new font size
      const span = document.createElement('span');
      span.style.fontSize = newSize + 'px';
      
      try {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
        console.log('Font size applied successfully');
        
        // Select the newly created span
        range.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        console.error('Error applying font size:', e);
      }
      
      // Trigger input event
      const inputEvent = new Event('input', { bubbles: true });
      activeElement.dispatchEvent(inputEvent);
      
      // Save selection
      const newSelection = window.getSelection();
      if (newSelection && newSelection.rangeCount > 0) {
        this.savedSelection = newSelection.getRangeAt(0).cloneRange();
        this.savedElement = activeElement as HTMLElement;
      }
      
      (activeElement as HTMLElement).focus();
    }
  }

  onNoteDragStart(): void {
    this.isDraggingNote = true;
  }

  onNoteDragEnd(): void {
    setTimeout(() => {
      this.isDraggingNote = false;
    }, 50);
    
    // Reset z-index for all notes after drag ends
    this.notes.forEach(note => {
      const noteElement = document.querySelector(`[data-note-id="${note.id}"]`) as HTMLElement;
      if (noteElement) {
        noteElement.style.zIndex = '';
      }
    });
  }

  onNoteDragMove(draggedNoteId: string, dragBounds: { gridX: number; gridY: number; width: number; height: number }): void {
    // Check each note for overlap with the dragging note
    this.notes.forEach(note => {
      if (note.id === draggedNoteId) return;

      // Calculate if notes overlap
      const noteLeft = note.position.gridX;
      const noteRight = note.position.gridX + note.size.width;
      const noteTop = note.position.gridY;
      const noteBottom = note.position.gridY + note.size.height;

      const dragLeft = dragBounds.gridX;
      const dragRight = dragBounds.gridX + dragBounds.width;
      const dragTop = dragBounds.gridY;
      const dragBottom = dragBounds.gridY + dragBounds.height;

      // Check for overlap
      const overlaps = !(noteRight <= dragLeft || noteLeft >= dragRight || 
                        noteBottom <= dragTop || noteTop >= dragBottom);

      const noteElement = document.querySelector(`[data-note-id="${note.id}"]`) as HTMLElement;
      if (noteElement) {
        if (overlaps) {
          // Move overlapping note behind (lower z-index)
          noteElement.style.zIndex = '1';
        } else {
          // Reset z-index for non-overlapping notes
          noteElement.style.zIndex = '';
        }
      }
    });
  }

  private highlightNote(noteId: string): void {
    requestAnimationFrame(() => {
      const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
      if (noteElement instanceof HTMLElement) {
        noteElement.classList.add('highlight');
        setTimeout(() => noteElement.classList.remove('highlight'), 2000);
      }
    });
  }
  navigateToNote(note: Note): void {
    if (!note?.id || !note?.position) {
      console.error('Invalid note data:', note);
      return;
    }

    this.activeNoteId = note.id;

    // Ensure container exists
    const container = document.querySelector('.canvas-container');
    if (!(container instanceof HTMLElement)) {
      console.error('Canvas container not found');
      return;
    }

    // Read grid cell size (pixels per grid unit)
    const cellWidth = this.canvasState?.settings?.cellWidth || 200;
    const cellHeight = this.canvasState?.settings?.cellHeight || 150;

    // Disable transition for instant navigation
    this.isNavigating = true;

    // Use setTimeout with 0ms to ensure change detection runs before re-enabling transitions
    setTimeout(() => {
      this.canvasOffset.x = -note.position.gridX * cellWidth;
      this.canvasOffset.y = -note.position.gridY * cellHeight;

      console.log('navigateToNote:', { grid: note.position, offset: this.canvasOffset });

      // Re-enable transition after a brief delay
      setTimeout(() => {
        this.isNavigating = false;
        // Highlight after navigation is complete
        setTimeout(() => {
          if (this.activeNoteId === note.id) {
            this.highlightNote(note.id);
          }
        }, 50);
      }, 100);
    }, 0);
  }
}