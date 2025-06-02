// token.service.ts - Updated base TokenService
import { Injectable, WritableSignal } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AccessLevel, LoginRequest, LoginUserViewModel, User } from '../../core-models/auth.model';
import { TokenType, TokenTypeText } from './token.model';


@Injectable()
export abstract class TokenService {
  public abstract readonly isInitialized: WritableSignal<boolean>;
  public abstract readonly manualLogout: boolean;

  public abstract get token(): string | undefined;

  public abstract authenticate(loginRequest: LoginRequest): Observable<User>;

  public abstract setTokens(accessToken?: string, refreshToken?: string): void;

  public abstract isExpired(): boolean;

  public abstract getAccessLevel(): undefined | AccessLevel;

  public abstract getTokenType(): undefined | TokenType;

  public abstract getValidatedToken(): Observable<string>;

  public abstract resetService(isTriggeredByBroadcast?: boolean): void;
  public abstract hasValidToken$: BehaviorSubject<undefined | TokenTypeText>;
  public abstract logout$: Subject<void>;
  public abstract logout(): void;



}
