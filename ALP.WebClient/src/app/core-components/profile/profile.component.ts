import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { LogoutService } from '../../core-services/logout.service';
import { UserService } from '../../core-services/user.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  constructor(
    public userService: UserService,
    private logoutService: LogoutService
  ) { }

  getRoleClass(): string {
    const role = this.userService.getCurrentUserRole();
    switch (role) {
      case 'Admin': return 'admin';
      case 'BusinessUser': return 'business';
      case 'ClientUser': return 'client';
      default: return '';
    }
  }

  logout(): void {
    this.logoutService.logout();
  }
}
