// user.service.ts - Complete user service
import { Injectable, signal, WritableSignal, computed, Signal, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, map } from 'rxjs';
import {
  User,
  UserWithPermissions,
  DisplayUser,
  AuthenticationState,
  UserRoleEnum,
  UserProfile,
  UserUpdateModel,
  AccessLevel,
  PartialUserState,
  LoginUserViewModel
} from '../core-models/auth.model';
import { LanguageEnum } from '../core-models/common-interfaces';
import { StorageService } from './storage/storage.service';
import { TokenService } from './token/token.service';


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
  public readonly isAuthenticated: Signal<boolean> = computed(() =>
    this._currentUser() !== null || this._partialUserState() !== null
  );

  public readonly userEmail: Signal<string | null> = computed(() => {
    const user = this._currentUser();
    const partialUser = this._partialUserState();
    return user?.email ?? partialUser?.email ?? null;
  });

  public readonly userDisplayName: Signal<string> = computed(() => {
    const user = this._currentUser();
    if (user) {
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

  public readonly displayUser: Signal<DisplayUser | null> = computed(() => {
    const user = this._currentUser();
    return user ? {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName
    } : null;
  });

  // Role-based computed signals
  public readonly isAdmin: Signal<boolean> = computed(() =>
    this._currentUser()?.userRoleId === 'Admin'
  );

  public readonly isBusinessUser: Signal<boolean> = computed(() =>
    this._currentUser()?.userRoleId === 'BusinessUser'
  );

  public readonly isClientUser: Signal<boolean> = computed(() =>
    this._currentUser()?.userRoleId === 'ClientUser'
  );

  public readonly accessLevel: Signal<AccessLevel | undefined> = computed(() => {
    const user = this._currentUser();
    if (!user) return undefined;

    switch (user.userRoleId) {
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
    private storageService: StorageService
  ) {
    // Create authentication state observable
    this.authenticationState$ = this.tokenService.hasValidToken$.pipe(
      map(tokenType => ({
        isAuthenticated: this.isAuthenticated(),
        user: this._currentUser(),
        tokenType,
        isProfileComplete: this._isProfileComplete()
      }))
    );

    this.initializeUserState();
    this.setupTokenServiceSubscription();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.userChange$.complete();
    this.permissionsChange$.complete();
  }

  /**
   * Initialize user state from storage and token service
   */
  private initializeUserState(): void {
    // Load user from storage if available
    const storedUser = this.loadUserFromStorage();
    if (storedUser) {
      const hasValidToken = this.tokenService.hasValidToken$.value;
      if (hasValidToken) {
        this._currentUser.set(storedUser);
        this._isProfileComplete.set(true);
      } else {
        this.clearUserFromStorage();

      }
     
    }

    // Load permissions from storage
    const storedPermissions = this.loadPermissionsFromStorage();
    if (storedPermissions) {
      this._userPermissions.set(storedPermissions);
    }

    this._isInitialized.set(true);
  }

  /**
   * Subscribe to token service changes to sync authentication state
   */
  private setupTokenServiceSubscription(): void {
    const tokenSubscription = this.tokenService.hasValidToken$.subscribe(tokenType => {
      if (!tokenType) {
        // Token is invalid or cleared - clear user data
        this.clearUser();
      }
    });

    const logoutSubscription = this.tokenService.logout$.subscribe(() => {
      this.clearUser();
    });

    this.subscriptions.add(tokenSubscription);
    this.subscriptions.add(logoutSubscription);
  }

  /**
   * Handle login response from backend - sets partial user state
   */
  public handleLoginResponse(loginResponse: LoginUserViewModel): void {
    // Set partial user state with just email
    this._partialUserState.set({
      email: loginResponse.email,
      isProfileLoaded: false
    });

    this._isProfileComplete.set(false);
    this.userChange$.next(null); // No full user yet

    // Note: Full user profile should be loaded separately via loadUserProfile()
  }

  /**
   * Load complete user profile (call this after login to get full user data)
   */
  public setUserProfile(userProfile: UserProfile): void {
    const user: User = {
      id: userProfile.id,
      email: userProfile.email,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      userRoleId: userProfile.userRoleId,
      languageIso: userProfile.languageIso
    };

    this._currentUser.set(user);
    this._partialUserState.set(null); // Clear partial state
    this._isProfileComplete.set(true);

    // Handle permissions if provided
    if (userProfile.permitListingIds) {
      this.setUserPermissions(userProfile.permitListingIds);
    }

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
    return this._currentUser()?.userRoleId === role;
  }

  public hasAnyRole(roles: UserRoleEnum[]): boolean {
    const currentRole = this._currentUser()?.userRoleId;
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
    return this._currentUser()?.userRoleId ?? null;
  }

  public getDisplayUser(): DisplayUser | null {
    return this.displayUser();
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
      this.storageService.save('LOCAL', 'CURRENT_USER', JSON.stringify(user));
    } catch (error) {
      console.warn('Failed to save user to storage:', error);
    }
  }

  private loadUserFromStorage(): User | null {
    try {
      const userData = this.storageService.load('LOCAL', 'CURRENT_USER');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.warn('Failed to load user from storage:', error);
      this.clearUserFromStorage();
    }
    return null;
  }

  private clearUserFromStorage(): void {
    try {
      this.storageService.remove('LOCAL', 'CURRENT_USER');
    } catch (error) {
      console.warn('Failed to clear user from storage:', error);
    }
  }

  private savePermissionsToStorage(permissions: number[]): void {
    try {
      this.storageService.save('LOCAL', 'USER_PERMISSIONS', JSON.stringify(permissions));
    } catch (error) {
      console.warn('Failed to save permissions to storage:', error);
    }
  }

  private loadPermissionsFromStorage(): number[] | null {
    try {
      const permissionsData = this.storageService.load('LOCAL', 'USER_PERMISSIONS');
      if (permissionsData) {
        return JSON.parse(permissionsData);
      }
    } catch (error) {
      console.warn('Failed to load permissions from storage:', error);
      this.clearPermissionsFromStorage();
    }
    return null;
  }

  private clearPermissionsFromStorage(): void {
    try {
      this.storageService.remove('LOCAL', 'USER_PERMISSIONS');
    } catch (error) {
      console.warn('Failed to clear permissions from storage:', error);
    }
  }
}
