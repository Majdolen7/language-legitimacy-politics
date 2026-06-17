export type Locale = 'de' | 'ar' | 'en';

export const LOCALES: Locale[] = ['de', 'ar', 'en'];
export const DEFAULT_LOCALE: Locale = 'de';

export function getLocaleFromURL(pathname: string): Locale {
  const first = pathname.split('/').filter(Boolean)[0];
  if (first === 'ar') return 'ar';
  if (first === 'en') return 'en';
  return 'de';
}

export function stripLocalePrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/(ar|en)(\/|$)/, '/');
  return stripped || '/';
}

export function getLocalePath(pathname: string, targetLocale: Locale): string {
  const stripped = stripLocalePrefix(pathname);
  if (targetLocale === 'de') return stripped;
  const base = stripped === '/' ? '' : stripped.replace(/\/$/, '');
  return `/${targetLocale}${base}`;
}

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

export function localeDir(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
