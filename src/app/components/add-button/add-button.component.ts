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
      [style.left.px]="position.gridX * cellWidth"
      [style.top.px]="position.gridY * cellHeight"
      (click)="onAddNote()">
      
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
      z-index: 10;
      transform: translate(-50%, -50%);
    }

    .add-button-icon {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #4285f4;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      transition: all 0.2s ease;
      opacity: 0.7;
    }

    .add-button-icon:hover {
      opacity: 1;
      transform: scale(1.1);
      background: #3367d6;
    }
  `]
})
export class AddButtonComponent {
  @Input({ required: true }) position!: GridPosition;
  @Input({ required: true }) cellWidth!: number;
  @Input({ required: true }) cellHeight!: number;
  @Output() addNote = new EventEmitter<GridPosition>();

  onAddNote(): void {
    this.addNote.emit(this.position);
  }
}