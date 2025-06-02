import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpResponseType, ObserveOptions, HttpResponseOutput, HttpRequestMethodType } from '../model/data-provider.model';
import { HttpRequestOptions } from '../model/HttpRequestOptions';
import { environment } from '../../../../environments/environment.prod';

@Injectable()
export class HttpService {

  private requestCount = 0;
  private readonly basePath: string;

  constructor(private http: HttpClient) {
    this.basePath = this.basePath = environment.production ? '' : window.location.origin;
  }

  public requestStarted(): void { this.requestCount++; }

  public requestCompleted(): void { this.requestCount--; }

  public Get<T = unknown, R extends HttpResponseType = "json", O extends ObserveOptions = "body">(options: HttpRequestOptions<R, O>): Observable<never | HttpResponseOutput<T, R, O>> {
    return this.internalRequest("GET", options);
  }

  public Patch<T = unknown, R extends HttpResponseType = "json", O extends ObserveOptions = "body">(options: HttpRequestOptions<R, O>): Observable<never | HttpResponseOutput<T, R, O>> {
    return this.internalRequest("PATCH", options);
  }

  public Post<T = unknown, R extends HttpResponseType = "json", O extends ObserveOptions = "body">(options: HttpRequestOptions<R, O>): Observable<never | HttpResponseOutput<T, R, O>> {
    return this.internalRequest("POST", options);
  }

  public Put<T = unknown, R extends HttpResponseType = "json", O extends ObserveOptions = "body">(options: HttpRequestOptions<R, O>): Observable<never | HttpResponseOutput<T, R, O>> {
    return this.internalRequest("PUT", options);
  }

  public Delete<T = unknown, R extends HttpResponseType = "json", O extends ObserveOptions = "body">(options: HttpRequestOptions<R, O>): Observable<never | HttpResponseOutput<T, R, O>> {
    return this.internalRequest("DELETE", options);
  }

  private internalRequest<T, R extends HttpResponseType, O extends ObserveOptions>(method: HttpRequestMethodType, options: HttpRequestOptions<R, O>): Observable<never | HttpResponseOutput<T, R, O>> {
    const resultRequest = this.http.request(method, options.ComposePath(this.basePath), options.options);

    return resultRequest as Observable<never | HttpResponseOutput<T, R, O>>;
  }
}
