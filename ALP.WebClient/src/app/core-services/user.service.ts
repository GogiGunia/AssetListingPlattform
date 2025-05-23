import { Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, AccessLevel, DisplayUser, UserRoleEnum, UserRole, UserWithPermissions } from '../core-models/auth.model';
import { HttpRequestOptions } from './data-provider/model/HttpRequestOptions';
import { HttpService } from './data-provider/services/http.service';
import { TokenService } from './token/token.service';
import { LanguageService } from './language.service';
import { ObservableCache } from '../utils/ObservableCache';

@Injectable()
export class UserService {

  private _user: User | null = null;
  public get user(): User | null { return this._user; }

  private _user$ = new BehaviorSubject<User | null>(null);
  public get user$(): Observable<User | null> { return this._user$.asObservable(); }

  public get accessLevel(): undefined | AccessLevel { return this.tokenService.getAccessLevel(); }
  public get isUser(): boolean { return this.accessLevel != null && (this.accessLevel & AccessLevel.General) === AccessLevel.General; }
  public get isAdmin(): boolean { return this.accessLevel != null && (this.accessLevel & AccessLevel.Elevated) === AccessLevel.Elevated; }

  private userMap = new Map<string, User>();
  public usersForDisplay: DisplayUser[] = [];
  private readonly userRolesObservableCache: ObservableCache<UserRole[]>;

  constructor(private httpService: HttpService,
    private tokenService: TokenService,
    private langService: LanguageService) {
    this.userRolesObservableCache = new ObservableCache(
      this.httpService.Get<UserRole[]>(new HttpRequestOptions("User/GetAllUserRoles", "json", "body"))
    );
    this.tokenService.logout$
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.setUser(null);
      });

    this.tokenService.hasValidToken$.pipe(takeUntilDestroyed()).subscribe(tokenType => {
      // Falls es eine Änderung bei den Token gab und der aktuelle Benutzer nicht gesetzt ist, 
      // dann muss dieser geholt werden
      if (this.user == null && tokenType === "AccessToken")
        this.getOwnUserInfo().subscribe({
          next: user => {
            this.langService.setLangDict(user.languageIso).subscribe();
            this.setUser(user);
          },
          error: () => this.tokenService.resetService(),
        });
    });
  }

  public setUser(user: User | null): void {
    this._user = user;
    this._user$.next(user);
  }

  public hasRole(role: UserRoleEnum): boolean {
    return this.user?.userRoleId === role;
  }

  public getUserId(): undefined | number {
    return this.user?.id;
  }

  public getUserFullName(): string {
    return `${this.user?.firstName ?? ""} ${this.user?.lastName ?? ""}`;
  }

  public userToDisplayString(userOrUserName: undefined | string | User, format: "full" | "short" = "short"): string {
    if (userOrUserName == null)
      return "N/A";

    let user: User;
    if (typeof userOrUserName === "string") {
      const tempUser = this.userMap.get(userOrUserName.toLowerCase());
      if (tempUser == null)
        return userOrUserName;
      user = tempUser;
    }
    else
      user = userOrUserName;

    const result = this.getFormattedEmail(user, format);
    if (result.trim().length < 4)
      return user.email;
    return result;
  }

  public getUserByIdToDisplay(userId: number, format: string): string {
    const user = this.usersForDisplay.find(x => x.id === userId);
    if (user)
      return this.getFormattedEmail(user, format);
    return "";
  }

  private getFormattedEmail(user: User | DisplayUser, format: string): string {
    switch (format) {
      case "full": return `${user.firstName} ${user.lastName}`;
      case "short": return `${user.lastName}, ${user.firstName[0] == null ? "" : user.firstName[0] + "."}`;
    }

    return "";
  }

  //private readonly userRolesObservableCache = new ObservableCache(this.httpService.Get<UserRole[]>(new HttpRequestOptions("User/GetAllUserRoles", "json", "body")));
  //public getAllUserRoles(): Observable<UserRole[]> {
  //  return this.userRolesObservableCache.asObservable();
  //}

  public getAllUsers(): Observable<User[]> {
    return this.httpService.Get<User[]>(new HttpRequestOptions("User/GetAllUsers", "json", "body"));
  }

  public getAllDisplayUsers(): Observable<DisplayUser[]> {
    return this.httpService.Get<User[]>(new HttpRequestOptions("User/GetAllDisplayUsers", "json", "body"));
  }

  public getUser(id: number): Observable<UserWithPermissions> {
    return this.httpService.Get<UserWithPermissions>(new HttpRequestOptions(`User/${id}`, "json", "body"));
  }

  public getOwnUserInfo(): Observable<User> {
    return this.httpService.Get<User>(new HttpRequestOptions("User/GetOwnUserInfo", "json", "body"));
  }


  //TODO User Create and Edit
  //public createUser(user: UserUpdateModel): Observable<void> {
  //  return this.httpService.Post<void>(new HttpRequestOptions("User/CreateUser", "json", "body").setBody(user));
  //}

  //public editUser(user: UserUpdateModel): Observable<User> {
  //  return this.httpService.Put<User>(new HttpRequestOptions(`User/EditUser`, "json", "body").setBody(user));
  //}

  public resetPasswordForUser(id: number): Observable<void> {
    return this.httpService.Put<void>(new HttpRequestOptions(`User/ResetPassword/${id}`, "json", "body"));
  }

  public changePassword(form: FormGroup): Observable<void> {
    const formData = new FormData();
    formData.append("oldPassword", form.get('oldPassword')?.value);
    formData.append("newPassword", form.get('newPassword')?.value);
    return this.httpService.Put<void>(new HttpRequestOptions("User/ChangePassword", "json", "body").setBody(formData));
  }

  public recoverPassword(form: FormGroup): Observable<void> {
    const formData = new FormData();
    formData.append("email", form.get('email')?.value);
    const options = new HttpRequestOptions("User/RecoverPassword", "json", "body").noAuthRequired().setBody(formData);
    return this.httpService.Put<void>(options);
  }

  public confirmResetPassword(newPassword: string): Observable<void> {
    const formData = new FormData();
    formData.append("password", newPassword);
    const options = new HttpRequestOptions("User/ConfirmRecoverPassword", "json", "body").setBody(formData);
    return this.httpService.Put<void>(options);
  }

  public updateUserLangIso(langIso: string): Observable<void> {
    return this.httpService.Put<void>(new HttpRequestOptions(`User/UpdateLangIso/${langIso}`, "json", "body"));
  }
}
