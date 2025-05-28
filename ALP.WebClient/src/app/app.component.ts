import { Component, OnInit, signal, computed, effect } from '@angular/core';
/*import { RouterOutlet } from '@angular/router';*/
import { LayoutComponent } from './core-components/layout/layout.component';
import { ToolbarComponent } from './core-components/toolbar/toolbar.component';
import { MatCardModule } from '@angular/material/card';
import { NavigationItem } from './core-models/model';
import { NavigationService } from './core-services/navigation.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent, ToolbarComponent, MatCardModule, CommonModule],
  providers: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  // Signals for navigation state
  public navigationItemsSignal = computed(() => this.navigationService.navigationItemsSignal$());
  public currentActiveItemSignal = computed(() => this.navigationService.currentActiveItemSignal());

  constructor(private navigationService: NavigationService) {
    // Effect to log navigation changes
    effect(() => {
      console.log("App component - Navigation items changed:");
      console.log(this.navigationItemsSignal());
      console.log("App component - Current active item:");
      console.log(this.currentActiveItemSignal());
    });
  }

  public ngOnInit(): void {
    console.log("App component - OnInit");
    console.log("App component - Initial navigation items:", this.navigationItemsSignal());
    console.log("App component - Initial active item:", this.currentActiveItemSignal());
  }

  public onNavigationChange(item: NavigationItem) {
    console.log("App component - Navigation change requested:", item);
    this.navigationService.setActiveItem(item.id);
  }
}
