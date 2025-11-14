// app/(tabs)/one.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppDropdown } from '@/components/AppDropdown';
import { ArticleToolbar } from '@/components/ArticleToolbar';
import {
  ArticleDraft,
  loadDraft,
  saveDraft,
} from '@/storage/articleDraftStorage';
import {
  ArchiveConfig,
  loadWebsites,
  WebsiteConfig,
} from '@/storage/settingsStorage';
import { globalStyles } from '@/styles/globalStyles';
import QuillEditor from 'react-native-cn-quill';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function ArticleScreen() {
  const [websites, setWebsites] = useState<WebsiteConfig[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState<ArticleDraft>({
    title: '',
    contentHtml: '',
    publishedAt: null,
  });

  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(draft.contentHtml);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  // Wichtig: any statt QuillEditor-Typ, um TS-Fehler zu vermeiden
  const _editor = useRef<any>(null);

  // Merkt den zuletzt geladenen Draft (für Skip-Logic beim Speichern)
  const lastLoadedDraftRef = useRef<string | null>(null);

  // Optional: Debounce für Autosave — Typ portable mit ReturnType<typeof setTimeout>
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Einstellungen (Websites/Archive) laden
  useEffect(() => {
    const loadSettings = async () => {
      const storedWebsites = await loadWebsites();
      setWebsites(storedWebsites);

      const firstWebsite = storedWebsites[0] ?? null;
      const firstWebsiteId = firstWebsite?.id ?? null;
      const firstArchiveId = firstWebsite?.archives[0]?.id ?? null;

      setSelectedWebsiteId(firstWebsiteId);
      setSelectedArchiveId(firstArchiveId);

      setLoading(false);
    };

    loadSettings();
  }, []);

  // Draft für aktuelle Website + Archiv laden
  useEffect(() => {
    const loadCurrentDraft = async () => {
      if (!selectedWebsiteId || !selectedArchiveId) {
        return;
      }

      try {
        const existing = await loadDraft(selectedWebsiteId, selectedArchiveId);

        const toSet: ArticleDraft =
          existing ?? {
            title: '',
            contentHtml: '',
            publishedAt: null,
          };

        setDraft(toSet);
        setRawHtml(toSet.contentHtml ?? '');
        setIsHtmlMode(false);

        // Genauso merken, wie geladen (als JSON)
        lastLoadedDraftRef.current = JSON.stringify(toSet);

        console.log(
          '[UI] loaded draft for',
          selectedWebsiteId,
          selectedArchiveId,
          existing ? 'FOUND' : 'NEW'
        );
      } catch (err) {
        console.error('Error loading draft:', err);
      }
    };

    loadCurrentDraft();
  }, [selectedWebsiteId, selectedArchiveId]);

  // Draft automatisch speichern (debounced) für aktuelle Website + Archiv
  useEffect(() => {
    if (!selectedWebsiteId || !selectedArchiveId) {
      return;
    }

    const draftJson = JSON.stringify(draft);

    // Wenn Draft identisch zum zuletzt geladenen → nicht speichern
    if (lastLoadedDraftRef.current === draftJson) {
      return;
    }

    const persistDraft = async () => {
      try {
        console.log(
          '[UI] persistDraft for',
          selectedWebsiteId,
          selectedArchiveId,
          'title=',
          draft.title,
          'len=',
          draft.contentHtml?.length
        );
        await saveDraft(selectedWebsiteId, selectedArchiveId, draft);

        // Nach erfolgreichem Speichern Zustand merken
        lastLoadedDraftRef.current = draftJson;
      } catch (err) {
        console.error('Persist draft failed', err);
      }
    };

    // Debounce: 800ms nach letzter Änderung speichern
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current as ReturnType<typeof setTimeout>);
    }
    saveTimeoutRef.current = setTimeout(persistDraft, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current as ReturnType<typeof setTimeout>);
      }
    };
  }, [draft, selectedWebsiteId, selectedArchiveId]);

  // Selektion / Hilfsvariablen
  const selectedWebsite =
    websites.find((w) => w.id === selectedWebsiteId) ?? null;
  const archives: ArchiveConfig[] = selectedWebsite?.archives ?? [];
  const selectedArchive =
    archives.find((a) => a.id === selectedArchiveId) ?? null;

  // Titel ändern
  const handleChangeDraftTitle = (title: string) => {
    setDraft((prev) => ({ ...prev, title }));
  };

  // Inhalt aus WYSIWYG-Editor ändern
  const handleHtmlChange = (html: string) => {
    setDraft((prev) => {
      if (prev.contentHtml === html) return prev;
      return { ...prev, contentHtml: html };
    });
  };

  // Datum formatieren (z.B. "14.11.2025")
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Datepicker öffnen
  const openDatePicker = () => {
    if (draft.publishedAt) {
      setTempDate(new Date(draft.publishedAt));
    } else {
      setTempDate(new Date());
    }
    setShowDatePicker(true);
  };

  const handleConfirmDate = (selectedDate: Date) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const iso = `${year}-${month}-${day}T00:00:00.000Z`;

    setDraft((prev) => ({ ...prev, publishedAt: iso }));
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  // Umschalten WYSIWYG <-> HTML
  const handleToggleHtmlMode = () => {
    if (!isHtmlMode) {
      // WYSIWYG → HTML
      setRawHtml(draft.contentHtml ?? '');
      setIsHtmlMode(true);
    } else {
      // HTML → WYSIWYG
      const newHtml = rawHtml ?? '';
      setDraft((prev) => ({
        ...prev,
        contentHtml: newHtml,
      }));
      setIsHtmlMode(false);

      // Editor-Inhalt aktiv setzen (falls gemountet)
      setTimeout(() => {
        try {
          if (_editor.current?.dangerouslyPasteHTML) {
            _editor.current.dangerouslyPasteHTML(newHtml);
          }
        } catch (e) {
          console.warn('Could not update editor content:', e);
        }
      }, 50);
    }
  };

  return (
    <ScrollView
      style={globalStyles.screenContainer}
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Archiv wählen */}
      <Text style={globalStyles.sectionTitle}>Archiv wählen</Text>

      {websites.length === 0 ? (
        <Text style={{ color: '#999', marginBottom: 16 }}>
          Noch keine Webseiten konfiguriert. Bitte im Tab "Einstellungen" anlegen.
        </Text>
      ) : (
        <>
          {/* Zeile mit Website- und Archiv-Dropdown */}
          <View style={styles.row}>
            <View style={styles.column}>
              <AppDropdown
                label="Website"
                placeholder="Website wählen..."
                items={websites.map((w) => ({ id: w.id, label: w.name }))}
                selectedId={selectedWebsiteId}
                onSelectId={(id) => {
                  setSelectedWebsiteId(id);
                  const newWebsite =
                    websites.find((w) => w.id === id) ?? null;
                  const firstArchiveId =
                    newWebsite?.archives[0]?.id ?? null;
                  setSelectedArchiveId(firstArchiveId);
                  // Draft wird über useEffect (loadCurrentDraft) geladen
                }}
              />
            </View>
            <View style={[styles.column, { marginLeft: 8 }]}>
              <AppDropdown
                label="Archiv"
                placeholder="Archiv wählen..."
                items={archives.map((a) => ({ id: a.id, label: a.name }))}
                selectedId={selectedArchiveId}
                onSelectId={(id) => {
                  setSelectedArchiveId(id);
                  // Draft wird über useEffect (loadCurrentDraft) geladen
                }}
              />
            </View>
          </View>

          {/* Hinweis, falls keine Archive vorhanden */}
          {selectedWebsite && archives.length === 0 && (
            <Text style={{ color: '#999', marginBottom: 16 }}>
              Für diese Website sind noch keine Archive angelegt.
            </Text>
          )}
        </>
      )}

      <Text style={globalStyles.sectionTitle}>Artikel</Text>
      {selectedWebsite && selectedArchive ? (
        <>
          <Text style={globalStyles.label}>Titel</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Artikel-Titel"
            value={draft.title}
            onChangeText={handleChangeDraftTitle}
          />

          {/* Zeile: Inhalt (links) + Veröffentlichungsdatum (rechts) */}
          <View style={[styles.rowBetween, { marginTop: 12 }]}>
            <Text style={globalStyles.label}>Inhalt</Text>

            <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
              <Text style={styles.dateButtonText}>
                {draft.publishedAt
                  ? formatDate(draft.publishedAt)
                  : 'Datum setzen'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editorContainer}>
            {/* Eigene Toolbar */}
            <ArticleToolbar
              editorRef={_editor}
              currentHtml={draft.contentHtml}
              isHtmlMode={isHtmlMode}
              onToggleHtmlMode={handleToggleHtmlMode}
            />

            {/* Quill Editor oder HTML-Textarea */}
            {!isHtmlMode ? (
              <QuillEditor
                key={`${selectedWebsiteId ?? 'no-site'}-${selectedArchiveId ?? 'no-arch'}`}
                ref={_editor}
                style={styles.quillEditor}
                initialHtml={draft.contentHtml}
                onHtmlChange={(payload: any) => {
                  const html =
                    typeof payload === 'string'
                      ? payload
                      : payload?.html ?? '';
                  handleHtmlChange(html);
                }}
                quill={{
                  placeholder: 'Artikelinhalt hier eingeben...',
                  theme: 'snow',
                  modules: {
                    toolbar: false,
                  },
                }}
              />
            ) : (
              <TextInput
                style={styles.htmlTextInput}
                multiline
                value={rawHtml}
                onChangeText={setRawHtml}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          </View>
        </>
      ) : (
        <Text style={{ color: '#999' }}>
          Bitte eine Website und ein Archiv auswählen.
        </Text>
      )}

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={
          draft.publishedAt
            ? new Date(draft.publishedAt)
            : tempDate ?? new Date()
        }
        onConfirm={handleConfirmDate}
        onCancel={handleCancelDate}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  column: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  editorContainer: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  quillEditor: {
    height: 300,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dateButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dateButtonText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  htmlTextInput: {
    minHeight: 200,
    padding: 8,
    fontSize: 12,
  },
});