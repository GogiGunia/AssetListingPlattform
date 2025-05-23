import { HttpContext, HttpEvent, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";

export declare type HttpEndpointType = "" | "api" | "odata" | "assets";
export declare type HttpRequestMethodType = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";
export declare type HttpResponseType = "arraybuffer" | "blob" | "json" | "text";
export declare type ObserveOptions = "body" | "events" | "response";

export declare type HttpResponseOutput<T, R, O extends ObserveOptions> =
   O extends "body" ? ResponseResult<T, R> :
   O extends "events" ? HttpEvent<ResponseResult<T, R>> :
   O extends "response" ? HttpResponse<ResponseResult<T, R>> :
   never;


export declare type ResponseResult<T, R> =
   R extends "arraybuffer" ? ArrayBuffer :
   R extends "blob" ? Blob :
   R extends "json" ? T :
   R extends "text" ? string :
   never;

export interface HttpOptions<T extends HttpResponseType, O extends ObserveOptions> {
   body?: unknown;
   headers?: HttpHeaders | Record<string, string | string[]>;
   observe: O;
   context: HttpContext;
   responseType?: T;
   params?: HttpParams;
   reportProgress?: boolean;
   withCredentials?: boolean;
}
