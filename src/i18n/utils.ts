export type Locale = 'de' | 'ar' | 'en';

export const LOCALES: Locale[] = ['de', 'ar', 'en'];
export const DEFAULT_LOCALE: Locale = 'de';

// BASE is '' in dev, '/language-legitimacy-politics' in production.
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// Prepend the deployment base to any absolute path.
export function withBase(path: string): string {
  return BASE + path;
}

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

// Astro.url.pathname includes the base prefix in production.
// This function strips it before computing the target-locale path.
export function getLocalePath(pathname: string, targetLocale: Locale): string {
  const withoutBase =
    BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname;
  const stripped = stripLocalePrefix(withoutBase);
  if (targetLocale === 'de') return BASE + stripped;
  const pathPart = stripped === '/' ? '' : stripped.replace(/\/$/, '');
  return `${BASE}/${targetLocale}${pathPart}`;
}

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

export function localeDir(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
