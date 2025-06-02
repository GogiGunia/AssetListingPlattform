import { Component, EventEmitter, Inject, Input, Output, signal, computed, effect, HostListener } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationComponent } from '../navigation/navigation.component';
import { NavigationItem } from '../../core-models/model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LogoutService } from '../../core-services/logout.service';
import { UserService } from '../../core-services/user.service';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, NavigationComponent, MatTooltipModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  public currentAppTitle: string;
  public isMobileNavOpen = false;

  // Input signals for navigation items (from parent - NavigationService)
  private navigationMenuItemsInputSignal = signal<NavigationItem[]>([]);
  private toolbarActionItemsInputSignal = signal<NavigationItem[]>([]);

  // Computed signals that pass through input items (no modification needed here since NavigationService handles auth logic)
  public navigationMenuItemsSignal = computed(() => this.navigationMenuItemsInputSignal());
  public toolbarActionItemsSignal = computed(() => this.toolbarActionItemsInputSignal());

  // Authentication state signals for display purposes
  public isAuthenticated = computed(() => this.userService.isAuthenticated());
  public userDisplayName = computed(() => this.userService.userDisplayName());
  public userEmail = computed(() => this.userService.userEmail());

  @Output() navigationChange = new EventEmitter<NavigationItem>();
  @Output() toolbarActionClick = new EventEmitter<NavigationItem>();
  @Output() goBack = new EventEmitter<void>();
  @Output() goHome = new EventEmitter<void>();

  @Input()
  set navigationMenuItems(items: NavigationItem[]) {
    this.navigationMenuItemsInputSignal.set(items);
  }

  get navigationMenuItems(): NavigationItem[] {
    return this.navigationMenuItemsInputSignal();
  }

  @Input()
  set toolbarActionItems(items: NavigationItem[]) {
    this.toolbarActionItemsInputSignal.set(items);
  }

  get toolbarActionItems(): NavigationItem[] {
    return this.toolbarActionItemsInputSignal();
  }

  constructor(
    @Inject('APP_TITLE') appTitle: string,
    private userService: UserService
  ) {
    this.currentAppTitle = appTitle;

    // Effect to log changes (including authentication state)
    effect(() => {
      //console.log("Toolbar component - State changed:");
      //console.log("  Authentication:", this.isAuthenticated());
      //console.log("  User:", this.userDisplayName());
      //console.log("  Navigation items:", this.navigationMenuItemsSignal().length);
      //console.log("  Action items:", this.toolbarActionItemsSignal().length);
    });
  }

  /**
   * Listen for window resize events to close mobile nav when switching to desktop
   */
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any): void {
    // Close mobile nav when screen becomes desktop size
    if (event.target.innerWidth > 768 && this.isMobileNavOpen) {
      this.closeMobileNav();
    }
  }

  /**
   * Listen for escape key to close mobile navigation
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isMobileNavOpen) {
      this.closeMobileNav();
    }
  }

  /**
   * Toggle mobile navigation drawer
   */
  public toggleMobileNav(): void {
    this.isMobileNavOpen = !this.isMobileNavOpen;

    // Prevent body scroll when menu is open
    if (this.isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  /**
   * Close mobile navigation drawer
   */
  public closeMobileNav(): void {
    this.isMobileNavOpen = false;
    document.body.style.overflow = '';
  }

  /**
   * Handle mobile navigation item clicks
   */
  public onMobileNavItemClick(item: NavigationItem): void {
    //console.log("Toolbar component - Mobile nav item clicked:", item);

    // Close mobile nav
    this.closeMobileNav();

    // Emit navigation change
    this.navigationChange.emit(item);
  }

  /**
   * Handle navigation clicks - pass through to parent (NavigationService will handle routing)
   */
  public onNavigationClick(item: NavigationItem): void {
    //console.log("Toolbar component - Navigation click:", item);
    this.navigationChange.emit(item);
  }

  /**
   * Handle toolbar action clicks - pass through to parent (NavigationService will handle auth actions)
   */
  public onToolbarActionClick(item: NavigationItem): void {
    //console.log("Toolbar component - Toolbar action click:", item);
    this.toolbarActionClick.emit(item);
  }

  /**
   * Handle go back - pass through to parent
   */
  public onGoBackClick(): void {
    //console.log("Toolbar component - Go back click");
    this.goBack.emit();
  }

  /**
   * Handle go home - pass through to parent
   */
  public onGoHomeClick(): void {
    //console.log("Toolbar component - Go home click");
    this.goHome.emit();
  }
}
