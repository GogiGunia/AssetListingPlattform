import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../core-services/user.service';

export const loginRedirectGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  // If user is already authenticated, redirect to home
  if (userService.isAuthenticated()) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
