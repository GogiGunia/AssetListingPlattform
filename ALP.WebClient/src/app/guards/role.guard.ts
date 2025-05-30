import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRoleEnum } from '../core-models/auth.model';
import { UserService } from '../core-services/user.service';

export function createRoleGuard(allowedRoles: UserRoleEnum[]): CanActivateFn {
  return (route, state) => {
    const userService = inject(UserService);
    const router = inject(Router);

    if (!userService.isAuthenticated()) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    if (userService.hasAnyRole(allowedRoles)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
}
