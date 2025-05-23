import { Component, Inject, ViewContainerRef } from '@angular/core';
import { finalize } from 'rxjs';
import { BroadcastService } from '../../../core-services/broadcast.service';
import { StorageService } from '../../../core-services/storage/storage.service';
import { TokenService } from '../../../core-services/token/token.service';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { UserService } from '../../../core-services/user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LanguagePipe } from '../../../pipes/language.pipe';
@Component({
  selector: 'app-login',
  imports: [
    CommonModule, 

    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    LanguagePipe,
    /*LanguageSelectionComponent*/
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  public isLoading = false;

  public loginForm = new FormGroup(
    {
      userName: new FormControl("", { validators: Validators.required, nonNullable: true }),
      password: new FormControl("", { validators: Validators.required, nonNullable: true }),
    });

  constructor(@Inject("APP_TITLE") public appTitle: string,
    private tokenService: TokenService,
    _: UserService,
    private matDialog: MatDialog,
    private viewContainerRef: ViewContainerRef,
    private broadcastService: BroadcastService,
    private storageService: StorageService) { }

  public loginButtonDisabled(): boolean {
    return (!this.loginForm.valid && this.loginForm.touched) || this.isLoading;
  }

  public clickLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginForm.disable();
      this.tokenService.authenticate(this.loginForm.getRawValue())
        .pipe(finalize(() => {
          this.isLoading = false;
          this.loginForm.enable();
        }))
        .subscribe(() =>
          this.broadcastService.loginChannel.postMessage(
            {
              accessToken: this.storageService.load("LOCAL", "ACCESS_TOKEN") ?? "",
              refreshToken: this.storageService.load("LOCAL", "REFRESH_TOKEN") ?? ""
            }));
    }
    else {
      this.loginForm.controls.userName.markAsTouched();
      this.loginForm.controls.password.markAsTouched();
    }
  }

  public openRecoverPasswordDialog(): void {
    throw Error("Not implemented yet");
    /*this.matDialog.open(ForgotPasswordDialogComponent, { viewContainerRef: this.viewContainerRef });*/
  }
}
