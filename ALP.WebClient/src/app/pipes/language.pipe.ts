import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../core-services/language.service';

@Pipe({
  name: 'lang',
  pure: false
})
export class LanguagePipe implements PipeTransform {

  constructor(private languageService: LanguageService) { }

  public transform(value: string): string {
    return this.languageService.translate(value);
  }

}
