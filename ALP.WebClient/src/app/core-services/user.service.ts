// user.service.ts - Complete user service
import { Injectable, signal, WritableSignal, computed, Signal, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription, map, catchError, throwError } from 'rxjs';
import {
  User,
  UserWithPermissions,
  AuthenticationState,
  UserRoleEnum,
  UserUpdateModel,
  AccessLevel,
  PartialUserState,
  LoginUserViewModel,
  UserCreateModel,
  RegisterRequest
} from '../core-models/auth.model';
import { LanguageEnum } from '../core-models/common-interfaces';
import { StorageService } from './storage/storage.service';
import { TokenService } from './token/token.service';
import { HttpService } from './data-provider/services/http.service';
import { HttpRequestOptions } from './data-provider/model/HttpRequestOptions';

@Injectable()
export class UserService implements OnDestroy {
  // Signal-based state management
  private readonly _currentUser: WritableSignal<User | null> = signal(null);
  private readonly _userPermissions: WritableSignal<number[]> = signal([]);
  private readonly _isInitialized: WritableSignal<boolean> = signal(false);
  private readonly _isProfileComplete: WritableSignal<boolean> = signal(false);
  private readonly _partialUserState: WritableSignal<PartialUserState | null> = signal(null);

  // Public read-only signals
  public readonly currentUser: Signal<User | null> = this._currentUser.asReadonly();
  public readonly userPermissions: Signal<number[]> = this._userPermissions.asReadonly();
  public readonly isInitialized: Signal<boolean> = this._isInitialized.asReadonly();
  public readonly isProfileComplete: Signal<boolean> = this._isProfileComplete.asReadonly();

  // Computed signals for derived state
  public readonly isAuthenticated: Signal<boolean> = computed(() => {
    const user = this._currentUser();
    const partialUser = this._partialUserState();
    const hasValidToken = this.tokenService.hasValidToken$.value;

    // User is authenticated if they have a current user OR valid tokens
    return (user !== null || partialUser !== null) && !!hasValidToken;
  });

  public readonly userEmail: Signal<string | null> = computed(() => {
    const user = this._currentUser();
    const partialUser = this._partialUserState();
    return user?.email ?? partialUser?.email ?? null;
  });

  public readonly userDisplayName: Signal<string> = computed(() => {
    const user = this._currentUser();
    if (user) {
      //console.log("user display name");
      //console.log(user);
      return `${user.firstName} ${user.lastName}`;
    }

    const partialUser = this._partialUserState();
    return partialUser ? partialUser.email : '';
  });

  public readonly userInitials: Signal<string> = computed(() => {
    const user = this._currentUser();
    if (user) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    const partialUser = this._partialUserState();
    return partialUser ? partialUser.email.charAt(0).toUpperCase() : '';
  });

  // Role-based computed signals
  public readonly isAdmin: Signal<boolean> = computed(() =>
    this._currentUser()?.role === 'Admin'
  );

  public readonly isBusinessUser: Signal<boolean> = computed(() =>
    this._currentUser()?.role === 'BusinessUser'
  );

  public readonly isClientUser: Signal<boolean> = computed(() =>
    this._currentUser()?.role === 'ClientUser'
  );

  public readonly accessLevel: Signal<AccessLevel | undefined> = computed(() => {
    const user = this._currentUser();
    if (!user) return undefined;

    switch (user.role) {
      case 'Admin': return AccessLevel.Elevated;
      case 'BusinessUser':
      case 'ClientUser': return AccessLevel.General;
      default: return undefined;
    }
  });

  public readonly currentLanguage: Signal<LanguageEnum | undefined> = computed(() =>
    this._currentUser()?.languageIso
  );

  // Observable-based state for compatibility
  public readonly authenticationState$: Observable<AuthenticationState>;
  public readonly userChange$ = new Subject<User | null>();
  public readonly permissionsChange$ = new Subject<number[]>();

  private readonly subscriptions = new Subscription();

  constructor(
    private tokenService: TokenService,
    private storageService: StorageService,
    private httpService: HttpService
  ) {
    //console.log('UserService: Initializing...');

    // Create authentication state observable
    this.authenticationState$ = this.tokenService.hasValidToken$.pipe(
      map(tokenType => ({
        isAuthenticated: this.isAuthenticated(),
        user: this._currentUser(),
        tokenType,
        isProfileComplete: this._isProfileComplete()
      }))
    );

    // Wait for token service to initialize before initializing user state
    if (this.tokenService.isInitialized()) {
      this.initializeUserState();
    } else {
      // Wait for token service initialization
      const initSub = new Promise<void>((resolve) => {
        const checkInit = () => {
          if (this.tokenService.isInitialized()) {
            this.initializeUserState();
            resolve();
          } else {
            setTimeout(checkInit, 10);
          }
        };
        checkInit();
      });
    }

    this.setupTokenServiceSubscription();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.userChange$.complete();
    this.permissionsChange$.complete();
  }

