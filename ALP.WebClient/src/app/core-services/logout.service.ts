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
   /* console.log('LogoutService: Performing logout, redirect:', redirectToLogin);*/

    // Clear tokens first - this will trigger token service logout
    this.jwtTokenService.logout();

    // Clear user data - this should be triggered by token service, but ensure it happens
    this.userService.clearUser();

  /*  console.log('LogoutService: Logout complete');*/

    // Navigate to login page
    if (redirectToLogin) {
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 100);
    }

    return of(void 0);
  }

  /**
   * Silent logout (no navigation)
   */
  public silentLogout(): void {
   /* console.log('LogoutService: Performing silent logout');*/
    this.jwtTokenService.logout();
    this.userService.clearUser();
  }
}
