import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  providers: [MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ALP.WebClient';
  protected navigateTo(category: string): void {
    console.log(`Navigating to: ${category}`);
  }
}

