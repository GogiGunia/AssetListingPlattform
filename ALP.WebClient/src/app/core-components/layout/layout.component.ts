import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-layout',
  imports: [CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  @Input() layoutClass: string = '';
  @Input() contentClass: string = '';
  @Input() maxWidth: string = '1200px';
  @Input() gap: string = '24px';
  @Input() padding: string = '24px';
}
