import { HttpContext, HttpHeaders, HttpParams } from "@angular/common/http";
import { HttpEndpointType, HttpOptions, HttpResponseType, ObserveOptions } from "./data-provider.model";
import { AUTHENTICATE } from "../httpInterceptors/http-headers.interceptor";

export class HttpRequestOptions<T extends HttpResponseType, O extends ObserveOptions> {
   public readonly path: string;
   public endpoint: HttpEndpointType = "api";

   public readonly options: HttpOptions<T, O>;

   constructor(path: string, responseType: T, observe: O, headers?: Record<string, string | string[]>) {
      this.path = path;
      this.options = {
         observe: observe,
         responseType: responseType,
         context: new HttpContext(),
         headers: new HttpHeaders(headers),
      };
     this.options.context.set(AUTHENTICATE, true);
   }

   public setBody(body: unknown): this {
      this.options.body = body;
      return this;
   }

   public setHeaders(headers: HttpHeaders | Record<string, string | string[]>): this {
      this.options.headers = headers;
      return this;
   }

   public setQueryParams(obj: Record<string, string | number | boolean | readonly (string | number | boolean)[]>): this {
      this.options.params = new HttpParams({ fromObject: obj });
      return this;
   }

   public noAuthRequired(): this {
      this.options.context.set(AUTHENTICATE, false);

      return this;
   }

   public useEndpoint(endpoint: HttpEndpointType): this {
      this.endpoint = endpoint;

      return this;
   }

   public ComposePath(basePath: string): string {
      return `${basePath}/${this.endpoint.length > 0 ? this.endpoint + "/" : ""}${this.path}`;
   }
}
