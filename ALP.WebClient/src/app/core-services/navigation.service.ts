import { Injectable, signal, computed, effect } from '@angular/core';
import { NavigationItem } from '../core-models/model';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LogoutService } from './logout.service';
import { UserService } from './user.service';

@Injectable()
export class NavigationService {

  // Your existing default navigation items (preserved exactly)
  private defaultNavigationItems: NavigationItem[] = [
    {
      id: 'home',
      name: 'Home',
      component: 'HomeComponent',
      isActive: true,
      showInNavigation: true,
      icon: 'home'
    },
    {
      id: 'realestate',
      name: 'Real Estate',
      component: 'RealestateComponent',
      isActive: false,
      showInNavigation: true,
      icon: 'real_estate_agent'
    },
    {
      id: 'autos',
      name: 'Autos',
      component: 'AutosComponent',
      isActive: false,
      showInNavigation: true,
      icon: 'directions_car'
    },
    {
      id: 'yachts',
      name: 'Yachts',
      component: 'YachtsComponent',
      isActive: false,
      showInNavigation: true,
      icon: 'sailing'
    },
    {
      id: 'jobs',
      name: 'Jobs',
      component: 'JobsComponent',
      isActive: false,
      showInNavigation: true,
      icon: 'work'
    },
    {
      id: 'login',
      name: 'Login',
      component: 'LoginComponent',
      isActive: false,
      showInNavigation: false, // Don't show in navigation menu
      icon: 'login'
    },
    {
      id: 'register',
      name: 'Register',
      component: 'RegisterComponent',
      isActive: false,
      showInNavigation: false, // Don't show in navigation menu
      icon: 'person_add'
    }
  ];

  // Navigation history for back functionality (preserved exactly)
  private navigationHistory: string[] = [];

  // Base navigation items signal (your existing items)
  private baseNavigationItemsSignal = signal<NavigationItem[]>(this.defaultNavigationItems);

  // Active route tracking signal for authentication-based items
  private activeRouteSignal = signal<string>('home');

  // Computed signal that combines base items with authentication-based items
  private navigationItemsSignal = computed(() => {
    const baseItems = this.baseNavigationItemsSignal();
    const authItems = this.getAuthenticationBasedItems();
    return [...baseItems, ...authItems];
  });

  // Your existing computed signals (preserved exactly)
  public currentActiveItemSignal = computed(() => {
    const items = this.navigationItemsSignal();
    return items.find(item => item.isActive) || items[0];
  });

  public navigationMenuItemsSignal = computed(() => {
    return this.navigationItemsSignal().filter(item => item.showInNavigation === true);
  });

  // FIXED: Authentication-aware toolbar actions
  public toolbarActionItemsSignal = computed(() => {
    const allActionItems = this.navigationItemsSignal().filter(item => item.showInNavigation === false);

    if (this.isAuthenticated()) {
      // When logged in, hide login/register, show logout/profile actions
      return allActionItems.filter(item => !['login', 'register'].includes(item.id));
    } else {
      // When not logged in, show login/register, hide logout/profile actions
      return allActionItems.filter(item => ['login', 'register'].includes(item.id));
    }
  });

  // Public readonly signal for all navigation items (preserved exactly)
  public navigationItemsSignal$ = computed(() => this.navigationItemsSignal());

  // Authentication state signals
  public isAuthenticated = computed(() => this.userService.isAuthenticated());
  public userDisplayName = computed(() => this.userService.userDisplayName());
  public userEmail = computed(() => this.userService.userEmail());

