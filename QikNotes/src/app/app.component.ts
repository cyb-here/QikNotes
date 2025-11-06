import { Component } from '@angular/core';
import { CanvasComponent } from './components/canvas/canvas.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CanvasComponent],
  template: `<app-canvas></app-canvas>`,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
    }
  `]
})
export class AppComponent {
  title = 'whiteboard-notes';
}