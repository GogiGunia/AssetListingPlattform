import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  @ViewChild('categoriesSection') categoriesSection!: ElementRef;

  constructor(private router: Router) { }

  /**
   * Navigate to a specific category page
   */
  navigateToCategory(category: string): void {
    /*console.log(`Navigating to ${category} category`);*/
    this.router.navigate([`/${category}`]);
  }

  /**
   * Navigate to general listings page
   */
  navigateToListings(): void {
   /* console.log('Navigating to listings overview');*/
    // You can navigate to a general listings page or the first category
    this.router.navigate(['/realestate']);
  }

  /**
   * Smooth scroll to categories section
   */
  scrollToCategories(): void {
    if (this.categoriesSection) {
      this.categoriesSection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}
