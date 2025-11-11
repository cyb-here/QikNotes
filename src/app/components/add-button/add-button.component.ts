import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridPosition } from '../../models';

@Component({
  selector: 'app-add-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="add-button"
      [style.left.px]="getPixelPosition().left"
      [style.top.px]="getPixelPosition().top"
      (click)="onAddNote($event)"
      (mousedown)="$event.stopPropagation()">
      
      <div class="add-button-icon">
        +
      </div>
    </div>
  `,
  styles: [`
    .add-button {
      position: absolute;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 1000;
      transform: translate(-50%, -50%);
      pointer-events: all;
    }

    .add-button-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255,255,255,0.95); /* subtle near-white */
      color: rgba(0,0,0,0.75); /* muted icon color */
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      box-shadow: 0 2px 6px rgba(16,24,40,0.06);
      border: 1px solid rgba(16,24,40,0.06);
      transform-origin: center;
      will-change: transform;
    }

    .add-button-icon:hover {
      background: rgba(250,250,250,0.98);
      transform: scale(1.04);
      box-shadow: 0 6px 14px rgba(16,24,40,0.08);
    }

    .add-button:active .add-button-icon {
      transform: scale(0.98);
      background: rgba(245,245,245,0.98);
    }
  `]
})
export class AddButtonComponent {
  @Input({ required: true }) position!: GridPosition;
  @Input({ required: true }) cellWidth!: number;
  @Input({ required: true }) cellHeight!: number;
  @Output() addNote = new EventEmitter<GridPosition>();

  getPixelPosition(): { left: number, top: number } {
    // Position at the center of the grid cell, relative to canvas center (5000px offset)
    const left = 5000 + (this.position.gridX * this.cellWidth) + (this.cellWidth / 2);
    const top = 5000 + (this.position.gridY * this.cellHeight) + (this.cellHeight / 2);
    return { left, top };
  }

  onAddNote(event: MouseEvent): void {
    console.log('🎯 ADD BUTTON CLICKED! Position:', this.position);
    event.stopPropagation();
    event.preventDefault();
    this.addNote.emit(this.position);
  }
}