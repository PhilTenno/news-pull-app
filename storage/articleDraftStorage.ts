// storage/articleDraftStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ArticleDraftImage = {
  uri: string;
  alt: string;
};

export type ArticleDraft = {
  title: string;
  contentHtml: string;
  publishedAt: string | null;
  keywords?: string;
  image?: ArticleDraftImage | null;
};

const DRAFT_PREFIX = 'articleDraft';

const getDraftStorageKey = (websiteId: string, archiveId: string) =>
  `${DRAFT_PREFIX}:${websiteId}:${archiveId}`;

export async function saveDraft(
  websiteId: string,
  archiveId: string,
  draft: ArticleDraft
): Promise<void> {
  try {
    const key = getDraftStorageKey(websiteId, archiveId);
    const value = JSON.stringify(draft);
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Fehler beim Speichern des Drafts:', error);
  }
}

export async function loadDraft(
  websiteId: string,
  archiveId: string
): Promise<ArticleDraft | null> {
  try {
    const key = getDraftStorageKey(websiteId, archiveId);
    const value = await AsyncStorage.getItem(key);
    if (!value) {
      return null;
    }
    const parsed = JSON.parse(value) as ArticleDraft;
    return {
      ...parsed,
      image: parsed.image ?? null,
    };
  } catch (error) {
    console.error('Fehler beim Laden des Drafts:', error);
    return null;
  }
}

/**
 * Löscht den gespeicherten Draft für die gegebene Website+Archive-Kombination.
 */
export async function deleteDraft(
  websiteId: string,
  archiveId: string
): Promise<void> {
  try {
    const key = getDraftStorageKey(websiteId, archiveId);
    await AsyncStorage.removeItem(key);
    console.log(`Draft gelöscht: ${key}`);
  } catch (error) {
    console.error('Fehler beim Löschen des Drafts:', error);
  }
}