// utils/i18n.ts
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import de from '../locales/de.json';
import en from '../locales/en.json';

const i18n = new I18n({ en, de }) as any; // cast, damit TS nicht meckert
i18n.enableFallback = true;

const deviceLang = getLocales()[0]?.languageCode ?? 'en';
const locale = deviceLang.toLowerCase().startsWith('de') ? 'de' : 'en';
i18n.locale = locale;

export default i18n as I18n;
export function getLocale(): string { return locale; }