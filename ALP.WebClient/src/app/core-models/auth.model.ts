// user.model.ts - Complete user models
import { LanguageEnum } from "./common-interfaces";

// Your existing auth models (keeping them as-is)
export interface User {
  id: number;
  accessToken: string;
  refreshToken: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRoleEnum;
  languageIso: LanguageEnum;
}

export interface UserWithPermissions extends User {
  permitListingIds: number[];
}

export interface DisplayUser {
  id: number;
  firstName: string;
  lastName: string;
}

export const userRoles = ["ClientUser", "BusinessUser", "Admin"] as const;
export type UserRoleEnum = typeof userRoles[number];

export enum AccessLevel {
  General = 0,
  Elevated = 1
}

// API Response Models for backend integration
export interface LoginUserViewModel {
  email: string;
  accessToken: string;
  refreshToken: string;
  firstName: string;
  lastName: string;
  role: UserRoleEnum
}

// For token service compatibility
export interface JwtTokenBundle {
  accessToken?: string;
  refreshToken?: string;
}

// Authentication state interface
export interface AuthenticationState {
  isAuthenticated: boolean;
  user: User | null;
  tokenType: string | undefined;
  isProfileComplete: boolean;
}

// Login request interface
export interface LoginRequest {
  email: string;
  password: string;
}

// ADD THIS: Registration request interface to match your backend UserCreateModel
export interface UserCreateModel {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRoleEnum;
}

// Registration request with password (what we send to backend)
export interface RegisterRequest {
  userModel: UserCreateModel;
  password: string;
}

// Partial user state - for when we only have login response data
export interface PartialUserState {
  email: string;
  isProfileLoaded: boolean;
}

// User profile that might come from a separate endpoint
export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userRoleId: UserRoleEnum;
  languageIso: LanguageEnum;
  permitListingIds?: number[];
}

// Utility type for user updates
export interface UserUpdateModel {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  userRoleId?: UserRoleEnum;
  languageIso?: LanguageEnum;
}

// For creating user from JWT token claims (if token contains user info)
export interface UserFromToken {
  email: string;
  role?: string;
}
