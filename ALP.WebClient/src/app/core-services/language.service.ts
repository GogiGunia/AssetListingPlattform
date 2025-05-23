import { computed, Injectable, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, share, tap, of, map } from 'rxjs';
import { LanguageEnum, IMuiName, IMuiDesc } from '../core-models/common-interfaces';
import { HttpRequestOptions } from './data-provider/model/HttpRequestOptions';
import { HttpService } from './data-provider/services/http.service';

type LanguageDict = Record<string, string>;

@Injectable()
export class LanguageService {

  public currentLang$ = new BehaviorSubject<LanguageEnum>("DE");
  private langDict: Map<LanguageEnum, LanguageDict> = new Map<LanguageEnum, LanguageDict>();
  private currentLang = toSignal(this.currentLang$, { requireSync: true });
  public readonly isInitialized = signal(false);
  private readonly ressourceSingalMap = new Map<string, Signal<string>>();

  private readyObservable$: Observable<void>;

  constructor(private httpService: HttpService) {
    this.readyObservable$ = this.setLangDict(this.currentLang()).pipe(share(), tap(() => this.readyObservable$ = of(undefined)));
    this.readyObservable$.subscribe();
  }

  public ngOnDestroy(): void {
    this.currentLang$.complete();
    this.langDict.clear();
    this.ressourceSingalMap.clear();
  }

  public waitForInitialize(): Observable<void> {
    return this.readyObservable$;
  }

  public getCurrentLanguageIso(): LanguageEnum {
    return this.currentLang();
  }

  public setLangDict(langIso: LanguageEnum): Observable<void> {
    if (this.langDict.has(langIso)) {
      this.currentLang$.next(langIso);
      return of(undefined);
    }
    else {
      const options = new HttpRequestOptions(`langs/${langIso.toLowerCase()}.json`, "json", "body").noAuthRequired().useEndpoint("assets");
      return this.httpService.Get<LanguageDict>(options)
        .pipe(map(x => {
          this.langDict.set(langIso, x);
          this.currentLang$.next(langIso);
          if (!this.isInitialized())
            this.isInitialized.set(true);
        }));
    }
  }

  public translate(input: string): string {
    const dict = this.langDict.get(this.currentLang());
    if (dict == null)
      return input;

    return dict[input] ?? input;
  }

  public getRessourceSignal(input: string): Signal<string> {
    let result = this.ressourceSingalMap.get(input);
    if (result != null)
      return result;

    result = computed(() => {
      const dict = this.langDict.get(this.currentLang());
      if (dict == null)
        return input;

      return dict[input] ?? input;
    });
    this.ressourceSingalMap.set(input, result);

    return result;
  }

  public getMuiName(object?: IMuiName): string {
    if (object == null)
      return "";

    switch (this.currentLang()) {
      case "DE": return object.nameDE;
      case "EN": return object.nameEN;
      default:
        throw new Error("Language not supported!");
    }
  }

  public getMuiDesc(object?: IMuiDesc): string {
    if (object == null)
      return "";

    switch (this.currentLang()) {
      case "DE": return object.descDE;
      case "EN": return object.descEN;
      default:
        throw new Error("Language not supported!");
    }
  }
}
