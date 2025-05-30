import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { UserService } from './user.service';
import { TokenService } from './token/token.service';

@Injectable()
export class LogoutService {
  constructor(
    private jwtTokenService: TokenService,
    private userService: UserService,
    private router: Router
  ) { }

  /**
   * Perform complete logout with navigation
   */
  public logout(redirectToLogin: boolean = true): Observable<void> {
    // Clear tokens
    this.jwtTokenService.logout();

    // Clear user data
    this.userService.clearUser();

    // Navigate to login page
    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }

    return of(void 0);
  }

  /**
   * Silent logout (no navigation)
   */
  public silentLogout(): void {
    this.jwtTokenService.logout();
    this.userService.clearUser();
  }
}
