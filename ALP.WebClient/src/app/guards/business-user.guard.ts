import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../core-services/user.service';

export const businessUserGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (!userService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Allow access for BusinessUser and Admin
  if (userService.hasAnyRole(['BusinessUser', 'Admin'])) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};
