import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { businessUserGuard } from './guards/business-user.guard';
import { loginRedirectGuard } from './guards/login-redirect.guard';

export const routes: Routes = [
  // Default redirect
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },

  // Public routes (no authentication required)
  {
    path: 'home',
    loadComponent: () => import('../app/jafinda-components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'realestate',
    loadComponent: () => import('../app/jafinda-components/realestate/realestate.component').then(m => m.RealestateComponent)
  },
  {
    path: 'autos',
    loadComponent: () => import('../app/jafinda-components/autos/autos.component').then(m => m.AutosComponent)
  },
  {
    path: 'jobs',
    loadComponent: () => import('../app/jafinda-components/jobs/jobs.component').then(m => m.JobsComponent)
  },
  {
    path: 'yachts',
    loadComponent: () => import('../app/jafinda-components/yachts/yachts.component').then(m => m.YachtsComponent)
  },

  // Authentication routes (prevent access when already logged in)
  {
    path: 'login',
    loadComponent: () => import('../app/core-components/user/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginRedirectGuard] // Redirect if already authenticated
  },
  {
    path: 'register',
    loadComponent: () => import('../app/core-components/user/register/register.component').then(m => m.RegisterComponent),
    canActivate: [loginRedirectGuard] // Redirect if already authenticated
  },

  // Protected routes (require authentication)
  {
    path: 'dashboard',
    loadComponent: () => import('../app/core-components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('../app/core-components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },

  // Business user routes (BusinessUser + Admin)
  {
    path: 'my-listings',
    loadComponent: () => import('../app/core-components/my-listings/my-listings.component').then(m => m.MyListingsComponent),
    canActivate: [authGuard, businessUserGuard]
  },

  // Admin-only routes
  {
    path: 'admin',
    loadComponent: () => import('../app/core-components/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard, adminGuard]
  },

  // Error pages
  {
    path: 'unauthorized',
    loadComponent: () => import('../app/core-components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  // Catch-all redirect
  {
    path: '**',
    redirectTo: '/home'
  }
];
