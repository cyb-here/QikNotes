import { Component, OnInit, OnDestroy, inject, HostListener, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
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
      <!-- Mobile Menu Button -->
      <button class="mobile-menu-btn" (click)="toggleMobilePanel()" [class.active]="isMobilePanelOpen">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Notes Panel Wrapper -->
      <div class="notes-panel-wrapper" [class.mobile-open]="isMobilePanelOpen">
        <app-notes-panel
          [notes]="notes"
          [activeNoteId]="activeNoteId"
          (navigateToNote)="navigateToNote($event); closeMobilePanel()">
        </app-notes-panel>
      </div>

      <!-- Mobile Overlay -->
      <div class="mobile-overlay" 
           [class.active]="isMobilePanelOpen" 
           (click)="closeMobilePanel()"></div>

      <!-- Import/Export Menu Button -->
      <button class="menu-btn" (click)="toggleMenu()" title="Import/Export">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="4" r="1.5" fill="currentColor"/>
          <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
          <circle cx="10" cy="16" r="1.5" fill="currentColor"/>
        </svg>
      </button>

      <!-- Import/Export Menu -->
      <div class="import-export-menu" [class.active]="isMenuOpen">
        <div class="menu-header">Data Management</div>
        <button (click)="exportNotes(); toggleMenu()" class="menu-item">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1v10m0 0L4 7m4 4l4-4M2 15h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Export Notes</span>
        </button>
        <button (click)="importNotes(); toggleMenu()" class="menu-item">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 11V1m0 10L4 7m4 4l4-4M2 15h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Import Notes</span>
        </button>
        <input 
          #fileInput 
          type="file" 
          accept=".json" 
          (change)="onFileSelected($event)" 
          style="display: none">
      </div>

      <!-- Floating Add Button -->
      <button (click)="addNoteAtCenter()" class="fab-add" title="Add Note">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <!-- Mobile Add Note Button -->
      <button class="fab-add mobile-fab-add" (click)="addNoteAtCenter()" title="Add Note">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="url(#purple-gradient)"/>
          <path d="M16 10v12M10 16h12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <defs>
            <linearGradient id="purple-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stop-color="#8b5cf6"/>
              <stop offset="1" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>
        </svg>
      </button>

      <!-- Coordinates Display -->
      <div class="coords-indicator" *ngIf="mousePosition">
        <span class="coord-label">Block</span>
        <span class="coord-value">{{ mousePosition.gridX }}, {{ mousePosition.gridY }}</span>
      </div>

      <!-- Bottom Control Bar -->
      <div class="bottom-bar">
        <div class="bar-group">
          <button (click)="zoomOut()" class="bar-btn" title="Zoom Out">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="8" x2="12" y2="8"></line>
            </svg>
          </button>
          <button (click)="resetView()" class="zoom-display" title="Reset View">{{ (canvasState.viewport.zoom * 100).toFixed(0) }}%</button>
          <button (click)="zoomIn()" class="bar-btn" title="Zoom In">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="4" x2="8" y2="12"></line>
              <line x1="4" y1="8" x2="12" y2="8"></line>
            </svg>
          </button>
        </div>
        
        <div class="bar-group format-tools">
          <button (click)="formatText('bold')" class="bar-btn" title="Bold"><strong>B</strong></button>
          <button (click)="formatText('italic')" class="bar-btn" title="Italic"><em>I</em></button>
          <button (click)="formatText('underline')" class="bar-btn" title="Underline"><u>U</u></button>
          <select (change)="setFontSize($any($event.target).value)" class="size-select" title="Font Size">
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
            <option value="20">20</option>
            <option value="24">24</option>
          </select>
          <button (click)="decreaseFontSize()" class="bar-btn" title="Decrease Font Size">A−</button>
          <button (click)="increaseFontSize()" class="bar-btn" title="Increase Font Size">A+</button>
        </div>

        <div class="bar-group">
          <button (click)="cycleFontMode()" class="bar-btn font-btn" title="Font">
            {{ fontMode === 'comic' ? 'Comic' : (fontMode === 'serif' ? 'Serif' : 'Sans') }}
          </button>
          <button (click)="cycleThemeMode()" class="bar-btn" title="Theme">
            {{ themeMode === 'dark' ? '🌙' : (themeMode === 'oled' ? '⚫' : '☀️') }}
          </button>
          <button (click)="toggleGrid()" class="bar-btn" title="Grid">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="2" width="5" height="5" rx="1"></rect>
              <rect x="9" y="2" width="5" height="5" rx="1"></rect>
              <rect x="2" y="9" width="5" height="5" rx="1"></rect>
              <rect x="9" y="9" width="5" height="5" rx="1"></rect>
            </svg>
          </button>
          <button (dblclick)="deleteAllNotes()" (click)="handleDeleteSingleClick()" class="bar-btn danger" [class.show-tooltip]="showDeleteTooltip" title="Delete All">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 4h10M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M6 7v4M10 7v4"></path>
              <path d="M4 4h8l-1 9H5L4 4z"></path>
            </svg>
            <span class="delete-tooltip" *ngIf="showDeleteTooltip">Double-click to delete all</span>
          </button>
        </div>
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
              *ngFor="let note of notes; trackBy: trackByNoteId"
              [note]="note"
              [settings]="canvasState.settings"
              [zoom]="canvasState.viewport.zoom"
              [class.no-transition]="isNavigating && note.id === activeNoteId"
              [class.active-note]="note.id === activeNoteId"
              (contentChanged)="updateNoteContent(note.id, $event)"
              (positionChanged)="updateNotePosition(note.id, $event)"
              (sizeChanged)="updateNoteSize(note.id, $event)"
              (dragMove)="onNoteDragMove(note.id, $event)"
              (delete)="deleteNote(note.id)"
              (dragStarted)="onNoteDragStart(note.id)"
              (dragEnded)="onNoteDragEnd()"
              (dragCancelled)="onNoteDragCancelled()"
              (noteClicked)="setActiveNote(note.id)">
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

    .notes-panel-wrapper {
      position: fixed;
      left: 0;
      top: 0;
      width: 300px;
      height: 100vh;
      z-index: 1700;
      transition: transform 0.3s ease;
      transform: translateX(0);
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
    
    /* Floating Action Button for Add Note */
    .fab-add {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 1100;
      color: white;
      box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .fab-add:hover {
      transform: scale(1.1) rotate(90deg);
      box-shadow: 0 12px 48px rgba(139, 92, 246, 0.6);
    }

    .fab-add:active {
      transform: scale(1.05) rotate(90deg);
    }

    /* Mobile Floating Action Button for Add Note */
    .mobile-fab-add {
      display: none;
    }
    @media (max-width: 768px) {
      .fab-add:not(.mobile-fab-add) {
        display: none !important;
      }
      .mobile-fab-add {
        display: block !important;
        position: fixed;
        top: 80px;
        right: 24px;
        z-index: 1700;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .mobile-fab-add:active {
        transform: scale(0.96);
      }
    }

    /* Coordinates Indicator */
    .coords-indicator {
      position: fixed;
      bottom: 24px;
      right: 108px;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(20px);
      padding: 10px 16px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }

    .coord-label {
      font-size: 10px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .coord-value {
      font-size: 16px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      font-family: 'Courier New', monospace;
    }

    /* Bottom Control Bar */
    .bottom-bar {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(20px);
      padding: 12px 16px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .bar-group {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 8px;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    .bar-group:last-child {
      border-right: none;
    }

    .bar-btn {
      width: 36px;
      height: 36px;
      padding: 0;
      border: none;
      border-radius: 10px;
      background: transparent;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      font-size: 14px;
      font-weight: 600;
    }

    .bar-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }

    .bar-btn:active {
      transform: scale(0.95);
    }

    .bar-btn.danger {
      color: #ef4444;
    }

    .bar-btn.danger:hover {
      background: rgba(239, 68, 68, 0.2);
    }

    .bar-btn.font-btn {
      font-size: 11px;
      font-weight: 700;
      width: auto;
      min-width: 36px;
      padding: 0 8px;
    }

    .delete-tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      pointer-events: none;
      animation: fadeIn 0.2s ease-in-out;
    }

    .delete-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: rgba(0, 0, 0, 0.95);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    .zoom-display {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 0;
    }

    .zoom-display:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: scale(1.05);
    }

    .zoom-display:active {
      transform: scale(0.98);
    }

    .size-select {
      height: 36px;
      min-width: 48px;
      padding: 0 8px;
      background: transparent;
      border: none;
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      transition: all 0.2s ease;
      text-align: center;
    }

    .size-select:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }

    .size-select option {
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    /* Theme-specific dropdown styling */
    body.dark-mode .size-select option {
      background: #21262d;
      color: #c9d1d9;
    }

    body.oled-mode .size-select option {
      background: #0a0a0a;
      color: #e6eef6;
    }

    /* Legacy toolbar styles - hide it */
    .toolbar {
      display: none;
    }
    
    .toolbar-row {
      display: none;
    }
    
    .toolbar-btn {
      display: none;
    }

    .font-size-dropdown {
      display: none;
    }

    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 8px;
      border-right: 1px solid rgba(0, 0, 0, 0.06);
    }

    .toolbar-group:first-child {
      padding-left: 4px;
    }

    .toolbar-group:last-child {
      border-right: none;
      padding-right: 4px;
    }

    .formatting-group {
      background: rgba(248, 250, 252, 0.5);
      border-radius: 10px;
      padding: 4px 8px !important;
      border-left: none !important;
    }

    .format-btn {
      min-width: 32px;
      padding: 6px 8px;
      font-weight: 600;
      border-radius: 8px;
      background: transparent;
      transition: all 0.15s;
    }

    .format-btn:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .format-btn:active {
      background: rgba(102, 126, 234, 0.2);
      transform: scale(0.95);
    }

    .format-btn strong,
    .format-btn em,
    .format-btn u,
    .format-btn s {
      font-size: 14px;
      pointer-events: none;
    }

    .font-size-dropdown {
      padding: 6px 10px;
      border: none;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      outline: none;
      transition: all 0.2s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      color: #333;
    }

    .font-size-dropdown:hover {
      background: rgba(255, 255, 255, 1);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    .font-size-dropdown:focus {
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }

    .toolbar-info {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }
    
    .notes-count, .coordinates, .drag-status {
      font-size: 13px;
      color: #64748b;
      white-space: nowrap;
      font-weight: 500;
    }

    .drag-status {
      color: #f5576c;
      font-weight: 600;
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

    /* Highlight active note on canvas */
    ::ng-deep app-note.active-note .note {
      border-color: #4285f4 !important;
      box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.3), 0 4px 12px rgba(0,0,0,0.4) !important;
    }

    /* Import/Export Menu Button */
    .menu-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      border: none;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 1800;
      transition: all 0.15s ease;
      color: white;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    }

    .menu-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(139, 92, 246, 0.5);
    }

    .menu-btn:active {
      transform: scale(0.98);
    }

    /* Import/Export Menu Dropdown */
    .import-export-menu {
      position: fixed;
      top: 76px;
      right: 20px;
      width: 240px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      z-index: 1800;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px) scale(0.96);
      transition: all 0.2s ease;
      overflow: hidden;
    }

    .import-export-menu.active {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }

    .menu-header {
      padding: 16px 16px 12px;
      font-weight: 700;
      font-size: 11px;
      color: var(--text-secondary);
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: var(--bg-hover);
    }

    .menu-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
    }

    .menu-item:hover {
      background: var(--bg-hover);
    }

    .menu-item:active {
      background: var(--bg-hover);
      transform: scale(0.98);
    }

    .menu-item svg {
      flex-shrink: 0;
      color: #6b7280;
    }

    .menu-item:hover svg {
      color: #1f2937;
    }

    .menu-item span {
      flex: 1;
    }

    /* Mobile Menu Button */
    .mobile-menu-btn {
      display: none;
      position: fixed;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      z-index: 2000;
      width: 36px;
      height: 72px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      backdrop-filter: blur(10px);
      border: none;
      border-radius: 0 16px 16px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      box-shadow: 4px 0 16px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      pointer-events: all;
      color: white;
    }

    .mobile-menu-btn:active {
      transform: translateY(-50%) scale(0.95);
    }

    .mobile-menu-btn svg {
      transition: transform 0.3s ease;
    }

    .mobile-menu-btn.active {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      left: 300px;
    }

    .mobile-menu-btn.active svg {
      transform: rotate(180deg);
    }

    /* Mobile Overlay */
    .mobile-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1500;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .mobile-overlay.active {
      opacity: 1;
      pointer-events: all;
    }

    /* Mobile Responsive Styles */
    @media (max-width: 768px) {
      .canvas-container {
        padding-left: 0;
      }

      .mobile-menu-btn {
        display: flex;
      }

      .mobile-overlay {
        display: block;
      }

      .notes-panel-wrapper {
        transform: translateX(-100%) !important;
      }

      .notes-panel-wrapper.mobile-open {
        transform: translateX(0) !important;
      }

      .toolbar {
        left: 8px;
        right: 8px;
        top: 8px;
        bottom: auto;
        transform: none;
        display: flex;
        flex-direction: column;
        max-width: none;
        width: calc(100vw - 16px);
        padding: 6px;
        border-radius: 16px;
        gap: 6px;
      }

      .toolbar-row {
        display: flex;
        gap: 6px;
      }

      .toolbar-row:first-child {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
      }

      .toolbar-row:nth-child(2) {
        display: none; /* Hide rich text controls on mobile - they're in the bottom toolbar */
      }

      .toolbar-row:last-child {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
      }

      .toolbar-btn:nth-child(1) { grid-column: auto; grid-row: auto; }
      .toolbar-btn:nth-child(2) { grid-column: auto; grid-row: auto; }
      .toolbar-btn:nth-child(3) { grid-column: auto; grid-row: auto; }
      .toolbar-btn:nth-child(4) { grid-column: auto; grid-row: auto; }
      .toolbar-btn:nth-child(5) { grid-column: auto; grid-row: auto; }
      .toolbar-btn:nth-child(6) { grid-column: auto; grid-row: auto; }
      .toolbar-btn:nth-child(7) { grid-column: auto; grid-row: auto; }
      .toolbar-btn:nth-child(8) { grid-column: auto; grid-row: auto; }
      .toolbar-btn:nth-child(9) { grid-column: auto; grid-row: auto; }
      .toolbar-btn:nth-child(10) { grid-column: auto; grid-row: auto; }
      .toolbar-btn:nth-child(11) { grid-column: auto; grid-row: auto; }

      .toolbar-group {
        display: contents;
      }

      .formatting-group {
        display: none;
      }

      .toolbar-btn {
        padding: 8px;
        font-size: 11px;
        min-height: 38px;
        min-width: auto;
      }

      .toolbar-btn.primary {
        grid-column: 1 / 1;
        grid-row: 1;
      }

      .zoom-controls {
        display: contents;
      }

      .toolbar-info {
        display: none;
      }

      .bottom-bar .bar-group:not(.format-tools) {
        display: none !important;
      }
      .bottom-bar .bar-group.format-tools {
        display: flex !important;
      }

      .fab-add:not(.mobile-fab-add) {
        display: none !important;
      }
      .mobile-fab-add {
        display: block !important;
        position: fixed;
        top: 80px;
        right: 24px;
        z-index: 1700;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .mobile-fab-add:active {
        transform: scale(0.96);
      }
    }

    @media (max-width: 480px) {
      .toolbar {
        padding: 4px 6px;
        gap: 4px;
      }

      .toolbar-btn {
        padding: 6px 10px;
        font-size: 11px;
      }

      .font-size-dropdown {
        padding: 6px 8px;
        font-size: 11px;
      }
    }

    @media (min-width: 769px) {
      .mobile-menu-btn {
        display: none !important;
      }
    }
  `]
})
export class CanvasComponent implements OnInit, OnDestroy {
  // bound wheel handler for global listening (prevents page zoom outside canvas)
  private boundGlobalWheelHandler: ((e: WheelEvent) => void) | null = null;
  private notesService = inject(NotesService);
  private canvasService = inject(CanvasService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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
  
  // Preview mode for note dragging (Android widget-like behavior)
  private draggedNoteId: string | null = null;
  private originalPositionsBackup = new Map<string, GridPosition>();
  private temporaryPositions = new Map<string, GridPosition>();
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
  isMobilePanelOpen = false;
  isMenuOpen = false;
  showDeleteTooltip = false;
  private deleteTooltipTimeout: any = null;

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

  // Touch event properties
  private lastTouchX = 0;
  private lastTouchY = 0;
  private lastTouchDistance = 0;
  private isTouchPanning = false;
  private isTouchPinching = false;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      // Single touch - potential pan
      const touch = event.touches[0];
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
      this.isTouchPanning = true;
    } else if (event.touches.length === 2) {
      // Two finger touch - pinch zoom
      this.isTouchPanning = false;
      this.isTouchPinching = true;
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.lastTouchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1 && this.isTouchPanning) {
      // Single touch pan
      event.preventDefault();
      const touch = event.touches[0];
      const dx = touch.clientX - this.lastTouchX;
      const dy = touch.clientY - this.lastTouchY;

      this.canvasOffset.x += dx;
      this.canvasOffset.y += dy;

      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
    } else if (event.touches.length === 2 && this.isTouchPinching) {
      // Pinch zoom
      event.preventDefault();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (this.lastTouchDistance > 0) {
        const scale = currentDistance / this.lastTouchDistance;
        this.canvasService.zoomBy(scale).catch(err => console.error('Zoom failed', err));
      }

      this.lastTouchDistance = currentDistance;
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (event.touches.length === 0) {
      this.isTouchPanning = false;
      this.isTouchPinching = false;
      this.lastTouchDistance = 0;
    } else if (event.touches.length === 1) {
      // Switched from pinch to pan
      this.isTouchPinching = false;
      const touch = event.touches[0];
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
      this.isTouchPanning = true;
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
          this.themeMode = 'dark'; // Default to dark mode
        }
      } else {
        this.themeMode = 'dark'; // Default to dark mode
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
      console.log('=== Notes subscription fired ===, loaded', notes.length, 'notes');
      
      // Log each note's position for debugging
      notes.forEach(note => {
        console.log('  Note', note.id.substring(0, 8), 'at position', note.position, 'object ref:', note);
      });
      
      this.notes = notes;
      
      // Clean up any notes with invalid coordinates
      this.fixInvalidNotePositions();
      console.log('=== Notes subscription END ===');
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
      // Use an exponential mapping for smooth zooming (increased to 0.008 for faster zoom)
      const factor = Math.exp(-dy * 0.008);
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
      // Focus the new note after a short delay to allow rendering
      setTimeout(() => {
        this.focusNote(note.id);
      }, 100);
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
    console.log('=== updateNotePosition called ===');
    console.log('  noteId:', noteId);
    console.log('  newPosition:', newPosition);
    
    // Find the note being moved
    const movedNote = this.notes.find(n => n.id === noteId);
    if (!movedNote) {
      console.log('  Note not found in array, updating service directly');
      this.notesService.updateNotePosition(noteId, newPosition).catch(error => {
        console.error('Error updating note position:', error);
      });
      return;
    }

    console.log('  movedNote.position BEFORE:', movedNote.position);

    // Normalize positions to handle -0 vs 0
    const normalizedNewX = newPosition.gridX === 0 ? 0 : newPosition.gridX;
    const normalizedNewY = newPosition.gridY === 0 ? 0 : newPosition.gridY;
    const normalizedOldX = movedNote.position.gridX === 0 ? 0 : movedNote.position.gridX;
    const normalizedOldY = movedNote.position.gridY === 0 ? 0 : movedNote.position.gridY;
    
    console.log('  normalizedOld:', { gridX: normalizedOldX, gridY: normalizedOldY });
    console.log('  normalizedNew:', { gridX: normalizedNewX, gridY: normalizedNewY });
    
    const finalPosition = { gridX: normalizedNewX, gridY: normalizedNewY };
    
    // Check if position actually changed
    if (normalizedOldX === normalizedNewX && normalizedOldY === normalizedNewY) {
      console.log('=== POSITION UNCHANGED - NO COLLISION CHECK, NO UPDATE ===');
      // Don't update the service - position hasn't changed
      // Updating would create a new note object, trigger subscription, and cause stale references
      return;
    }
    
    console.log('Position changed from', movedNote.position, 'to', finalPosition);

    // Check for overlaps and find new positions for overlapping notes
    const movedNoteRight = normalizedNewX + movedNote.size.width;
    const movedNoteBottom = normalizedNewY + movedNote.size.height;
    
    const movedNoteBounds = {
      left: normalizedNewX,
      right: movedNoteRight,
      top: normalizedNewY,
      bottom: movedNoteBottom,
      width: movedNote.size.width,
      height: movedNote.size.height
    };
    
    // Find overlapping notes and move them
    for (const otherNote of this.notes) {
      if (otherNote.id === noteId) continue;
      
      const otherLeft = otherNote.position.gridX;
      const otherRight = otherNote.position.gridX + otherNote.size.width;
      const otherTop = otherNote.position.gridY;
      const otherBottom = otherNote.position.gridY + otherNote.size.height;
      
      const overlapsX = !(movedNoteRight <= otherLeft || normalizedNewX >= otherRight);
      const overlapsY = !(movedNoteBottom <= otherTop || normalizedNewY >= otherBottom);
      
      if (overlapsX && overlapsY) {
        console.log('  Found overlapping note:', otherNote.id, 'at', otherNote.position);
        // Find next available position for the overlapping note
        const newOtherPosition = this.findNextAvailablePosition(otherNote, movedNoteBounds);
        console.log('  Moving overlapping note to:', newOtherPosition);
        
        if (newOtherPosition) {
          this.notesService.updateNotePosition(otherNote.id, newOtherPosition).catch((error: unknown) => {
            console.error('Error moving overlapping note:', error);
          });
        }
      }
    }
    
    // Save the moved note's position with normalized values
    console.log('  Saving final position:', finalPosition);
    this.notesService.updateNotePosition(noteId, finalPosition).catch(error => {
      console.error('Error updating note position:', error);
    });
    console.log('=== updateNotePosition END ===');
  }

  private previewNotePosition(movedNote: Note, newPosition: GridPosition): void {
    // Temporarily update the moved note's position in the array (for visual feedback)
    movedNote.position = newPosition;
    
    const movedNoteRight = newPosition.gridX + movedNote.size.width;
    const movedNoteBottom = newPosition.gridY + movedNote.size.height;
    
    // Create bounds for the moved note at its new position
    const movedNoteBounds = {
      left: newPosition.gridX,
      right: movedNoteRight,
      top: newPosition.gridY,
      bottom: movedNoteBottom,
      width: movedNote.size.width,
      height: movedNote.size.height
    };
    
    // Clear previous temporary positions (except the dragged note)
    this.temporaryPositions.clear();
    
    // Restore all other notes to their original positions first
    this.notes.forEach(note => {
      if (note.id !== movedNote.id) {
        const original = this.originalPositionsBackup.get(note.id);
        if (original) {
          note.position = { ...original };
        }
      }
    });
    
    // Find overlapping notes and calculate their temporary positions
    for (const otherNote of this.notes) {
      if (otherNote.id === movedNote.id) continue;
      
      const original = this.originalPositionsBackup.get(otherNote.id);
      if (!original) continue;
      
      // Check if note at original position overlaps with moved note
      const otherLeft = original.gridX;
      const otherRight = original.gridX + otherNote.size.width;
      const otherTop = original.gridY;
      const otherBottom = original.gridY + otherNote.size.height;
      
      const overlapsX = !(movedNoteRight <= otherLeft || newPosition.gridX >= otherRight);
      const overlapsY = !(movedNoteBottom <= otherTop || newPosition.gridY >= otherBottom);
      
      if (overlapsX && overlapsY) {
        // Find next available position for preview
        const tempPosition = this.findNextAvailablePosition(otherNote, movedNoteBounds);
        
        if (tempPosition) {
          // Store temporary position
          this.temporaryPositions.set(otherNote.id, tempPosition);
          // Update visual position temporarily
          otherNote.position = tempPosition;
        }
      }
    }
  }

  private resolveOverlapsForMovedNote(movedNote: Note, newPosition: GridPosition): void {
    // Validate input position
    if (!isFinite(newPosition.gridX) || !isFinite(newPosition.gridY)) {
      console.error('Invalid position for moved note:', newPosition);
      return;
    }
    
    const movedNoteRight = newPosition.gridX + movedNote.size.width;
    const movedNoteBottom = newPosition.gridY + movedNote.size.height;
    
    // Create a temporary bounds object for the moved note at its new position
    const movedNoteBounds = {
      left: newPosition.gridX,
      right: movedNoteRight,
      top: newPosition.gridY,
      bottom: movedNoteBottom,
      width: movedNote.size.width,
      height: movedNote.size.height
    };
    
    // Find all overlapping notes and move them to available positions
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
        // Find next available position for the overlapping note
        const newOtherPosition = this.findNextAvailablePosition(otherNote, movedNoteBounds);
        
        if (newOtherPosition) {
          this.notesService.updateNotePosition(otherNote.id, newOtherPosition).catch((error: unknown) => {
            console.error('Error moving note to available position:', error);
          });
        }
      }
    }
  }

  private findNextAvailablePosition(
    note: Note, 
    blockingNoteBounds: { left: number; right: number; top: number; bottom: number; width: number; height: number },
    preferredDirection?: { horizontal: 'left' | 'right' | 'none'; vertical: 'up' | 'down' | 'none' }
  ): GridPosition | null {
    // Start searching from the note's current position
    const startX = note.position.gridX;
    const startY = note.position.gridY;
    
    // If we have a preferred direction, try just one step in that direction first
    if (preferredDirection) {
      // Determine search increments based on preferred direction
      const xIncrement = preferredDirection.horizontal === 'right' ? 1 : 
                        preferredDirection.horizontal === 'left' ? -1 : 0;
      const yIncrement = preferredDirection.vertical === 'down' ? 1 : 
                        preferredDirection.vertical === 'up' ? -1 : 0;
      
      // Try just one step in the preferred direction
      const testX = startX + xIncrement;
      const testY = startY + yIncrement;
      
      if (this.isPositionAvailable(testX, testY, note.size.width, note.size.height, note.id, blockingNoteBounds)) {
        return { gridX: testX, gridY: testY };
      }
      
      // If one step doesn't work, try a bit further (max 3 steps in preferred direction)
      const maxDirectionalSearch = 3;
      for (let step = 2; step <= maxDirectionalSearch; step++) {
        const testXFar = startX + (xIncrement * step);
        const testYFar = startY + (yIncrement * step);
        
        if (this.isPositionAvailable(testXFar, testYFar, note.size.width, note.size.height, note.id, blockingNoteBounds)) {
          return { gridX: testXFar, gridY: testYFar };
        }
      }
      
      // Try perpendicular directions if primary direction fails
      if (xIncrement !== 0) {
        // Was moving horizontally, try vertically
        for (let step = 1; step <= maxDirectionalSearch; step++) {
          // Try down
          const testXDown = startX + xIncrement;
          const testYDown = startY + step;
          if (this.isPositionAvailable(testXDown, testYDown, note.size.width, note.size.height, note.id, blockingNoteBounds)) {
            return { gridX: testXDown, gridY: testYDown };
          }
          
          // Try up
          const testXUp = startX + xIncrement;
          const testYUp = startY - step;
          if (this.isPositionAvailable(testXUp, testYUp, note.size.width, note.size.height, note.id, blockingNoteBounds)) {
            return { gridX: testXUp, gridY: testYUp };
          }
        }
      }
      
      if (yIncrement !== 0) {
        // Was moving vertically, try horizontally
        for (let step = 1; step <= maxDirectionalSearch; step++) {
          // Try right
          const testXRight = startX + step;
          const testYRight = startY + yIncrement;
          if (this.isPositionAvailable(testXRight, testYRight, note.size.width, note.size.height, note.id, blockingNoteBounds)) {
            return { gridX: testXRight, gridY: testYRight };
          }
          
          // Try left
          const testXLeft = startX - step;
          const testYLeft = startY + yIncrement;
          if (this.isPositionAvailable(testXLeft, testYLeft, note.size.width, note.size.height, note.id, blockingNoteBounds)) {
            return { gridX: testXLeft, gridY: testYLeft };
          }
        }
      }
    }
    
    // Fall back to spiral pattern if directional search fails
    const maxSearchRadius = 20;
    
    for (let radius = 0; radius <= maxSearchRadius; radius++) {
      // Check positions in a square ring at this radius
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Only check the outer ring (skip inner squares we already checked)
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          
          const testX = startX + dx;
          const testY = startY + dy;
          
          // Check if this position is available
          if (this.isPositionAvailable(testX, testY, note.size.width, note.size.height, note.id, blockingNoteBounds)) {
            return { gridX: testX, gridY: testY };
          }
        }
      }
    }
    
    // If no position found in the search area, just offset from current position
    return { gridX: startX + maxSearchRadius, gridY: startY };
  }

  private isPositionAvailable(
    gridX: number,
    gridY: number,
    width: number,
    height: number,
    noteId: string,
    blockingNoteBounds: { left: number; right: number; top: number; bottom: number; width: number; height: number }
  ): boolean {
    const right = gridX + width;
    const bottom = gridY + height;
    
    // First check against the blocking note (moved note at its new position)
    const overlapsBlockingX = !(right <= blockingNoteBounds.left || gridX >= blockingNoteBounds.right);
    const overlapsBlockingY = !(bottom <= blockingNoteBounds.top || gridY >= blockingNoteBounds.bottom);
    
    if (overlapsBlockingX && overlapsBlockingY) {
      return false; // Position overlaps with the note that's blocking
    }
    
    // Check against all other notes
    for (const otherNote of this.notes) {
      if (otherNote.id === noteId) continue;
      
      const otherLeft = otherNote.position.gridX;
      const otherRight = otherNote.position.gridX + otherNote.size.width;
      const otherTop = otherNote.position.gridY;
      const otherBottom = otherNote.position.gridY + otherNote.size.height;
      
      // Check for overlap
      const overlapsX = !(right <= otherLeft || gridX >= otherRight);
      const overlapsY = !(bottom <= otherTop || gridY >= otherBottom);
      
      if (overlapsX && overlapsY) {
        return false; // Position is occupied
      }
    }
    
    return true; // Position is available
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
    const newRight = resizingNote.position.gridX + newSize.width;
    const newBottom = resizingNote.position.gridY + newSize.height;

    // Only check if note is expanding
    if (newSize.width <= oldSize.width && newSize.height <= oldSize.height) {
      return;
    }

    // Create a temporary bounds object for the resizing note at its new size
    const resizingNoteBounds = {
      left: resizingNote.position.gridX,
      right: newRight,
      top: resizingNote.position.gridY,
      bottom: newBottom,
      width: newSize.width,
      height: newSize.height
    };

    // Find notes that would be overlapped and move them to available positions
    for (const otherNote of this.notes) {
      if (otherNote.id === resizingNote.id) continue;

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
        // Calculate the direction the overlapping note is relative to the resizing note
        const noteCenterX = otherNote.position.gridX + otherNote.size.width / 2;
        const noteCenterY = otherNote.position.gridY + otherNote.size.height / 2;
        const resizingCenterX = resizingNote.position.gridX + newSize.width / 2;
        const resizingCenterY = resizingNote.position.gridY + newSize.height / 2;
        
        const deltaX = noteCenterX - resizingCenterX;
        const deltaY = noteCenterY - resizingCenterY;
        
        // Determine primary direction based on which delta is larger
        const preferredDirection = {
          horizontal: Math.abs(deltaX) > Math.abs(deltaY) 
            ? (deltaX > 0 ? 'right' as const : 'left' as const)
            : 'none' as const,
          vertical: Math.abs(deltaY) > Math.abs(deltaX)
            ? (deltaY > 0 ? 'down' as const : 'up' as const)
            : 'none' as const
        };
        
        // Find next available position for the overlapping note in the preferred direction
        const newOtherPosition = this.findNextAvailablePosition(otherNote, resizingNoteBounds, preferredDirection);
        
        if (newOtherPosition) {
          this.notesService.updateNotePosition(otherNote.id, newOtherPosition).catch((error: unknown) => {
            console.error('Error moving note during resize:', error);
          });
        }
      }
    }
  }

  deleteNote(noteId: string): void {
    this.notesService.deleteNote(noteId).catch(error => {
      console.error('Error deleting note:', error);
    });
  }

  handleDeleteSingleClick(): void {
    // Show tooltip on single click
    this.showDeleteTooltip = true;
    
    // Clear any existing timeout
    if (this.deleteTooltipTimeout) {
      clearTimeout(this.deleteTooltipTimeout);
    }
    
    // Auto-hide tooltip after 2 seconds
    this.deleteTooltipTimeout = setTimeout(() => {
      this.showDeleteTooltip = false;
      this.deleteTooltipTimeout = null;
    }, 2000);
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

  exportNotes(): void {
    if (this.notes.length === 0) {
      alert('No notes to export!');
      return;
    }

    // Create export data with timestamp
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      notes: this.notes
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `qiknotes-export-${dateStr}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`Exported ${this.notes.length} notes`);
  }

  importNotes(): void {
    // Trigger file input click
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    try {
      // Read file content
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!data.notes || !Array.isArray(data.notes)) {
        alert('Invalid file format! Expected a QikNotes export file.');
        return;
      }
      
      // Import notes (merge with existing)
      let importedCount = 0;
      for (const noteData of data.notes) {
        // Validate note structure
        if (!noteData.position || !noteData.content) {
          console.warn('Skipping invalid note:', noteData);
          continue;
        }
        
        // Create note at original position
        await this.notesService.createNote(
          noteData.position,
          noteData.content
        );
        importedCount++;
      }
      
      alert(`Successfully imported ${importedCount} notes!`);
      console.log(`Imported ${importedCount} notes from ${file.name}`);
      
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import notes. Please check the file format.');
    } finally {
      // Reset file input
      input.value = '';
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

  toggleMobilePanel(): void {
    this.isMobilePanelOpen = !this.isMobilePanelOpen;
    console.log('Mobile panel toggled:', this.isMobilePanelOpen);
  }

  closeMobilePanel(): void {
    this.isMobilePanelOpen = false;
    console.log('Mobile panel closed');
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
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

  onNoteDragStart(noteId: string): void {
    this.isDraggingNote = true;
    this.draggedNoteId = noteId;
    console.log('Drag started for note:', noteId);
  }

  onNoteDragEnd(): void {
    console.log('onNoteDragEnd called, draggedNoteId:', this.draggedNoteId);
    
    // Clear drag state
    this.isDraggingNote = false;
    this.draggedNoteId = null;
    console.log('Drag state cleared');
    
    // Reset z-index for all notes after drag ends
    this.notes.forEach(note => {
      const noteElement = document.querySelector(`[data-note-id="${note.id}"]`) as HTMLElement;
      if (noteElement) {
        noteElement.style.zIndex = '';
      }
    });
  }

  onNoteDragCancelled(): void {
    console.log('Drag cancelled');
    
    // Clear drag state
    this.isDraggingNote = false;
    this.draggedNoteId = null;
    
    // Reset z-index for all notes
    this.notes.forEach(note => {
      const noteElement = document.querySelector(`[data-note-id="${note.id}"]`) as HTMLElement;
      if (noteElement) {
        noteElement.style.zIndex = '';
      }
    });
  }

  onNoteDragMove(draggedNoteId: string, dragBounds: { gridX: number; gridY: number; width: number; height: number }): void {
    // Just update z-index for visual feedback during drag
    // Don't modify positions yet - that happens on drop
    this.notes.forEach(note => {
      if (note.id === draggedNoteId) return;

      const noteLeft = note.position.gridX;
      const noteRight = note.position.gridX + note.size.width;
      const noteTop = note.position.gridY;
      const noteBottom = note.position.gridY + note.size.height;

      const dragLeft = dragBounds.gridX;
      const dragRight = dragBounds.gridX + dragBounds.width;
      const dragTop = dragBounds.gridY;
      const dragBottom = dragBounds.gridY + dragBounds.height;

      const overlaps = !(noteRight <= dragLeft || noteLeft >= dragRight || 
                        noteBottom <= dragTop || noteTop >= dragBottom);

      const noteElement = document.querySelector(`[data-note-id="${note.id}"]`) as HTMLElement;
      if (noteElement && overlaps) {
        noteElement.style.zIndex = '1';
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
      // Create new object reference for change detection
      this.canvasOffset = {
        x: -note.position.gridX * cellWidth,
        y: -note.position.gridY * cellHeight
      };

      console.log('🎯 NAVIGATING TO NOTE 🎯', {
        grid: note.position, 
        offset: this.canvasOffset,
        noteWorldPos: {
          x: 5000 + (note.position.gridX * cellWidth),
          y: 5000 + (note.position.gridY * cellHeight)
        },
        cellSize: { width: cellWidth, height: cellHeight }
      });

      // Manually trigger change detection
      this.cdr.detectChanges();
      
      // Force browser reflow to apply the transform immediately
      const canvasArea = document.querySelector('.canvas-area');
      if (canvasArea) {
        // Reading offsetHeight forces a reflow
        void canvasArea.getBoundingClientRect();
        
        // Check what CSS variables are actually set
        const computedStyle = window.getComputedStyle(canvasArea);
        const actualOffsetX = computedStyle.getPropertyValue('--offset-x');
        const actualOffsetY = computedStyle.getPropertyValue('--offset-y');
        const actualTransform = computedStyle.getPropertyValue('transform');
        
        console.log('🔄 Browser reflow forced', {
          expectedOffset: this.canvasOffset,
          actualCSSVars: { x: actualOffsetX, y: actualOffsetY },
          actualTransform: actualTransform
        });
      }

      // Re-enable transition after a brief delay
      setTimeout(() => {
        this.isNavigating = false;
        // Highlight and focus after navigation is complete
        setTimeout(() => {
          if (this.activeNoteId === note.id) {
            this.highlightNote(note.id);
            this.focusNote(note.id);
          }
        }, 50);
      }, 100);
    }, 0);
  }

  focusNote(noteId: string): void {
    // Find the note component and focus its content
    setTimeout(() => {
      const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
      if (noteElement) {
        const contentEditableDiv = noteElement.querySelector('[contenteditable="true"]') as HTMLElement;
        if (contentEditableDiv) {
          contentEditableDiv.focus();
          
          // Place cursor at the end of the content
          const range = document.createRange();
          const sel = window.getSelection();
          
          if (contentEditableDiv.childNodes.length > 0) {
            const lastNode = contentEditableDiv.childNodes[contentEditableDiv.childNodes.length - 1];
            range.setStart(lastNode, lastNode.textContent?.length || 0);
          } else {
            range.setStart(contentEditableDiv, 0);
          }
          
          range.collapse(true);
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
    }, 150);
  }

  setActiveNote(noteId: string): void {
    this.activeNoteId = noteId;
  }

  trackByNoteId(index: number, note: Note): string {
    return note.id;
  }
}