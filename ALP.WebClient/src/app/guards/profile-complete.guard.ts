import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../core-services/user.service';

export const profileCompleteGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (!userService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check if user profile is complete
  if (userService.isProfileComplete()) {
    return true;
  }

  // Redirect to profile completion page
  router.navigate(['/complete-profile'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
