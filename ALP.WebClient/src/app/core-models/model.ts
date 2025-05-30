// core-models/model.ts - Updated NavigationItem interface to match your structure
export interface NavigationItem {
  id: string;
  name: string;
  component: string;           // Component name to load
  isActive: boolean;
  showInNavigation: boolean;   // Controls whether item appears in navigation menu (true) or toolbar actions (false)
  icon: string;
  route?: string;              // Optional route for navigation (if different from id)
  tooltip?: string;            // Optional tooltip text
  disabled?: boolean;          // Optional disabled state
  badge?: string | number;     // Optional badge content
  children?: NavigationItem[]; // Optional child items for nested navigation
  action?: string;             // Optional action identifier for special handling
}

// Additional interfaces for specific use cases (keeping backward compatibility)
export interface ToolbarAction extends NavigationItem {
  showInNavigation: false;     // Toolbar actions don't show in navigation
  action?: string;             // Optional action for special handling
}

export interface MenuNavigationItem extends NavigationItem {
  showInNavigation: true;      // Menu items show in navigation
  route?: string;              // Optional route (defaults to id if not provided)
}

// Enum for common navigation actions
export enum NavigationAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PROFILE = 'profile',
  SETTINGS = 'settings',
  HOME = 'home',
  BACK = 'back'
}

// Factory functions for creating common navigation items with your structure
export class NavigationItemFactory {

  static createNavigationItem(
    id: string,
    name: string,
    component: string,
    icon: string,
    showInNavigation: boolean = true,
    isActive: boolean = false
  ): NavigationItem {
    return {
      id,
      name,
      component,
      isActive,
      showInNavigation,
      icon
    };
  }

  static createHomeItem(isActive: boolean = false): NavigationItem {
    return {
      id: 'home',
      name: 'Home',
      component: 'HomeComponent',
      isActive,
      showInNavigation: true,
      icon: 'home'
    };
  }

  static createLoginAction(): ToolbarAction {
    return {
      id: 'login',
      name: 'Login',
      component: 'LoginComponent',
      isActive: false,
      showInNavigation: false,
      icon: 'login',
      action: NavigationAction.LOGIN
    };
  }

  static createLogoutAction(): ToolbarAction {
    return {
      id: 'logout',
      name: 'Logout',
      component: '',
      isActive: false,
      showInNavigation: false,
      icon: 'logout',
      action: NavigationAction.LOGOUT
    };
  }

  static createProfileAction(displayName: string): ToolbarAction {
    return {
      id: 'profile',
      name: displayName,
      component: 'ProfileComponent',
      isActive: false,
      showInNavigation: false,
      icon: 'account_circle',
      action: NavigationAction.PROFILE
    };
  }

  static createAdminNavigationItem(isActive: boolean = false): NavigationItem {
    return {
      id: 'admin',
      name: 'Admin Panel',
      component: 'AdminComponent',
      isActive,
      showInNavigation: true,
      icon: 'admin_panel_settings'
    };
  }

  static createBusinessNavigationItem(isActive: boolean = false): NavigationItem {
    return {
      id: 'my-listings',
      name: 'My Listings',
      component: 'MyListingsComponent',
      isActive,
      showInNavigation: true,
      icon: 'list_alt'
    };
  }

  static createDashboardItem(isActive: boolean = false): NavigationItem {
    return {
      id: 'dashboard',
      name: 'Dashboard',
      component: 'DashboardComponent',
      isActive,
      showInNavigation: true,
      icon: 'dashboard'
    };
  }

  // Asset category items (your existing categories)
  static createRealEstateItem(isActive: boolean = false): NavigationItem {
    return {
      id: 'realestate',
      name: 'Real Estate',
      component: 'RealestateComponent',
      isActive,
      showInNavigation: true,
      icon: 'real_estate_agent'
    };
  }

  static createAutosItem(isActive: boolean = false): NavigationItem {
    return {
      id: 'autos',
      name: 'Autos',
      component: 'AutosComponent',
      isActive,
      showInNavigation: true,
      icon: 'directions_car'
    };
  }

  static createJobsItem(isActive: boolean = false): NavigationItem {
    return {
      id: 'jobs',
      name: 'Jobs',
      component: 'JobsComponent',
      isActive,
      showInNavigation: true,
      icon: 'work'
    };
  }

  static createYachtsItem(isActive: boolean = false): NavigationItem {
    return {
      id: 'yachts',
      name: 'Yachts',
      component: 'YachtsComponent',
      isActive,
      showInNavigation: true,
      icon: 'sailing'
    };
  }
}
