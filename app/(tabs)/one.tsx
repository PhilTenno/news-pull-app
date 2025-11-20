// app/(tabs)/one.tsx
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppDropdown } from '@/components/AppDropdown';
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
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import LexicalDomEditor from '../../components/dom/LexicalDomEditor';

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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  // Lade Websites beim Start
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

  // Lade Draft wenn Website/Archiv geändert wird
  useEffect(() => {
    const loadCurrentDraft = async () => {
      if (!selectedWebsiteId || !selectedArchiveId) return;

      const existing = await loadDraft(selectedWebsiteId, selectedArchiveId);
      const toSet: ArticleDraft =
        existing ?? { title: '', contentHtml: '', publishedAt: null };

      setDraft(toSet);
    };

    loadCurrentDraft();
  }, [selectedWebsiteId, selectedArchiveId]);


  //Log
  useEffect(() => {
  console.log('Draft contentHtml:', draft.contentHtml);
}, [draft.contentHtml]);

  // Titel ändern
  const handleChangeDraftTitle = (title: string) => {
    setDraft(prev => ({ ...prev, title }));
  };

  // Datum formatieren (z.B. "14.11.2025")
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Datepicker öffnen/schließen
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

    setDraft(prev => ({ ...prev, publishedAt: iso }));
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    if (!selectedWebsiteId || !selectedArchiveId) return;
    try {
      await saveDraft(selectedWebsiteId, selectedArchiveId, draft);
      console.log('Draft gespeichert');
      // Optional: später Toast/Alert einbauen
    } catch (e) {
      console.error('Fehler beim Speichern:', e);
    }
  };

  // Berechnung der Selektion
  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId) ?? null;
  const archives: ArchiveConfig[] = selectedWebsite?.archives ?? [];
  const selectedArchive = archives.find(a => a.id === selectedArchiveId) ?? null;

  return (
    <ScrollView
      style={globalStyles.screenContainer}
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={globalStyles.sectionTitle}>Archiv wählen</Text>

      {websites.length === 0 ? (
        <Text style={{ color: '#999', marginBottom: 16 }}>
          Noch keine Webseiten konfiguriert. Bitte im Tab "Einstellungen" anlegen.
        </Text>
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.column}>
              <AppDropdown
                label="Website"
                placeholder="Website wählen..."
                items={websites.map(w => ({ id: w.id, label: w.name }))}
                selectedId={selectedWebsiteId}
                onSelectId={id => {
                  setSelectedWebsiteId(id);
                  const newWebsite = websites.find(w => w.id === id) ?? null;
                  const firstArchiveId = newWebsite?.archives[0]?.id ?? null;
                  setSelectedArchiveId(firstArchiveId);
                }}
              />
            </View>
            <View style={[styles.column, { marginLeft: 8 }]}>
              <AppDropdown
                label="Archiv"
                placeholder="Archiv wählen..."
                items={archives.map(a => ({ id: a.id, label: a.name }))}
                selectedId={selectedArchiveId}
                onSelectId={id => {
                  setSelectedArchiveId(id);
                }}
              />
            </View>
          </View>

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

          <View style={[styles.rowBetween, { marginTop: 20 }]}>
            <Text style={globalStyles.label}>Inhalt</Text>

            <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
              <Text style={styles.dateButtonText}>
                {draft.publishedAt
                  ? formatDate(draft.publishedAt)
                  : 'Datum setzen'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 12, marginBottom: 24,backgroundColor:'#fff',borderRadius:6, borderColor:'#ccc',borderWidth:1 }}>
            <LexicalDomEditor
              value={draft.contentHtml}
              onChange={(html) => {
                setDraft(prev => ({ ...prev, contentHtml: html }));
              }}
              dom={{ style: { height: 250 } }}
            />
          </View>
          <View style={{ marginTop: 0, alignItems: 'flex-end' }}>
            <TouchableOpacity onPress={handleSave}>
              <Text style={{ color: '#0a7ea4', fontWeight: '600' }}>
                Entwurf speichern
              </Text>
            </TouchableOpacity>
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
  }
});