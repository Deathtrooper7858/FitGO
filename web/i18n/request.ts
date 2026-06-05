import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

function cleanKeys(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(cleanKeys);
  
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const cleanKey = key.replace(/\./g, '_');
    result[cleanKey] = cleanKeys(value);
  }
  return result;
}

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  const mobileTranslations = (await import(`../../i18n/translations/${locale}.json`)).default;
  let webTranslations = {};
  try {
    webTranslations = (await import(`../../i18n/web-translations/${locale}.json`)).default;
  } catch {
    // If web translations don't exist yet, we just use an empty object
  }

  return {
    locale,
    messages: {
      ...(cleanKeys(mobileTranslations) as Record<string, unknown>),
      web: webTranslations,
      ...(webTranslations as Record<string, unknown>)
    }
  };
});
