// app/services/LocalAISummarizer.ts
import { NativeModules } from 'react-native';

export type GeneratedMeta = {
  metaTitle: string;
  metaDescription: string;
  teaser: string;
};

const NATIVE = (NativeModules as any).LocalAISummarizer ?? null;

const trimTo = (s: string, max: number) =>
  s ? s.trim().substring(0, max) : '';

/**
 * LocalAISummarizer
 * - isAvailable(): prüft auf native Bridge
 * - generate(title, contentPlain): returns metaTitle, metaDescription, teaser
 *
 * NOTE: native Module API contract (name + method) muss später in der nativen Implementierung passend sein.
 */
export const LocalAISummarizer = {
  isAvailable: async (): Promise<boolean> => {
    return !!NATIVE;
  },

  generate: async (
    title: string,
    contentPlain: string
  ): Promise<GeneratedMeta> => {
    // Wenn native verfügbar: delegiere an native Implementierung
    if (NATIVE && typeof NATIVE.generate === 'function') {
      try {
        // Annahme: native.generate(title, contentPlain) -> Promise<{metaTitle,metaDescription,teaser}>
        const res = await NATIVE.generate(title ?? '', contentPlain ?? '');
        return {
          metaTitle: trimTo(res?.metaTitle ?? title ?? '', 60),
          metaDescription: trimTo(res?.metaDescription ?? (contentPlain ?? ''), 155),
          teaser: trimTo(res?.teaser ?? (contentPlain ?? ''), 350),
        };
      } catch (e) {
        //-> console.warn('Native AISummarizer failed, falling back to JS:', e);
        // fallback to JS below
      }
    }

    // JS-Dummy-Generierung (heuristisch)
    const normalized = (contentPlain ?? '').replace(/\s+/g, ' ').trim();

    const metaTitle = trimTo(title ?? normalized.split('. ')[0] ?? '', 60);
    const metaDescription = trimTo(normalized, 155);
    const teaser = trimTo(normalized, 350);

    return { metaTitle, metaDescription, teaser };
  },
};