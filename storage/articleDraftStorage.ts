// storage/articleDraftStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ArticleDraft = {
  title: string;
  contentHtml: string;
  publishedAt: string | null;
};

const DRAFT_PREFIX = 'articleDraft'; // Basis für unsere Keys

// Hilfsfunktion, um einen eindeutigen Key pro Website + Archiv zu erzeugen
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
    console.log('[STORAGE] saveDraft key=', key, 'title=', draft.title, 'len=', draft.contentHtml?.length);
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
    console.log('[STORAGE] loadDraft key=', key);
    const value = await AsyncStorage.getItem(key);
    if (!value) {
      console.log('[STORAGE] loadDraft MISS', key);
      return null;
    }
    const parsed = JSON.parse(value) as ArticleDraft;
    console.log('[STORAGE] loadDraft HIT', key, 'title=', parsed.title, 'len=', parsed.contentHtml?.length);
    return parsed;
  } catch (error) {
    console.error('Fehler beim Laden des Drafts:', error);
    return null;
  }
}