  /**
   * Create a new user account
   */
  public createUser(registerRequest: RegisterRequest): Observable<User> {
    const options = new HttpRequestOptions('User/Create', 'json', 'body')
      .setBody(registerRequest).noAuthRequired();

    return this.httpService.Post<User>(options).pipe(
      map((response: User) => {
        //console.log('User created successfully:', response);
        return response;
      }),
      catchError((error) => {
        //console.error('User creation failed:', error);

        // Transform error for better handling
        let errorMessage = 'Registration failed. Please try again.';

        if (error.status === 400) {
          errorMessage = 'Invalid registration data. Please check your inputs.';
        } else if (error.status === 409) {
          errorMessage = 'An account with this email already exists.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        // Return a more structured error
        const transformedError = {
          ...error,
          message: errorMessage,
          originalError: error
        };

        return throwError(() => transformedError);
      })
    );
  }

  /**
   * Initialize user state from storage and token service
   */
  private initializeUserState(): void {
    //console.log('UserService: Initializing user state...');

    // Check if we have valid tokens first
    const hasValidToken = this.tokenService.hasValidToken$.value;
    //console.log('UserService: Has valid token:', hasValidToken);

    if (hasValidToken) {
      // Load user from storage if available and tokens are valid
      const storedUser = this.loadUserFromStorage();
      if (storedUser) {
        //console.log('UserService: Loaded user from storage:', storedUser.email);
        this._currentUser.set(storedUser);
        this._isProfileComplete.set(true);
      } else {
        //console.log('UserService: No stored user found, but have valid tokens');
        // We have tokens but no stored user - this is a valid state
        // The user might need to be loaded from the server using the token
      }

      // Load permissions from storage
      const storedPermissions = this.loadPermissionsFromStorage();
      if (storedPermissions) {
        this._userPermissions.set(storedPermissions);
      }
    } else {
      //console.log('UserService: No valid tokens, clearing stored user');
      this.clearUserFromStorage();
    }

    this._isInitialized.set(true);
    //console.log('UserService: Initialization complete. Is authenticated:', this.isAuthenticated());
  }

  /**
   * Subscribe to token service changes to sync authentication state
   */
  private setupTokenServiceSubscription(): void {
    const tokenSubscription = this.tokenService.hasValidToken$.subscribe(tokenType => {
      //console.log('UserService: Token state changed:', tokenType);
      if (!tokenType) {
        // Token is invalid or cleared - clear user data
        //console.log('UserService: Clearing user data due to invalid tokens');
        this.clearUser();
      }
    });

    const logoutSubscription = this.tokenService.logout$.subscribe(() => {
      //console.log('UserService: Logout event received from token service');
      this.clearUser();
    });

    this.subscriptions.add(tokenSubscription);
    this.subscriptions.add(logoutSubscription);
  }

  /**
   * Handle login response from backend - sets user data and ensures tokens are stored
   */
  public handleLoginResponse(loginResponse: User): void {
    //console.log('UserService: Handling login response for:', loginResponse.email);

    // FIXED: Ensure tokens are properly set in token service
    this.tokenService.setTokens(loginResponse.accessToken, loginResponse.refreshToken);

    // Set complete user data
    this._currentUser.set({
      id: loginResponse.id,
      accessToken: loginResponse.accessToken,
      refreshToken: loginResponse.refreshToken,
      email: loginResponse.email,
      firstName: loginResponse.firstName,
      lastName: loginResponse.lastName,
      role: loginResponse.role,
      languageIso: loginResponse.languageIso
    });

    this._partialUserState.set(null); // Clear any partial state
    this._isProfileComplete.set(true);

    // Save user to storage
    this.saveUserToStorage(this._currentUser()!);
    this.userChange$.next(this._currentUser());

    //console.log('UserService: Login handled successfully. User authenticated:', this.isAuthenticated());
  }

  /**
   * Load complete user profile (call this after login to get full user data)
   */
  public setUserProfile(userProfile: User): void {
    const user: User = {
      id: userProfile.id,
      accessToken: userProfile.accessToken,
      refreshToken: userProfile.refreshToken,
      email: userProfile.email,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      role: userProfile.role,
      languageIso: userProfile.languageIso
    };

    this._currentUser.set(user);
    this._partialUserState.set(null); // Clear partial state
    this._isProfileComplete.set(true);

    this.saveUserToStorage(user);
    this.userChange$.next(user);
  }

  /**
   * Set complete user (when you have all data)
   */
  public setCurrentUser(user: User): void {
    this._currentUser.set(user);
    this._partialUserState.set(null);
    this._isProfileComplete.set(true);
    this.saveUserToStorage(user);
    this.userChange$.next(user);
  }

  /**
   * Set user with permissions
   */
  public setUserWithPermissions(userWithPermissions: UserWithPermissions): void {
    this.setCurrentUser(userWithPermissions);
    this.setUserPermissions(userWithPermissions.permitListingIds);
  }

  /**
   * Update specific user properties
   */
  public updateUser(updates: Partial<UserUpdateModel>): void {
    const currentUser = this._currentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      this.setCurrentUser(updatedUser);
    }
  }

