import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['de', 'en', 'es', 'fr', 'it', 'pt', 'ru'],
  defaultLocale: 'es'
});

export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);
