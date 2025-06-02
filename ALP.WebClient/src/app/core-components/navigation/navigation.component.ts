import { Component, EventEmitter, Input, Output, signal, computed, effect } from '@angular/core';
import { NavigationItem } from '../../core-models/model';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navigation',
  imports: [MatButtonModule, CommonModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {

  // Input signal for navigation items
  private navigationItemsInputSignal = signal<NavigationItem[]>([]);

  // Computed signal for navigation items
  public navigationItemsSignal = computed(() => this.navigationItemsInputSignal());

  // Computed signal for active item
  public activeItemSignal = computed(() => {
    const items = this.navigationItemsSignal();
    return items.find(item => item.isActive) || null;
  });

  @Output() navigationClick = new EventEmitter<NavigationItem>();

  @Input()
  set navigationItems(items: NavigationItem[]) {
    this.navigationItemsInputSignal.set(items);
  }

  get navigationItems(): NavigationItem[] {
    return this.navigationItemsInputSignal();
  }

  constructor() {
    // Effect to log navigation items changes
    effect(() => {
      //console.log("Navigation component - Navigation items changed:");
      //console.log(this.navigationItemsSignal());
      //console.log("Navigation component - Active item:");
      //console.log(this.activeItemSignal());
    });
  }

  public onNavigationClick(item: NavigationItem) {
   /* console.log("Navigation component - Item clicked:", item);*/

    // Update active state locally (for immediate UI feedback)
    const updatedItems = this.navigationItemsSignal().map(navItem => ({
      ...navItem,
      isActive: navItem.id === item.id
    }));

    this.navigationItemsInputSignal.set(updatedItems);

    // Emit the clicked item
    this.navigationClick.emit(item);
  }
}
