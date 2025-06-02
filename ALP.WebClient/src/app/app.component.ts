import { Component, OnInit, signal, computed, effect } from '@angular/core';
/*import { RouterOutlet } from '@angular/router';*/
import { LayoutComponent } from './core-components/layout/layout.component';
import { ToolbarComponent } from './core-components/toolbar/toolbar.component';
import { MatCardModule } from '@angular/material/card';
import { NavigationItem } from './core-models/model';
import { NavigationService } from './core-services/navigation.service';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { UserService } from './core-services/user.service';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent, ToolbarComponent, MatCardModule, CommonModule, RouterOutlet],
  providers: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  public navigationMenuItemsSignal = computed(() => this.navigationService.navigationMenuItemsSignal());
  public toolbarActionItemsSignal = computed(() => this.navigationService.toolbarActionItemsSignal());
  public currentActiveItemSignal = computed(() => this.navigationService.currentActiveItemSignal());

  // Additional authentication-aware signals (optional, for app-level logic)
  public isAuthenticated = computed(() => this.userService.isAuthenticated());
  public userDisplayName = computed(() => this.userService.userDisplayName());

  constructor(
    private navigationService: NavigationService,
    private userService: UserService  // Added for authentication awareness
  ) {
    // Enhanced effect that includes authentication state (preserves your existing logging)
    effect(() => {

    });
  }

  public ngOnInit(): void {
    //console.log("App component - OnInit");
    //console.log("App component - Initial navigation menu items:", this.navigationMenuItemsSignal());
    //console.log("App component - Initial toolbar action items:", this.toolbarActionItemsSignal());
    //console.log("App component - Initial active item:", this.currentActiveItemSignal());

    //// Additional authentication initialization logging
    //console.log("App component - Initial authentication state:", this.isAuthenticated());
    //console.log("App component - Initial user:", this.userDisplayName());
  }

  // Your existing event handlers (preserved exactly)
  public onNavigationChange(item: NavigationItem) {
   /* console.log("App component - Navigation change requested:", item);*/
    this.navigationService.setActiveItem(item.id);
  }

  public onToolbarActionClick(item: NavigationItem) {
    //console.log("App component - Toolbar action clicked:", item);
    // NavigationService now handles authentication actions automatically
    this.navigationService.setActiveItem(item.id);
  }

  public onGoBack() {
    //console.log("App component - Go back requested");
    this.navigationService.goBack();
  }

  public onGoHome() {
    //console.log("App component - Go home requested");
    this.navigationService.goHome();
  }
}
