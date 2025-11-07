import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasSettings } from '../../models';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="grid" 
      *ngIf="settings.showGrid"
      [style.background-size]="getGridSize()"
      [style.background-image]="getGridImage()">
    </div>
  `,
  styles: [`
    .grid {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      background-position: center;
      --grid-color: #e0e0e0;
    }
  `]
})
export class GridComponent {
  @Input({ required: true }) settings!: CanvasSettings;

  getGridSize(): string {
    return `${this.settings.cellWidth}px ${this.settings.cellHeight}px`;
  }

  getGridImage(): string {
    return `
      linear-gradient(to right, var(--grid-color, #e0e0e0) 1px, transparent 1px),
      linear-gradient(to bottom, var(--grid-color, #e0e0e0) 1px, transparent 1px)
    `;
  }
}