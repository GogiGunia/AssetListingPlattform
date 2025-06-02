// jwt-token.service.ts - Complete updated JWT token service
import { Injectable, OnDestroy, signal, WritableSignal } from '@angular/core';
import { Location } from '@angular/common';
import { TokenService } from './token.service';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, Subject, Subscription, tap, map, of, throwError, catchError, finalize, share } from 'rxjs';
import { AccessLevel, LoginRequest, LoginUserViewModel, User } from '../../core-models/auth.model';
import { HttpRequestOptions } from '../data-provider/model/HttpRequestOptions';
import { HttpService } from '../data-provider/services/http.service';
import { StorageService } from '../storage/storage.service';
import { TokenTypeText, TokenType, DecodedAccessToken, DecodedRefreshToken, JwtTokenBundle } from './token.model';
import { BroadcastService } from '../broadcast.service';

@Injectable()
export class JwtTokenService extends TokenService implements OnDestroy {
  public override readonly isInitialized: WritableSignal<boolean> = signal(false);

  private accessTokenObservable?: Observable<string>;

  // Use the exact class names from your token.model.ts
  private accessTokenObj!: DecodedAccessToken;
  private refreshTokenObj!: DecodedRefreshToken;

  public hasValidToken$: BehaviorSubject<undefined | TokenTypeText>;
  public readonly logout$ = new Subject<void>();
  private readonly subscriptions = new Subscription();

  private _manualLogout = false;
  public override get manualLogout(): boolean {
    return this._manualLogout;
  }

  // Access the raw token string via '.rawToken'
  public override get token(): string | undefined {
    return this.accessTokenObj?.rawToken;
  }

  protected override set token(value: string | undefined) {
    this.accessTokenObj = new DecodedAccessToken(value);
    if (this.accessTokenObj.rawToken) {
      this.storageService.save("LOCAL", "ACCESS_TOKEN", this.accessTokenObj.rawToken);
      //console.log('Token saved to storage:', this.accessTokenObj.rawToken.substring(0, 20) + '...');
    } else {
      this.storageService.remove("LOCAL", "ACCESS_TOKEN");
      //console.log('Token removed from storage');
    }
    // Update hasValidToken$ with the tokenType from the 'typ' claim of the JWT
    this.hasValidToken$.next(this.accessTokenObj?.tokenType);
  }

  private get refreshToken(): string | undefined {
    return this.refreshTokenObj?.rawToken;
  }

  private set refreshToken(value: string | undefined) {
    this.refreshTokenObj = new DecodedRefreshToken(value);
    if (this.refreshTokenObj.rawToken) {
      this.storageService.save("LOCAL", "REFRESH_TOKEN", this.refreshTokenObj.rawToken);
      //console.log('Refresh token saved to storage');
    } else {
      this.storageService.remove("LOCAL", "REFRESH_TOKEN");
      //console.log('Refresh token removed from storage');
    }
  }

  constructor(
    private storageService: StorageService,
    private location: Location,
    private router: Router,
    private httpService: HttpService,
    private broadcastService: BroadcastService
  ) {
    super();

    // Initialize hasValidToken$ first with undefined
    this.hasValidToken$ = new BehaviorSubject<undefined | TokenTypeText>(undefined);

    // Initialize token state from storage/URL
    this.initializeTokenState();

    // Update hasValidToken$ after tokens are loaded
    this.hasValidToken$.next(this.accessTokenObj?.tokenType);

    //console.log('JWT Token Service initialized');
    //console.log('Has valid token:', this.hasValidToken());
    //console.log('Token type:', this.accessTokenObj?.tokenType);

    this.isInitialized.set(true);
  }

  private initializeTokenState(): void {
    const urlTree = this.router.parseUrl(this.location.path(false));
    let initialAccessTokenString: string | null | undefined = urlTree.queryParamMap.get("token");
    let initialRefreshTokenString: string | null | undefined;

    if (initialAccessTokenString != null && initialAccessTokenString.length > 0) {
      //console.log('Token found in URL');
      // Token from URL - consider clearing from URL for security
      // this.router.navigate([], { queryParams: { token: null }, queryParamsHandling: 'merge', replaceUrl: true });
    } else {
      initialAccessTokenString = this.storageService.load("LOCAL", "ACCESS_TOKEN");
      initialRefreshTokenString = this.storageService.load("LOCAL", "REFRESH_TOKEN");

      if (initialAccessTokenString) {
        //console.log('Token loaded from storage:', initialAccessTokenString.substring(0, 20) + '...');
      } else {
        //console.log('No token found in storage');
      }
    }

    this.accessTokenObj = new DecodedAccessToken(initialAccessTokenString);
    this.refreshTokenObj = new DecodedRefreshToken(initialRefreshTokenString);

    // Check if tokens are valid after loading
    if (this.accessTokenObj?.rawToken && !this.accessTokenObj.isExpired()) {
      //console.log('Valid access token found');
    } else if (this.accessTokenObj?.rawToken && this.accessTokenObj.isExpired()) {
      //console.log('Access token found but expired');
    }
  }

