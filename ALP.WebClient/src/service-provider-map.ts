import { Provider } from "@angular/core";
import { HttpService } from "./app/core-services/data-provider/services/http.service";
import { LanguageService } from "./app/core-services/language.service";
import { StorageService } from "./app/core-services/storage/storage.service";
import { JwtTokenService } from "./app/core-services/token/jwt-token.service";
import { TokenService } from "./app/core-services/token/token.service";
import { BroadcastService } from "./app/core-services/broadcast.service";
import { HTTP_INTERCEPTORS, HttpInterceptorFn } from "@angular/common/http";
import { httpHeadersInterceptor } from "./app/core-services/data-provider/httpInterceptors/http-headers.interceptor";

export const rootProviders: Provider[] = [
  HttpService,
  LanguageService,
  StorageService,
  { provide: TokenService, useClass: JwtTokenService },
  BroadcastService,
]

export const sessionProviders: Provider[] = [

]

export const functionalInterceptors: HttpInterceptorFn[] = [
  httpHeadersInterceptor,
];
