import { isDevMode } from "@angular/core";

export enum TokenType {
  AccessToken,
  RefreshToken,
  PasswordResetToken,
}

export declare type TokenTypeText = keyof typeof TokenType;

export interface JwtTokenBundle {
  accessToken?: string;
  refreshToken?: string;
}

const ClaimTypeURIs = {
  Name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  NameIdentifier: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
  Email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  Role: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
};

export interface DecodedToken {
  email: string; 
  userId: string;
  name: string; 
  role: string;
  tokenType?: TokenTypeText;
  isExpired(): boolean;
}

export abstract class DecodedJwtTokenBase implements DecodedToken {
  public readonly rawToken: string;
  protected readonly claims: Record<string, any>;

  // Standard JWT claims
  public get exp(): number { return this.claims["exp"] as number ?? 0; }
  public get nbf(): number { return this.claims["nbf"] as number ?? 0; }
  public get iat(): number { return this.claims["iat"] as number ?? 0; }
  public get jti(): string { return this.claims["jti"] as string; }
  public get iss(): string { return this.claims["iss"] as string; }
  public get aud(): string { return this.claims["aud"] as string; }
  public get tokenType(): TokenTypeText | undefined { return this.claims["typ"] as TokenTypeText; }

  // User-specific claims based on backend
  public get email(): string { return this.claims[ClaimTypeURIs.Email] as string; }
  public get userId(): string { return this.claims[ClaimTypeURIs.NameIdentifier] as string; }
  public get name(): string { return this.claims[ClaimTypeURIs.Name] as string; } 
  public get role(): string { return this.claims[ClaimTypeURIs.Role] as string; }


  constructor(token: string | null | undefined) {
    this.rawToken = token ?? "";
    this.claims = {};

    if (this.rawToken && this.rawToken.split('.').length > 1) {
      try {
        const payload = this.rawToken.split('.')[1];
        if (payload) {
          this.claims = JSON.parse(atob(payload));
        }
      } catch (e) {
        //console.error("Error decoding JWT payload:", e);
        this.claims = {}; 
      }
    }
  }

  public isExpired(): boolean {
    if (!this.exp || this.exp === 0) {
      return true; 
    }
    const nowInSeconds = Date.now() / 1000;
    // Consider nbf (not before) as well if present and relevant
    const isValidNbf = this.nbf ? this.nbf <= nowInSeconds : true;
    return !(isValidNbf && nowInSeconds < this.exp);
  }

  protected logExpiration(tokenName: string): void {
    if (isDevMode() && this.exp) {
    //  console.log(`${tokenName} expiration: `, new Date(this.exp * 1000).toLocaleString());
    } else if (isDevMode() && !this.exp) {
    //  console.warn(`${tokenName} has no expiration claim (exp).`);
    }
  }
}

export class DecodedAccessToken extends DecodedJwtTokenBase {
  constructor(token: string | null | undefined) {
    super(token);
    this.logExpiration("Access Token");
  }
}

export class DecodedRefreshToken extends DecodedJwtTokenBase {
  constructor(token: string | null | undefined) {
    super(token);
    this.logExpiration("Refresh Token");
  }
}

export class DecodedPasswordResetToken extends DecodedJwtTokenBase {
  public get passwordResetGuid(): string | undefined {
    return this.claims["passwordResetGuid"] as string;
  }

  constructor(token: string | null | undefined) {
    super(token);
    this.logExpiration("Password Reset Token");
    if (isDevMode() && !this.passwordResetGuid) {
    //  console.warn("Password Reset Token is missing 'passwordResetGuid' claim.");
    }
  }
}
