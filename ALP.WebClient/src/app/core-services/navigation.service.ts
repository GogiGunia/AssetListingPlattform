import { Injectable, signal, computed } from '@angular/core';
import { NavigationItem } from '../core-models/model';

@Injectable()
export class NavigationService {

  private defaultNavigationItems: NavigationItem[] = [
    {
      id: 'realestate',
      name: 'Real Estate',
      component: 'RealEstateComponent',
      isActive: true
    },
    {
      id: 'autos',
      name: 'Autos',
      component: 'AutosComponent',
      isActive: false
    },
    {
      id: 'yachts',
      name: 'Yachts',
      component: 'YachtsComponent',
      isActive: false
    },
    {
      id: 'jobs',
      name: 'Jobs',
      component: 'JobsComponent',
      isActive: false
    }
  ];

  // Signal for navigation items
  private navigationItemsSignal = signal<NavigationItem[]>(this.defaultNavigationItems);

  // Computed signal for current active item
  public currentActiveItemSignal = computed(() => {
    const items = this.navigationItemsSignal();
    return items.find(item => item.isActive) || items[0];
  });

  // Public readonly signal for navigation items
  public navigationItemsSignal$ = this.navigationItemsSignal.asReadonly();

  // Get current navigation items
  public getNavigationItems(): NavigationItem[] {
    return this.navigationItemsSignal();
  }

  // Get current active item
  public getCurrentActiveItem(): NavigationItem {
    return this.currentActiveItemSignal();
  }

  // Set active navigation item
  public setActiveItem(itemId: string): void {
    const items = this.navigationItemsSignal().map(item => ({
      ...item,
      isActive: item.id === itemId
    }));

    this.navigationItemsSignal.set(items);
    console.log('Navigation service - Active item changed to:', itemId);
    console.log('Navigation service - Current items:', this.navigationItemsSignal());
  }

  // Add new navigation item
  public addNavigationItem(item: NavigationItem): void {
    const items = [...this.navigationItemsSignal(), item];
    this.navigationItemsSignal.set(items);
  }

  // Remove navigation item
  public removeNavigationItem(itemId: string): void {
    const items = this.navigationItemsSignal().filter(item => item.id !== itemId);
    this.navigationItemsSignal.set(items);
  }

  // Update navigation items
  public updateNavigationItems(items: NavigationItem[]): void {
    this.navigationItemsSignal.set(items);
  }
}