  constructor(
    private router: Router,
    private userService: UserService,
    private logoutService: LogoutService
  ) {
    // Your existing router event subscription (preserved exactly)
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateNavigationHistory(event.urlAfterRedirects);
        this.updateActiveItemFromRoute(event.urlAfterRedirects);
      });

    // Effect to log authentication changes and navigation updates
    effect(() => {
      //console.log('NavigationService - Authentication state changed:');
      //console.log('  Is authenticated:', this.isAuthenticated());
      //console.log('  User:', this.userDisplayName());
      //console.log('  Total navigation items:', this.navigationItemsSignal().length);
      //console.log('  Menu items:', this.navigationMenuItemsSignal().length);
      //console.log('  Action items:', this.toolbarActionItemsSignal().length);
    });
  }

  /**
   * Get authentication-based navigation items
   */
  private getAuthenticationBasedItems(): NavigationItem[] {
    const items: NavigationItem[] = [];
    const activeRoute = this.activeRouteSignal(); // Get current active route

    if (this.isAuthenticated()) {
      // Authenticated user navigation items (showInNavigation: true)
      items.push({
        id: 'dashboard',
        name: 'Dashboard',
        component: 'DashboardComponent',
        isActive: activeRoute === 'dashboard', // Set active based on current route
        showInNavigation: true,
        icon: 'dashboard'
      });

      // Role-based navigation items
      if (this.userService.hasAnyRole(['BusinessUser', 'Admin'])) {
        items.push({
          id: 'my-listings',
          name: 'My Listings',
          component: 'MyListingsComponent',
          isActive: activeRoute === 'my-listings', // Set active based on current route
          showInNavigation: true,
          icon: 'list_alt'
        });
      }

      if (this.userService.isAdmin()) {
        items.push({
          id: 'admin',
          name: 'Admin Panel',
          component: 'AdminComponent',
          isActive: activeRoute === 'admin', // Set active based on current route
          showInNavigation: true,
          icon: 'admin_panel_settings'
        });
      }

      // Authenticated user toolbar actions (showInNavigation: false)
      items.push({
        id: 'profile',
        name: `${this.userDisplayName()} (${this.userEmail()})`,
        component: 'ProfileComponent',
        isActive: activeRoute === 'profile', // Set active based on current route
        showInNavigation: false,
        icon: 'account_circle'
      });

      items.push({
        id: 'logout',
        name: 'Logout',
        component: '', // No component, it's an action
        isActive: false, // Logout is never "active"
        showInNavigation: false,
        icon: 'logout'
      });
    }
    // Note: login/register items are already in defaultNavigationItems

    return items;
  }

  // Your existing navigation history methods (preserved exactly)
  private updateNavigationHistory(url: string): void {
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const routeId = cleanUrl || 'home';

    if (this.navigationHistory.length === 0 ||
      this.navigationHistory[this.navigationHistory.length - 1] !== routeId) {
      this.navigationHistory.push(routeId);
      //  console.log('Navigation service - History updated:', this.navigationHistory);
    }
  }

  // FIXED: Update active item from route for both base and auth items
  private updateActiveItemFromRoute(url: string): void {
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const routeId = cleanUrl || 'home';

    // Update active route signal - this will trigger recomputation of authentication items
    this.activeRouteSignal.set(routeId);

    // Update base items
    const baseItems = this.baseNavigationItemsSignal().map(item => ({
      ...item,
      isActive: item.id === routeId
    }));

    this.baseNavigationItemsSignal.set(baseItems);
    //console.log('Navigation service - Active item updated from route:', routeId);
  }

  // Enhanced navigation method that handles authentication actions
  public navigateToRoute(routeId: string): void {
    //console.log('Navigation service - Navigating to route:', routeId);

    // Handle authentication-specific actions
    if (this.handleAuthenticationAction(routeId)) {
      return;
    }

    // Your existing navigation logic
    this.router.navigate([`/${routeId}`]);
  }

  /**
   * Handle authentication-specific actions
   */
  private handleAuthenticationAction(actionId: string): boolean {
    switch (actionId) {
      case 'login':
        //console.log('NavigationService - Handling login action');
        this.router.navigate(['/login']);
        return true;

      case 'register':
        //console.log('NavigationService - Handling register action');
        this.router.navigate(['/register']);
        return true;

      case 'logout':
        //console.log('NavigationService - Handling logout action');
        this.logoutService.logout().subscribe(() => {
          //  console.log('NavigationService - User logged out successfully');
        });
        return true;

      case 'profile':
        //console.log('NavigationService - Handling profile action');
        this.router.navigate(['/profile']);
        return true;

      default:
        return false;
    }
  }

  // Your existing methods (preserved exactly)
  public goBack(): void {
    //console.log('Navigation service - Go back called. Current history:', this.navigationHistory);

    if (this.navigationHistory.length >= 2) {
      this.navigationHistory.pop();
      const previousRoute = this.navigationHistory[this.navigationHistory.length - 1];
      //console.log('Navigation service - Going back to:', previousRoute);
      this.router.navigate([`/${previousRoute}`]);
    } else {
      //console.log('Navigation service - No previous route, going home');
      this.goHome();
    }
  }

  public goHome(): void {
    //console.log('Navigation service - Going home');
    this.navigationHistory = ['home'];
    this.router.navigate(['/home']);
  }

  public getNavigationItems(): NavigationItem[] {
    return this.navigationItemsSignal();
  }

  public getNavigationMenuItems(): NavigationItem[] {
    return this.navigationMenuItemsSignal();
  }

  public getToolbarActionItems(): NavigationItem[] {
    return this.toolbarActionItemsSignal();
  }

  public getCurrentActiveItem(): NavigationItem {
    return this.currentActiveItemSignal();
  }

  public setActiveItem(itemId: string): void {
    this.navigateToRoute(itemId);
  }

  public getNavigationHistory(): string[] {
    return [...this.navigationHistory];
  }

  // Enhanced methods that work with authentication
  public addNavigationItem(item: NavigationItem): void {
    const items = [...this.baseNavigationItemsSignal(), item];
    this.baseNavigationItemsSignal.set(items);
  }

  public removeNavigationItem(itemId: string): void {
    const items = this.baseNavigationItemsSignal().filter(item => item.id !== itemId);
    this.baseNavigationItemsSignal.set(items);
  }

  public updateNavigationItems(items: NavigationItem[]): void {
    this.baseNavigationItemsSignal.set(items);
  }

  // New authentication-aware methods
  public getCurrentUser(): any {
    return this.userService.getCurrentUser();
  }

  public isUserAuthenticated(): boolean {
    return this.isAuthenticated();
  }

  public getUserDisplayName(): string {
    return this.userDisplayName();
  }

  public hasUserRole(role: string): boolean {
    return this.userService.hasRole(role as any);
  }

  public canUserAccess(requiredRoles: string[]): boolean {
    return this.userService.hasAnyRole(requiredRoles as any[]);
  }
}
