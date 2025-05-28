import { Component, EventEmitter, Inject, Input, Output, signal, computed, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationComponent } from '../navigation/navigation.component';
import { NavigationItem } from '../../core-models/model';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-toolbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, NavigationComponent, MatTooltipModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  public currentAppTitle: string;

  // Input signal for navigation items
  private navigationItemsInputSignal = signal<NavigationItem[]>([]);

  // Computed signal that child components can use
  public navigationItemsSignal = computed(() => this.navigationItemsInputSignal());

  @Output() navigationChange = new EventEmitter<NavigationItem>();

  @Input()
  set navigationItems(items: NavigationItem[]) {
    this.navigationItemsInputSignal.set(items);
  }

  get navigationItems(): NavigationItem[] {
    return this.navigationItemsInputSignal();
  }

  constructor(@Inject('APP_TITLE') appTitle: string) {
    this.currentAppTitle = appTitle;

    // Effect to log navigation items changes
    effect(() => {
      console.log("Toolbar component - Navigation items changed:");
      console.log(this.navigationItemsSignal());
    });
  }

  public onNavigationClick(item: NavigationItem) {
    console.log("Toolbar component - Navigation click:", item);
    this.navigationChange.emit(item);
  }
}
