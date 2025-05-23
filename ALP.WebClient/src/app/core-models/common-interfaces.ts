//import { FormControl } from "@angular/forms";

export interface IMuiDesc {
  descDE: string;
  descEN: string;
}

export interface IMuiName {
  nameDE: string;
  nameEN: string;
}

export interface IChanged {
  changedDate: string;
  changedUserId: number;
}

export const languages = ["DE", "EN"] as const;
export type LanguageEnum = typeof languages[number];

/*export type FormControllify<T> = { [Property in keyof T]: FormControl<T[Property]> };*/
