'use client';

import {useRouter, usePathname} from '@/i18n/routing';
import {useLocale} from 'next-intl';
import { Globe } from 'lucide-react';
import { ChangeEvent } from 'react';

const languages = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' }
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    router.replace(pathname, {locale: nextLocale});
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <Globe size={18} className="text-text-muted" />
      <select
        className="bg-transparent text-sm text-text-secondary hover:text-text-primary cursor-pointer outline-none focus:ring-0 appearance-none pr-4"
        value={locale}
        onChange={onSelectChange}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-surface text-text-primary">
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
