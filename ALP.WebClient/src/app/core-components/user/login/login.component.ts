import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginRequest, LoginUserViewModel, User } from '../../../core-models/auth.model';
import { UserService } from '../../../core-services/user.service';
import { TokenService } from '../../../core-services/token/token.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  hidePassword = true;
  isLoading = false;

  private subscriptions = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private jwtTokenService: TokenService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.checkExistingAuthentication();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Check if user is already authenticated and redirect if needed
   */
  private checkExistingAuthentication(): void {
    ////console.log('Login: Checking existing authentication...');
    ////console.log('Login: Is authenticated:', this.userService.isAuthenticated());

    if (this.userService.isAuthenticated()) {
      //console.log('Login: User already authenticated, redirecting to home');
      this.router.navigate(['/home']);
    }
  }

  /**
   * Initialize the reactive form
   */
  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Check if a form field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  /**
   * Handle login form submission
   */
  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const loginRequest: LoginRequest = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };

      //console.log('Login: Attempting login for:', loginRequest.email);
      this.performLogin(loginRequest);
    } else {
      this.loginForm.markAllAsTouched();
      this.showSnackBar('Please fix the form errors before submitting', 'error');
    }
  }

  /**
   * Perform actual login using JWT Token Service
   */
  private performLogin(loginRequest: LoginRequest): void {
    const loginSubscription = this.jwtTokenService.authenticate(loginRequest)
      .subscribe({
        next: (response: User) => {
          //console.log('Login: Authentication successful for:', response.email);
          this.handleLoginSuccess(response);
        },
        error: (error) => {
          //console.error('Login: Authentication failed:', error);
          this.handleLoginError(error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });

    this.subscriptions.add(loginSubscription);
  }

  /**
   * Handle successful login response
   */
  private handleLoginSuccess(response: User): void {
    /*console.log('Login: Handling successful login response');*/

    // FIXED: Use handleLoginResponse which properly sets tokens and user data
    this.userService.handleLoginResponse(response);

    this.showSnackBar('Login successful! Welcome back.', 'success');

    //console.log('Login: User authenticated:', this.userService.isAuthenticated());

    // Navigate to home or dashboard
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 500);
  }

  /**
   * Handle login errors
   */
  private handleLoginError(error: any): void {
    //console.error('Login failed:', error);

    let errorMessage = 'Login failed. Please try again.';

    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.status) {
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid email or password.';
          break;
        case 404:
          errorMessage = 'User not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Login failed (${error.status}). Please try again.`;
      }
    }

    this.showSnackBar(errorMessage, 'error');
  }

  /**
   * Handle forgot password
   */
  onForgotPassword(): void {
    //console.log('Forgot password requested');

    // TODO: Implement forgot password logic
    this.showSnackBar('Forgot password feature coming soon!', 'info');

    // Example: Navigate to forgot password page
    // this.router.navigate(['/forgot-password']);
  }

  /**
   * Navigate to register page
   */
  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  /**
   * Utility function to show snack bar messages
   */
  private showSnackBar(message: string, type: 'success' | 'error' | 'info'): void {
    const config = {
      duration: 4000,
      horizontalPosition: 'center' as const,
      verticalPosition: 'top' as const,
      panelClass: [`snackbar-${type}`]
    };

    this.snackBar.open(message, 'Close', config);
  }
}