  public ngOnDestroy(): void {
    this.logout$.complete();
    this.subscriptions.unsubscribe();
    this.broadcastService.loginChannel.onmessage = null;
    this.broadcastService.logoutChannel.onmessage = null;
    this.broadcastService.refreshChannel.onmessage = null;
  }

  public override setTokens(accessToken?: string, refreshToken?: string): void {
    //console.log('Setting tokens - Access:', accessToken ? accessToken.substring(0, 20) + '...' : 'undefined');
    //console.log('Setting tokens - Refresh:', refreshToken ? refreshToken.substring(0, 20) + '...' : 'undefined');
    this.assignTokensInternal(accessToken, refreshToken, true);
  }

  private assignTokensInternal(accessToken?: string, refreshToken?: string, shouldBroadcast: boolean = true): string | undefined {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    this._manualLogout = false;

    if (shouldBroadcast) {
      if (accessToken && refreshToken) {
        this.broadcastService.loginChannel.postMessage({
          accessToken: accessToken,
          refreshToken: refreshToken
        });
      } else if (accessToken) {
        this.broadcastService.refreshChannel.postMessage(accessToken);
      }
    }
    return this.token;
  }

  public override isExpired(): boolean {
    return this.accessTokenObj?.isExpired() ?? true;
  }

  public hasValidToken(): boolean {
    return this.accessTokenObj?.rawToken != null && !this.accessTokenObj.isExpired();
  }

  public getUserRole(): string | undefined {
    return this.accessTokenObj?.role;
  }

  public override getAccessLevel(): undefined | AccessLevel {
    const role = this.getUserRole();
    switch (role) {
      case "Admin": return AccessLevel.Elevated;
      case "BusinessUser":
      case "ClientUser": return AccessLevel.General;
      default: return undefined;
    }
  }

  public override getTokenType(): undefined | TokenType {
    const tokenTypeText = this.accessTokenObj?.tokenType;
    if (tokenTypeText) {
      return TokenType[tokenTypeText as keyof typeof TokenType];
    }
    return undefined;
  }

  /**
   * Updated authenticate method - now uses email instead of userName
   * Returns the full User response from backend
   */
  public override authenticate(loginRequest: LoginRequest): Observable<User> {
    //console.log('Authenticating user:', loginRequest.email);
    const { email, password } = loginRequest;
    return this.httpService.Get<User>(
      new HttpRequestOptions(`Auth/${email}`, "json", "body")
        .noAuthRequired()
        .setHeaders({ password: password })
    ).pipe(
      tap(response => {
        //console.log('Authentication successful, setting tokens');
        // Set tokens from response
        this.assignTokensInternal(response.accessToken, response.refreshToken, true);
      })
    );
  }

  public override resetService(isTriggeredByBroadcast: boolean = false): void {
    //console.log('Resetting token service - triggered by broadcast:', isTriggeredByBroadcast);

    this.token = undefined;
    this.refreshToken = undefined;
    this._manualLogout = true;

    if (!isTriggeredByBroadcast) {
      this.broadcastService.logoutChannel.postMessage(true);
    }

    // Emit logout event
    this.logout$.next();
  }

  public override getValidatedToken(): Observable<string> {
    if (this.accessTokenObj?.rawToken && !this.accessTokenObj.isExpired()) {
      return of(this.accessTokenObj.rawToken);
    }

    if (this.refreshTokenObj?.rawToken && !this.refreshTokenObj.isExpired()) {
      return this.doTokenRefresh();
    }

    this.resetService();
    return throwError(() => new Error('Authentication required. All tokens are invalid or missing.'));
  }

  private doTokenRefresh(): Observable<string> {
    if (!this.refreshToken) {
      return throwError(() => new Error('No refresh token available for refresh operation.'));
    }

    //console.log('Refreshing token...');
    return this.accessTokenObservable ??= this.httpService.Get<JwtTokenBundle>(
      new HttpRequestOptions("Auth", "json", "body")
        .noAuthRequired()
        .setHeaders({ Authorization: `bearer ${this.refreshToken}` })
    ).pipe(
      map(response => {
        //console.log('Token refresh successful');
        const newAccessToken = this.assignTokensInternal(response.accessToken, response.refreshToken, true);
        if (!newAccessToken) {
          throw new Error('Token refresh failed to return a new access token.');
        }
        return newAccessToken;
      }),
      catchError((error) => {
        //console.error('Token refresh failed:', error);
        this.resetService(true);
        return throwError(() => new Error('Token refresh failed: ' + (error?.message || 'Unknown error')));
      }),
      finalize(() => {
        this.accessTokenObservable = undefined;
        if (this.refreshToken) {
          this.broadcastService.refreshChannel.postMessage(this.refreshToken);
        }
      }),
      share()
    );
  }

  /**
   * Manual logout method
   */
  public logout(): void {
    //console.log('Manual logout triggered');
    this.resetService(false);
  }
}
