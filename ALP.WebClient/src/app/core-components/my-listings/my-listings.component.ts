import { Component } from '@angular/core';
import { UserService } from '../../core-services/user.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-listings',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatTabsModule, CommonModule],
  templateUrl: './my-listings.component.html',
  styleUrl: './my-listings.component.scss'
})
export class MyListingsComponent {
  constructor(public userService: UserService) { }
}
