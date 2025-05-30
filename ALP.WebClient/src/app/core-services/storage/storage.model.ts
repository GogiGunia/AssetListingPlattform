// storage.model.ts - Updated with new keys
import { KeyValue } from "@angular/common";

export declare type StorageType = "LOCAL" | "SESSION";

export declare type StorageKeys<T extends StorageType> =
  T extends "LOCAL" ? LocalStoreKeys :
  T extends "SESSION" ? SessionStoreKeys :
  never;

export declare type StorageValueTypes<T extends StorageType, TKey extends StorageKeys<T>> =
  T extends "LOCAL" ? LocalStorageValueTypes<TKey> :
  T extends "SESSION" ? SessionStorageValueTypes<TKey> :
  never;

// Updated LocalStoreKeys with new authentication keys
export declare type LocalStoreKeys =
  | "ACCESS_TOKEN"
  | "REFRESH_TOKEN"
  | "CLIENTVERSION"
  | "DARKMODE"
  | "CURRENT_USER"        // New: for user data
  | "USER_PERMISSIONS"    // New: for user permissions
  | KeyValue<"HIDDEN_TABLE_COLUMNS", string>;

// Updated LocalStorageValueTypes with new types
declare type LocalStorageValueTypes<TKey> =
  TKey extends "ACCESS_TOKEN" ? string :
  TKey extends "REFRESH_TOKEN" ? string :
  TKey extends "CLIENTVERSION" ? string :
  TKey extends "DARKMODE" ? boolean :
  TKey extends "CURRENT_USER" ? string :           // JSON string of User object
  TKey extends "USER_PERMISSIONS" ? string :       // JSON string of number[] array
  TKey extends KeyValue<"HIDDEN_TABLE_COLUMNS", string> ? { id: string, hidden?: boolean }[] :
  never;

declare type SessionStoreKeys = "DUMMY";

declare type SessionStorageValueTypes<TKey> =
  TKey extends "DUMMY" ? string :
  never;