  /**
   * Set user permissions
   */
  public setUserPermissions(permissions: number[]): void {
    this._userPermissions.set(permissions);
    this.savePermissionsToStorage(permissions);
    this.permissionsChange$.next(permissions);
  }

  /**
   * Clear current user data and permissions
   */
  public clearUser(): void {
    //console.log('UserService: Clearing user data');
    this._currentUser.set(null);
    this._partialUserState.set(null);
    this._userPermissions.set([]);
    this._isProfileComplete.set(false);
    this.clearUserFromStorage();
    this.clearPermissionsFromStorage();
    this.userChange$.next(null);
    this.permissionsChange$.next([]);
  }

  // Role and permission checks
  public hasRole(role: UserRoleEnum): boolean {
    return this._currentUser()?.role === role;
  }

  public hasAnyRole(roles: UserRoleEnum[]): boolean {
    const currentRole = this._currentUser()?.role;
    return currentRole ? roles.includes(currentRole) : false;
  }

  public hasPermission(listingId: number): boolean {
    return this._userPermissions().includes(listingId);
  }

  public hasAnyPermission(listingIds: number[]): boolean {
    const userPermissions = this._userPermissions();
    return listingIds.some(id => userPermissions.includes(id));
  }

  // Getters
  public getCurrentUser(): User | null {
    return this._currentUser();
  }

  public getCurrentUserEmail(): string | null {
    return this.userEmail();
  }

  public getCurrentUserId(): number | null {
    return this._currentUser()?.id ?? null;
  }

  public getCurrentUserRole(): UserRoleEnum | null {
    return this._currentUser()?.role ?? null;
  }

  public isReady(): boolean {
    return this._isInitialized();
  }

  public getAccessLevel(): AccessLevel | undefined {
    return this.accessLevel();
  }

  public needsProfileLoad(): boolean {
    return this._partialUserState() !== null && !this._isProfileComplete();
  }

  // Private storage methods using typed storage service
  private saveUserToStorage(user: User): void {
    try {
      //console.log('UserService: Saving user to storage:', user.email);
      this.storageService.save('LOCAL', 'CURRENT_USER', JSON.stringify(user));
    } catch (error) {
      //console.warn('Failed to save user to storage:', error);
    }
  }

  private loadUserFromStorage(): User | null {
    try {
      const userData = this.storageService.load('LOCAL', 'CURRENT_USER');
      if (userData) {
        const user = JSON.parse(userData);
        //console.log('UserService: Loaded user from storage:', user.email);
        return user;
      }
    } catch (error) {
      //console.warn('Failed to load user from storage:', error);
      this.clearUserFromStorage();
    }
    return null;
  }

  private clearUserFromStorage(): void {
    try {
      //console.log('UserService: Clearing user from storage');
      this.storageService.remove('LOCAL', 'CURRENT_USER');
    } catch (error) {
      //console.warn('Failed to clear user from storage:', error);
    }
  }

  private savePermissionsToStorage(permissions: number[]): void {
    try {
      this.storageService.save('LOCAL', 'USER_PERMISSIONS', JSON.stringify(permissions));
    } catch (error) {
      //console.warn('Failed to save permissions to storage:', error);
    }
  }

  private loadPermissionsFromStorage(): number[] | null {
    try {
      const permissionsData = this.storageService.load('LOCAL', 'USER_PERMISSIONS');
      if (permissionsData) {
        return JSON.parse(permissionsData);
      }
    } catch (error) {
      //console.warn('Failed to load permissions from storage:', error);
      this.clearPermissionsFromStorage();
    }
    return null;
  }

  private clearPermissionsFromStorage(): void {
    try {
      this.storageService.remove('LOCAL', 'USER_PERMISSIONS');
    } catch (error) {
      //console.warn('Failed to clear permissions from storage:', error);
    }
  }
}
