import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { UserService } from '../core-services/user.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (!userService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check if route has required permission parameter
  const requiredListingId = route.params['listingId'];
  if (requiredListingId) {
    const listingIdNumber = parseInt(requiredListingId, 10);

    // Admin has access to everything
    if (userService.isAdmin()) {
      return true;
    }

    // Check if user has permission for this specific listing
    if (userService.hasPermission(listingIdNumber)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  }

  // No specific permission required
  return true;
};
