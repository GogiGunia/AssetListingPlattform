import { BehaviorSubject, Observable, Subject } from "rxjs";
import {
  TokenType,
  TokenTypeText,
  JwtTokenBundle, 
  DecodedAccessToken, 
  DecodedRefreshToken
} from "./token.model";

import { Signal } from "@angular/core";
import { AccessLevel } from "../../core-models/auth.model";

export abstract class TokenService {
  public abstract get token(): undefined | string;
  protected abstract set token(value: undefined | string);

  public readonly abstract isInitialized: Signal<boolean>;

  public abstract isExpired(): boolean;
  public abstract getAccessLevel(): undefined | AccessLevel;
  public abstract getTokenType(): undefined | TokenType;
  public abstract authenticate({ userName, password }: { userName: string, password: string }): Observable<void>;
  public abstract getValidatedToken(): Observable<string>;
  public abstract setTokens(accessToken?: string, refreshToken?: string): void;

  public readonly abstract hasValidToken$: BehaviorSubject<undefined | TokenTypeText>;
  public readonly abstract logout$: Subject<void>;
  public abstract get manualLogout(): boolean;

  public abstract resetService(isTriggeredByBroadcast?: boolean): void;
}
