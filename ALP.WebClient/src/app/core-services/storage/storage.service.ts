import { KeyValue } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { StorageType, StorageKeys, StorageValueTypes } from './storage.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private readonly keyPrefix: string;

  constructor(@Inject('SOFTWARE_PRODUCER') softwareProducer: string,
    @Inject('APP_TITLE') appTitle: string) {
    this.keyPrefix = [softwareProducer, appTitle].join(".");

    this.optionsVersionContol();
  }

  private optionsVersionContol(): void {
    const oldVersion = this.load("LOCAL", "CLIENTVERSION");

    if (oldVersion !== environment.version) {
      // Bsp Reset Options if breaking Changes
    }

    this.save("LOCAL", "CLIENTVERSION", environment.version);
  }

  private getCombinedKey(key: string | KeyValue<string, string>): string {
    if (typeof key === "object")
      return `${this.keyPrefix}.${key.key}.${key.value}`.toLocaleUpperCase();

    return `${this.keyPrefix}.${key}`.toLocaleUpperCase();
  }

  public clean<T extends StorageType>(type: T): number {
    const storage = this.getStorage(type);
    const count = storage.length;
    storage.clear();
    return count - storage.length;
  }

  public save<T extends StorageType, TKey extends StorageKeys<T>>(type: T, key: TKey, value: StorageValueTypes<T, TKey>): void {
    this.getStorage(type).setItem(this.getCombinedKey(key), JSON.stringify(value));
  }

  public load<T extends StorageType, TKey extends StorageKeys<T>>(type: T, key: TKey): undefined | StorageValueTypes<T, TKey> {
    const result = this.getStorage(type).getItem(this.getCombinedKey(key));
    if (result == null)
      return undefined;
    return JSON.parse(result);
  }

  public remove<T extends StorageType>(type: T, key: StorageKeys<T>): void {
    this.getStorage(type).removeItem(this.getCombinedKey(key));
  }

  private getStorage(type: StorageType): Storage {
    switch (type) {
      case "LOCAL": return localStorage;
      case "SESSION": return sessionStorage;

      default: throw new Error("Storage-Typ nicht gefunden!");
    }
  }
}
