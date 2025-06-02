import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { RegisterRequest, UserRoleEnum } from '../../../core-models/auth.model';
import { UserService } from '../../../core-services/user.service';

interface RoleOption {
  value: UserRoleEnum;
  displayName: string;
  icon: string;
}

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
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

  // Role options for the select dropdown
  roleOptions: RoleOption[] = [
    {
      value: 'ClientUser' as UserRoleEnum,
      displayName: 'Client',
      icon: 'person'
    },
    {
      value: 'BusinessUser' as UserRoleEnum,
      displayName: 'Business User',
      icon: 'business'
    }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  // Initialize the reactive form with custom validators
  private initializeForm(): void {
    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['ClientUser', [Validators.required]], // Default to ClientUser
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

      // Get form values and create the request object to match backend expectations
      const registerRequest: RegisterRequest = {
        userModel: {
          email: this.registerForm.get('email')?.value.trim(),
          firstName: this.registerForm.get('firstName')?.value.trim(),
          lastName: this.registerForm.get('lastName')?.value.trim(),
          role: this.registerForm.get('role')?.value as UserRoleEnum // Get selected role from form
        },
        password: this.registerForm.get('password')?.value
      };

/*      console.log('Registration attempted with data:', registerRequest);*/

      // Call the actual registration method
      this.performRegistration(registerRequest);
    } else {
      // Mark all fields as touched to show validation errors
      this.registerForm.markAllAsTouched();
      this.showSnackBar('Please fix the form errors before submitting', 'error');
    }
  }

  // Updated performRegistration method to match your backend endpoint
  private performRegistration(registerRequest: RegisterRequest): void {
    this.userService.createUser(registerRequest).subscribe({
      next: (response) => {
        this.handleRegistrationSuccess(response);
      },
      error: (error) => {
        this.handleRegistrationError(error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // Handle successful registration
  private handleRegistrationSuccess(response: any): void {
    /*console.log('Registration successful:', response);*/

    // TODO: Handle the successful registration response
    // You might want to:
    // 1. Store user data if the response includes tokens
    // 2. Redirect to login page for user to sign in
    // 3. Or automatically log them in if your backend returns tokens

    this.showSnackBar(`Account created successfully for ${response.firstName} ${response.lastName}!`, 'success');

    // Navigate to login page for user to sign in
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }

  // Handle registration error
  private handleRegistrationError(error: any): void {
/*    console.error('Registration failed:', error);*/

    let errorMessage = 'Registration failed. Please try again.';

    // Handle specific error messages from your backend
    if (error.message) {
      errorMessage = error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 400) {
      errorMessage = 'Invalid registration data. Please check your inputs.';
    } else if (error.status === 409) {
      errorMessage = 'An account with this email already exists.';
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
   /* console.log('Terms and conditions requested');*/

    // TODO: Implement terms and conditions modal or navigation
    this.showSnackBar('Terms and conditions will open in a modal', 'info');

    // Example: Open modal or navigate to terms page
    // this.dialog.open(TermsModalComponent);
    // this.router.navigate(['/terms']);
  }

  // Open privacy policy (template function)
  openPrivacyPolicy(event: Event): void {
    event.preventDefault();
  /*  console.log('Privacy policy requested');*/

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
