import { Component } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Form controls for email and password
  email = new FormControl('', [Validators.required, Validators.email]);
  password = new FormControl('', [Validators.required, Validators.minLength(6)]);

  // Placeholder for login action
  onLogin() {
    if (this.email.valid && this.password.valid) {
      console.log('Login attempted with:', {
        email: this.email.value,
        password: this.password.value
      });
      // TODO: Implement actual login logic (e.g., call authentication service)
    } else {
      console.log('Form invalid:', {
        emailErrors: this.email.errors,
        passwordErrors: this.password.errors
      });
    }
  }

  // Placeholder for forgot password action
  onForgotPassword() {
    console.log('Forgot password requested for:', this.email.value);
    // TODO: Implement forgot password logic (e.g., navigate to reset page or send reset email)
  }

  // Helper to get email error message
  getEmailErrorMessage() {
    if (this.email.hasError('required')) {
      return 'Email is required';
    }
    if (this.email.hasError('email')) {
      return 'Enter a valid email';
    }
    return '';
  }

  // Helper to get password error message
  getPasswordErrorMessage() {
    if (this.password.hasError('required')) {
      return 'Password is required';
    }
    if (this.password.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }
}
