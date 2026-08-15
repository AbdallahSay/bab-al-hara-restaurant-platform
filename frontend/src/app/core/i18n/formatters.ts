import { Language } from './translations';

export function formatMoney(value: number, language: Language): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
  }).format(value);
}

export function localizedText(language: Language, arabic: string, english: string): string {
  return language === 'ar' ? arabic : english;
}
