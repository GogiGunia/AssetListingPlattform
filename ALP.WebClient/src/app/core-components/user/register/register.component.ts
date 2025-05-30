import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  // Initialize the reactive form with custom validators
  private initializeForm(): void {
    this.registerForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Custom validator to check if passwords match
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Remove passwordMismatch error if passwords match
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }

    return null;
  }

  // Check if a form field is invalid and touched
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  // Toggle confirm password visibility
  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  // Template function for registration action
  onRegister(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;

      // Get form values
      const registerData = {
        fullName: this.registerForm.get('fullName')?.value,
        email: this.registerForm.get('email')?.value,
        password: this.registerForm.get('password')?.value,
        acceptTerms: this.registerForm.get('acceptTerms')?.value
      };

      console.log('Registration attempted with data:', registerData);

      // TODO: Replace this template function with your actual registration logic
      this.performRegistration(registerData);
    } else {
      // Mark all fields as touched to show validation errors
      this.registerForm.markAllAsTouched();
      this.showSnackBar('Please fix the form errors before submitting', 'error');
    }
  }

  // Template function for the actual registration process
  private performRegistration(registerData: { fullName: string; email: string; password: string; acceptTerms: boolean }): void {
    // Simulate API call delay
    setTimeout(() => {
      this.isLoading = false;

      // TODO: Replace this with your actual registration service call
      // Example structure:
      // this.authService.register(registerData).subscribe({
      //   next: (response) => {
      //     this.handleRegistrationSuccess(response);
      //   },
      //   error: (error) => {
      //     this.handleRegistrationError(error);
      //   }
      // });

      // For now, simulate success/failure based on email
      if (registerData.email === 'existing@example.com') {
        this.handleRegistrationError({ message: 'Email already exists' });
      } else {
        this.handleRegistrationSuccess({
          token: 'fake-jwt-token',
          user: {
            id: 1,
            email: registerData.email,
            name: registerData.fullName
          }
        });
      }
    }, 2500);
  }

  // Handle successful registration
  private handleRegistrationSuccess(response: any): void {
    console.log('Registration successful:', response);

    // TODO: Store authentication token, user data, etc.
    // localStorage.setItem('authToken', response.token);
    // this.authService.setCurrentUser(response.user);

    this.showSnackBar('Account created successfully! Welcome aboard.', 'success');

    // Navigate to home or onboarding page
    this.router.navigate(['/home']);
  }

  // Handle registration error
  private handleRegistrationError(error: any): void {
    console.error('Registration failed:', error);

    let errorMessage = 'Registration failed. Please try again.';

    if (error.message) {
      errorMessage = error.message;
    }

    this.showSnackBar(errorMessage, 'error');
  }

  // Navigate to login page
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Open terms and conditions (template function)
  openTerms(event: Event): void {
    event.preventDefault();
    console.log('Terms and conditions requested');

    // TODO: Implement terms and conditions modal or navigation
    this.showSnackBar('Terms and conditions will open in a modal', 'info');

    // Example: Open modal or navigate to terms page
    // this.dialog.open(TermsModalComponent);
    // this.router.navigate(['/terms']);
  }

  // Open privacy policy (template function)
  openPrivacyPolicy(event: Event): void {
    event.preventDefault();
    console.log('Privacy policy requested');

    // TODO: Implement privacy policy modal or navigation
    this.showSnackBar('Privacy policy will open in a modal', 'info');

    // Example: Open modal or navigate to privacy page
    // this.dialog.open(PrivacyModalComponent);
    // this.router.navigate(['/privacy']);
  }

  // Utility function to show snack bar messages
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
