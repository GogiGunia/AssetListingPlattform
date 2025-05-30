import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../core-services/user.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  // First check if user is authenticated
  if (!userService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Then check if user is admin
  if (userService.isAdmin()) {
    return true;
  }

  // User is authenticated but not admin - redirect to unauthorized page
  router.navigate(['/unauthorized']);
  return false;
};
