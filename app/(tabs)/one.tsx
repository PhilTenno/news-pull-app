// app/(tabs)/one.tsx
import {
  ArchiveConfig,
  loadWebsites,
  WebsiteConfig,
} from '@/storage/settingsStorage';
import { globalStyles } from '@/styles/globalStyles';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppDropdown } from '@/components/AppDropdown';
import { ArticleToolbar } from '@/components/ArticleToolbar';
import QuillEditor from 'react-native-cn-quill';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

type ArticleDraft = {
  title: string;
  contentHtml: string;
  publishedAt: string | null; // Veröffentlichungsdatum (ISO-String) oder null
};

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

  const _editor = useRef<QuillEditor>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const storedWebsites = await loadWebsites();
      setWebsites(storedWebsites);

      const firstWebsite = storedWebsites[0] ?? null;
      setSelectedWebsiteId(firstWebsite?.id ?? null);
      setSelectedArchiveId(firstWebsite?.archives[0]?.id ?? null);

      setLoading(false);
    };

    loadSettings();
  }, []);

  if (loading) {
    return (
      <View style={globalStyles.screenContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  const selectedWebsite =
    websites.find((w) => w.id === selectedWebsiteId) ?? null;
  const archives: ArchiveConfig[] = selectedWebsite?.archives ?? [];
  const selectedArchive =
    archives.find((a) => a.id === selectedArchiveId) ?? null;

  const handleChangeDraftTitle = (title: string) => {
    setDraft((prev) => ({ ...prev, title }));
  };

  const handleHtmlChange = (html: string) => {
    setDraft((prev) => ({ ...prev, contentHtml: html }));
  };

  // Datum formatieren (z.B. "14.11.2025")
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Datepicker öffnen (vorerst nur Placeholder)
  const openDatePicker = () => {
    // Wenn schon ein Datum gesetzt ist, dieses als Startdatum nehmen

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
                  const newWebsite = websites.find((w) => w.id === id) ?? null;
                  setSelectedArchiveId(newWebsite?.archives[0]?.id ?? null);
                  // Draft-Laden machen wir später
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
                  // Draft-Laden machen wir später
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
      {/* ... deine Website-/Archiv-UI bleibt wie gehabt ... */}

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
              onToggleHtmlMode={() => {
                // Beim Umschalten Modus wechseln
                if (!isHtmlMode) {
                  // WYSIWYG → HTML-Modus: aktuellen Inhalt in rawHtml übernehmen
                  setRawHtml(draft.contentHtml);
                  setIsHtmlMode(true);
                } else {
                  // HTML-Modus → WYSIWYG: rawHtml zurück in draft.contentHtml
                  setDraft((prev) => ({
                    ...prev,
                    contentHtml: rawHtml,
                  }));
                  setIsHtmlMode(false);
                }
              }}
            />

            {/* Quill Editor */}
            {!isHtmlMode ? (
              <QuillEditor
                ref={_editor}
                style={styles.quillEditor}
                initialHtml={draft.contentHtml}
                onHtmlChange={(event: { html: string }) =>
                  handleHtmlChange(event.html)
                }
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
            : new Date()
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
    backgroundColor: '#e6f0ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#b0c8ff',
  },
  dateButtonText: {
    fontSize: 13,
    color: '#0056d6',
    fontWeight: '500',
  },  
  htmlTextInput: {
    minHeight: 200,
    padding: 8,
    fontSize: 12,
  },  
});