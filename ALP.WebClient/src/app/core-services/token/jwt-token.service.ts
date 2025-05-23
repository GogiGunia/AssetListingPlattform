import { Injectable, OnDestroy, signal, WritableSignal } from '@angular/core';
import { Location } from '@angular/common';
import { TokenService } from './token.service';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, Subject, Subscription, tap, map, of, throwError, catchError, finalize, share } from 'rxjs';
import { AccessLevel } from '../../core-models/auth.model';
import { HttpRequestOptions } from '../data-provider/model/HttpRequestOptions';
import { HttpService } from '../data-provider/services/http.service';
import { StorageService } from '../storage/storage.service';
import { TokenTypeText, TokenType, JwtTokenBundle, DecodedAccessToken, DecodedRefreshToken } from './token.model';
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
    if (this.accessTokenObj.rawToken) { // Check if the rawToken (after construction) is non-empty
      this.storageService.save("LOCAL", "ACCESS_TOKEN", this.accessTokenObj.rawToken);
    } else {
      this.storageService.remove("LOCAL", "ACCESS_TOKEN");
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
    } else {
      this.storageService.remove("LOCAL", "REFRESH_TOKEN");
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

    this.initializeTokenState();
    this.hasValidToken$ = new BehaviorSubject<undefined | TokenTypeText>(
      this.accessTokenObj?.tokenType 
    );

    this.isInitialized.set(true);
  }

  private initializeTokenState(): void {
    const urlTree = this.router.parseUrl(this.location.path(false));
    let initialAccessTokenString: string | null | undefined = urlTree.queryParamMap.get("token");
    let initialRefreshTokenString: string | null | undefined;

    if (initialAccessTokenString != null && initialAccessTokenString.length > 0) {
      // Token from URL
      // Consider clearing from URL:
      // this.router.navigate([], { queryParams: { token: null }, queryParamsHandling: 'merge', replaceUrl: true });
    } else {
      initialAccessTokenString = this.storageService.load("LOCAL", "ACCESS_TOKEN");
      initialRefreshTokenString = this.storageService.load("LOCAL", "REFRESH_TOKEN");
    }

    this.accessTokenObj = new DecodedAccessToken(initialAccessTokenString);
    this.refreshTokenObj = new DecodedRefreshToken(initialRefreshTokenString);
  }

  public ngOnDestroy(): void {
    this.logout$.complete();
    this.subscriptions.unsubscribe();
    this.broadcastService.loginChannel.onmessage = null;
    this.broadcastService.logoutChannel.onmessage = null;
    this.broadcastService.refreshChannel.onmessage = null;
  }

  public override setTokens(accessToken?: string, refreshToken?: string): void {
    this.assignTokensInternal(accessToken, refreshToken, true);
  }

  private assignTokensInternal(accessToken?: string, refreshToken?: string, shouldBroadcast: boolean = true): string | undefined {
    this.token = accessToken;       // Uses setter for DecodedAccessToken
    this.refreshToken = refreshToken; // Uses setter for DecodedRefreshToken
    this._manualLogout = false;

    // hasValidToken$ is updated within the 'this.token' setter

    if (shouldBroadcast) {
      if (accessToken && refreshToken) { // Typically a full login
        this.broadcastService.loginChannel.postMessage({
          accessToken: accessToken,
          refreshToken: refreshToken
        });
      } else if (accessToken) { // Typically a token refresh (only access token changes)
        this.broadcastService.refreshChannel.postMessage(accessToken);
      }
    }
    return this.token; // Returns the raw access token string
  }

  public override isExpired(): boolean {
    // Use the isExpired method from DecodedJwtTokenBase
    return this.accessTokenObj?.isExpired() ?? true;
  }

  // getUserRole now uses the 'role' getter from DecodedJwtTokenBase
  public getUserRole(): string | undefined {
    return this.accessTokenObj?.role;
  }

  public override getAccessLevel(): undefined | AccessLevel {
    const role = this.getUserRole();
    switch (role) {
      case "Admin": return AccessLevel.Elevated;
      case "Auditor":
      case "User": return AccessLevel.General;
      default: return undefined;
    }
  }

  public override getTokenType(): undefined | TokenType {
    // this.accessTokenObj.tokenType is TokenTypeText | undefined (e.g., "AccessToken")
    const tokenTypeText = this.accessTokenObj?.tokenType;
    if (tokenTypeText) {
      // Map the string type (e.g., "AccessToken") to the TokenType enum member
      return TokenType[tokenTypeText as keyof typeof TokenType];
    }
    return undefined;
  }

  public override authenticate({ userName, password }: { userName: string, password: string }): Observable<void> {
    return this.httpService.Get<JwtTokenBundle>( // JwtTokenBundle has accessToken?: string, refreshToken?: string
      new HttpRequestOptions(`Auth/${userName}`, "json", "body").noAuthRequired().setHeaders({ password: password })
    ).pipe(
      tap(response => {
        this.assignTokensInternal(response.accessToken, response.refreshToken, true);
      }),
      map(() => undefined)
    );
  }

  public override resetService(isTriggeredByBroadcast: boolean = false): void {
    this.token = undefined;
    this.refreshToken = undefined;
    // hasValidToken$ is updated by token setters

    if (!isTriggeredByBroadcast) {
      this.broadcastService.logoutChannel.postMessage(true);
    }
  }

  public override getValidatedToken(): Observable<string> {
    if (this.accessTokenObj?.rawToken && !this.accessTokenObj.isExpired()) {
      return of(this.accessTokenObj.rawToken);
    }

    // Check refresh token validity using its own isExpired method
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

    return this.accessTokenObservable ??= this.httpService.Get<JwtTokenBundle>(
      new HttpRequestOptions("Auth", "json", "body").noAuthRequired().setHeaders({ Authorization: `bearer ${this.refreshToken}` })
    ).pipe(
      map(response => {
        const newAccessToken = this.assignTokensInternal(response.accessToken, response.refreshToken, true);
        if (!newAccessToken) {
          throw new Error('Token refresh failed to return a new access token.');
        }
        return newAccessToken; // newAccessToken is string | undefined, ensure it's string here
      }),
      catchError((error) => {
        this.resetService(true);
        return throwError(() => new Error('Token refresh failed: ' + (error?.message || 'Unknown error')));
      }),
      finalize(() => {
        this.accessTokenObservable = undefined;
        this.broadcastService.refreshChannel.postMessage(this.refreshToken!);
      }),
      share()
    );
  }
}
