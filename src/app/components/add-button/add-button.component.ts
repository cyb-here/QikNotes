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
      background: #4285f4;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      border: 2px solid white;
      transform-origin: center;
      will-change: transform;
    }

    .add-button-icon:hover {
      background: #3367d6;
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .add-button:active .add-button-icon {
      transform: scale(0.9);
      background: #2850a7;
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