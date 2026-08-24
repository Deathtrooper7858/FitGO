import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

function cleanDottedKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const cleanKey = k.replace(/\./g, ' ');
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      out[cleanKey] = cleanDottedKeys(v as Record<string, unknown>);
    } else {
      out[cleanKey] = v;
    }
  }
  return out;
}

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  const mobileTranslations = cleanDottedKeys((await import(`../../i18n/translations/${locale}.json`)).default);
  let webTranslations: Record<string, unknown> = {};
  try {
    webTranslations = cleanDottedKeys((await import(`../../i18n/web-translations/${locale}.json`)).default);
  } catch {
    // If web translations don't exist yet, we just use an empty object
  }

  return {
    locale,
    messages: {
      ...mobileTranslations,
      ...webTranslations,
    }
  };
});
