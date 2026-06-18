// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://Majdolen7.github.io',
  base: '/language-legitimacy-politics',
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'ar', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
