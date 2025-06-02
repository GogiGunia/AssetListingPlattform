import {
  HttpContextToken,
  HttpEvent,
  HttpHandlerFn,
  HttpHeaders,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { NEVER, Observable, switchMap } from 'rxjs';
import { TokenService } from '../../token/token.service';

// Default settings (remains the same)
export const AUTHENTICATE = new HttpContextToken<boolean>(() => false);

export const httpHeadersInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  const tokenService = inject(TokenService);

  const authenticate = req.context.get(AUTHENTICATE);

  const createAuthorizationHeader = (
    currentReq: HttpRequest<unknown>,
    token: string
  ): HttpHeaders => {
    return currentReq.headers.set('Authorization', 'bearer ' + token);
  };

  if (authenticate) {
    return tokenService.getValidatedToken().pipe(
      switchMap((token) => {
        if (token == null || token === '') {
          //console.warn(
          //  `Request "${req.urlWithParams}" was omitted. No valid token is available. If you intend to send a request without a token, please use ".noAuthRequired()" on the HttpRequestOptions`
          //);
          return NEVER;
        } else {
          return next(
            req.clone({ headers: createAuthorizationHeader(req, token) })
          );
        }
      })
    );
  } else {
    return next(req);
  }
};
