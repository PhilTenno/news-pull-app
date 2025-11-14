// storage/settingsStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEBSITES_KEY = 'settings.websites';

export type ArchiveConfig = {
  id: string;
  name: string;
  apiToken: string;
};

export type WebsiteConfig = {
  id: string;
  name: string;     // Anzeigename der Website (z.B. "Kanzlei Müller", "Blog")
  baseUrl: string;  // https://...
  archives: ArchiveConfig[];
};

export async function saveWebsites(websites: WebsiteConfig[]) {
  await AsyncStorage.setItem(WEBSITES_KEY, JSON.stringify(websites));
}

export async function loadWebsites(): Promise<WebsiteConfig[]> {
  const json = await AsyncStorage.getItem(WEBSITES_KEY);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}