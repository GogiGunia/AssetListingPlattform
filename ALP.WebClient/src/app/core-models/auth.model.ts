import { IMuiName, LanguageEnum } from "./common-interfaces";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userRoleId: UserRoleEnum;
  languageIso: LanguageEnum;
}

//TODO Check
export interface UserWithPermissions extends User {
  permitListingIds: number[];
}

//TODO Update Model also for listings
//export interface UserUpdateModel {
//  id: number;
//  email: string;
//  firstName: string;
//  lastName: string;
//  userRoleId: UserRoleEnum;
//  permitListingIds: number[];
//}

export interface UserRole extends IMuiName {
  id: UserRoleEnum;
}

export const userRoles = ["ClientUser", "BusinessUser", "Admin"] as const;

export type UserRoleEnum = typeof userRoles[number];

export enum AccessLevel {
  General = 0,
  Elevated = 1
}

export interface DisplayUser {
  id: number;
  firstName: string;
  lastName: string;
}
