// storage/articleDraftStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ArticleDraft = {
  title: string;
  contentHtml: string;
  publishedAt: string | null;
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
    return JSON.parse(value) as ArticleDraft;
  } catch (error) {
    console.error('Fehler beim Laden des Drafts:', error);
    return null;
  }
}