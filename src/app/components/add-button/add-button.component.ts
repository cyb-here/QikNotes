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
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 1000;
      transform: translate(-50%, -50%);
    }

    .add-button-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #4285f4;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: bold;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      border: 3px solid white;
    }

    .add-button-icon:hover {
      background: #3367d6;
      transform: scale(1.15);
      box-shadow: 0 6px 16px rgba(0,0,0,0.4);
    }

    .add-button:active .add-button-icon {
      transform: scale(0.95);
    }
  `]
})
export class AddButtonComponent {
  @Input({ required: true }) position!: GridPosition;
  @Input({ required: true }) cellWidth!: number;
  @Input({ required: true }) cellHeight!: number;
  @Output() addNote = new EventEmitter<GridPosition>();

  getPixelPosition(): { left: number, top: number } {
    // Position at the center of the grid cell
    const left = this.position.gridX * this.cellWidth + (this.cellWidth / 2);
    const top = this.position.gridY * this.cellHeight + (this.cellHeight / 2);
    return { left, top };
  }

  onAddNote(event: MouseEvent): void {
    console.log('🎯 ADD BUTTON CLICKED! Position:', this.position);
    event.stopPropagation();
    event.preventDefault();
    this.addNote.emit(this.position);
  }
}