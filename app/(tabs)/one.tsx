// app/(tabs)/one.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
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
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
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
    keywords: '',
    image: null,
  });

  // Kennzeichnet, ob es ungespeicherte Änderungen gibt (für spätere UI-Anzeige gedacht)
  const [draftDirty, setDraftDirty] = useState(false);

  const autoSaveTimeoutRef = useRef<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  // Websites laden
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

  // Draft laden, wenn Website/Archiv wechselt
  useEffect(() => {
    const loadCurrentDraft = async () => {
      if (!selectedWebsiteId || !selectedArchiveId) return;

      const existing = await loadDraft(selectedWebsiteId, selectedArchiveId);
      const toSet: ArticleDraft =
        existing ?? { title: '', contentHtml: '', publishedAt: null, keywords: '' };

      setDraft({
        ...toSet,
        keywords: toSet.keywords ?? '',
        image: toSet.image ?? null,
      });
    };

    loadCurrentDraft();
  }, [selectedWebsiteId, selectedArchiveId]);

  // Log
  useEffect(() => {
    console.log('Draft contentHtml:', draft.contentHtml);
  }, [draft.contentHtml]);

  // Titel ändern
  const handleChangeDraftTitle = (title: string) => {
    setDraft(prev => ({ ...prev, title }));
    scheduleAutoSave();
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

  const handleConfirmDate = async (selectedDate: Date) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const iso = `${year}-${month}-${day}T00:00:00.000Z`;

    const nextDraft = { ...draft, publishedAt: iso };
    setDraft(nextDraft);
    setShowDatePicker(false);

    // Nach expliziter Bestätigung direkt speichern
    if (hasDraftContent(nextDraft)) {
      await saveCurrentDraft(nextDraft);
    }
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const hasDraftContent = (d: ArticleDraft) => {
    return (
      (d.title && d.title.trim().length > 0) ||
      (d.contentHtml && d.contentHtml.trim().length > 0) ||
      (d.keywords && d.keywords.trim().length > 0) ||
      d.publishedAt !== null ||
      !!d.image
    );
  };

  const saveCurrentDraft = async (d: ArticleDraft = draft) => {
    if (!selectedWebsiteId || !selectedArchiveId) return;
    try {
      await saveDraft(selectedWebsiteId, selectedArchiveId, d);
      console.log('Draft gespeichert');
      setDraftDirty(false);
    } catch (e) {
      console.error('Fehler beim Speichern:', e);
    }
  };

  const scheduleAutoSave = () => {
    // Nur Auto-Save, wenn es sich lohnt
    if (!hasDraftContent(draft)) {
      return;
    }

    setDraftDirty(true);

    // alten Timer löschen
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // neuen Timer setzen (z.B. 2000 ms)
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveCurrentDraft();
    }, 2000) as unknown as number;
  };

  const handleSave = async () => {
    await saveCurrentDraft();
  };


  const processImage = async (uri: string) => {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [
          // Auf max. 1600 px an der längeren Seite skalieren
          { resize: { width: 2500 } },
        ],
        {
          compress: 0.85,       // 0–1, niedriger = kleinere Datei
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipulated.uri;
    } catch (e) {
      console.warn('Bildmanipulation fehlgeschlagen, verwende Original:', e);
      return uri;
    }
  };

  // Bild aus Galerie
  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Zugriff benötigt',
        'Bitte erlaube den Zugriff auf deine Fotos, um ein Bild auswählen zu können.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1, // wir komprimieren später selbst
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];

    // Bild vor dem Speichern verkleinern/komprimieren
    const processedUri = await processImage(asset.uri);

    setDraft(prev => ({
      ...prev,
      image: {
        uri: processedUri,
        alt: prev.image?.alt ?? '',
      },
    }));
    scheduleAutoSave();
  };

  // Bild mit Kamera aufnehmen
  const pickImageFromCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Kamera-Zugriff benötigt',
          'Bitte erlaube den Zugriff auf die Kamera, um ein Foto aufnehmen zu können.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1, // volle Qualität, wir komprimieren danach
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      // Bild vor dem Speichern verkleinern/komprimieren
      const processedUri = await processImage(asset.uri);

      setDraft(prev => ({
        ...prev,
        image: {
          uri: processedUri,
          alt: prev.image?.alt ?? '',
        },
      }));
      scheduleAutoSave();
    } catch (err: any) {
      if (String(err?.message || err).includes('Camera not available on simulator')) {
        Alert.alert(
          'Kamera nicht verfügbar',
          'Die Kamera steht im iOS-Simulator nicht zur Verfügung. Bitte teste auf einem echten Gerät.'
        );
      } else {
        console.error(err);
        Alert.alert('Fehler', 'Beim Öffnen der Kamera ist ein Fehler aufgetreten.');
      }
    }
  };

  // Ein Button → Auswahl Kamera oder Galerie
  const handlePhotoButtonPress = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: draft.image ? 'Foto austauschen' : 'Foto hinzufügen',
        options: ['Foto aufnehmen', 'Aus Galerie wählen', 'Abbrechen'],
        cancelButtonIndex: 2,
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          void pickImageFromCamera();
        } else if (buttonIndex === 1) {
          void pickImageFromLibrary();
        }
      }
    );
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
                onSelectId={async id => {
                  if (hasDraftContent(draft)) {
                    await saveCurrentDraft();
                  }

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
                onSelectId={async id => {
                  if (hasDraftContent(draft)) {
                    await saveCurrentDraft();
                  }
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

          <View
            style={{
              marginTop: 12,
              marginBottom: 16,
              backgroundColor: '#fff',
              borderRadius: 6,
              borderColor: '#ccc',
              borderWidth: 1,
            }}
          >
            <LexicalDomEditor
              value={draft.contentHtml}
              onChange={html => {
                setDraft(prev => ({ ...prev, contentHtml: html }));
                scheduleAutoSave();
              }}
              dom={{ style: { height: 250 } }}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={globalStyles.label}>Artikel-Keywords</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="z.B. Sport, Radsport, Gravelbike"
              value={draft.keywords}
              onChangeText={keywords => {
                setDraft(prev => ({ ...prev, keywords }));
                scheduleAutoSave();
              }}
            />
          </View>

          {/* Bild-Bereich */}
          <View style={{ marginBottom: 16 }}>
            <View style={styles.rowBetween}>
              <Text style={globalStyles.label}>Bild</Text>

              <TouchableOpacity onPress={handlePhotoButtonPress}>
                <Text style={{ color: '#0a7ea4', fontWeight: '600' }}>
                  {draft.image ? 'Foto austauschen' : 'Foto hinzufügen'}
                </Text>
              </TouchableOpacity>
            </View>

            {draft.image && (
              <View style={{ marginTop: 8 }}>
                <Image
                  source={{ uri: draft.image.uri }}
                  style={{
                    width: '100%',
                    height: 180,
                    borderRadius: 6,
                    backgroundColor: '#eee',
                  }}
                  resizeMode="cover"
                />
                <TextInput
                  style={[globalStyles.input, { marginTop: 8 }]}
                  placeholder="Kurze Bildbeschreibung einfügen"
                  value={draft.image.alt}
                  onChangeText={alt => {
                    setDraft(prev => ({
                      ...prev,
                      image: prev.image ? { ...prev.image, alt } : prev.image,
                    }));
                    scheduleAutoSave();
                  }}
                />
                <View style={{ marginTop: 4, alignItems: 'flex-end' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setDraft(prev => ({ ...prev, image: null }));
                      scheduleAutoSave();
                    }}
                  >
                    <Text style={{ color: '#cc0000', fontSize: 12 }}>
                      Bild entfernen
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  },
});