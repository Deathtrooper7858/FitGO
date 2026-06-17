import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

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
      ...mobileTranslations,
      web: webTranslations,
      ...webTranslations,
    }
  };
});
