import { BehaviorSubject, Observable, OperatorFunction, Subscription } from "rxjs";
import { shareReplay, tap } from "rxjs/operators";

export class ObservableCache<T> {

  private cache?: Observable<T>;
  private Getter: Observable<T>;

  private valueSubject = new BehaviorSubject<undefined | T>(undefined);
  private operator?: OperatorFunction<T, T>;

  /*
   * Cache muss bereits initialisiert worden sein!
   */
  public get value(): undefined | Readonly<T> {
    if (this.valueSubject.value == null)
      console.error("Es wurde auf nicht initialisierten Cache zugegriffen!");

    return this.valueSubject.value;
  }

  public get isFilled(): boolean {
    return this.cache != null;
  }

  constructor(observable: Observable<T>, operator?: OperatorFunction<T, T>) {
    this.Getter = observable;
    this.operator = operator;
  }

  private onTap(x: T): void {
    this.valueSubject.next(x);
  }

  public asObservable(): Observable<T> {
    if (this.cache == null) {
      this.cache =
        this.operator == null ?
          this.Getter.pipe(
            tap(x => this.onTap(x)),
            shareReplay(1)) // Replay Latest value on subscribe
          :
          this.Getter.pipe(
            this.operator,
            tap(x => this.onTap(x)),
            shareReplay(1)) // Replay Latest value on subscribe
        ;
    }
    return this.cache;
  }

  public refreshAsObservable(): Observable<T> {
    this.cache = undefined; // Bei Refresh darf _value nicht auf null gesetzt werden
    return this.asObservable();
  }

  public subscribe(next?: (value: T) => void, error?: ((error: Error) => void), complete?: () => void): Subscription {
    return this.asObservable().subscribe({ next: next, error: error, complete: complete });
  }

  public refresh(next?: (value: T) => void, error?: ((error: Error) => void), complete?: () => void): Subscription {
    this.cache = undefined; // Bei Refresh darf _value nicht auf null gesetzt werden
    return this.subscribe(next, error, complete);
  }

  public tap(observable: Observable<T>): Observable<T> {
    if (this.operator == null)
      return observable.pipe(
        tap(x => this.onTap(x)),
        shareReplay(1));
    else
      return observable.pipe(
        this.operator,
        tap(x => this.onTap(x)),
        shareReplay(1));
  }

  public clear(): void {
    this.cache = undefined;
    this.valueSubject.next(undefined);
  }

  public valueSubscription(): Observable<undefined | T> {
    this.subscribe(); // Zum Initialisieren

    return this.valueSubject;
  }

  public destroy(): void {
    this.valueSubject.complete();
  }
}
