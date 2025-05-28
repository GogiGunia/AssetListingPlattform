import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button'
import { HttpService } from './core-services/data-provider/services/http.service';
import { HttpRequestOptions } from './core-services/data-provider/model/HttpRequestOptions';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  providers: [MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ALP.WebClient';
  constructor(private httpService: HttpService) { }
  protected navigateTo(category: string): void {
    console.log(`Navigating to: ${category}`);
  }

  protected apitest(): void {
    console.log('API Test function called');
    const options = new HttpRequestOptions("Test", "text", "body").noAuthRequired();
    this.httpService.Get(options);
    console.log(options);
  }
}

