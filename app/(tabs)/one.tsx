// app/(tabs)/one.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppDropdown } from '@/components/AppDropdown';
import { globalStyles } from '@/styles/globalStyles';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import LexicalDomEditor from '../../components/dom/LexicalDomEditor';
import {
  ArticleDraft,
  deleteDraft,
  loadDraft,
  saveDraft,
} from '../../storage/articleDraftStorage';
import {
  ArchiveConfig,
  loadWebsites,
  WebsiteConfig,
} from '../../storage/settingsStorage';

// Neue Imports
import { GeneratedMeta, LocalAISummarizer } from '../../services/LocalAISummarizer';
import { ArticlePayload, uploadToContao } from '../../services/uploadToContao';
import { sanitizeHtmlForUpload } from '../../utils/htmlSanitizeForUpload';
import { htmlToPlainText } from '../../utils/htmlToPlainText';

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

  const changeDebounceRef = useRef<number | null>(null);
  // Kennzeichnet, ob es ungespeicherte Änderungen gibt (für spätere UI-Anzeige gedacht)
  const [draftDirty, setDraftDirty] = useState(false);

  const autoSaveTimeoutRef = useRef<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  // --- Neuer State für Publishing ---
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatusText, setPublishStatusText] = useState<string | null>(null);

  // Modal für manuelle Meta-Eingabe (wenn keine native KI vorhanden)
  const [showManualMetaModal, setShowManualMetaModal] = useState(false);
  const [manualMeta, setManualMeta] = useState<GeneratedMeta>({
    metaTitle: '',
    metaDescription: '',
    teaser: '',
  });

  const emptyDraft: ArticleDraft = {
    title: '',
    contentHtml: '',
    publishedAt: null,
    keywords: '',
    image: null,
  };

  // --- Guards / refs to avoid update loops ---
  const lastContentRef = useRef<string>(draft.contentHtml ?? '');
  // lastSavedKeyRef speichert eine Signatur des zuletzt gespeicherten Drafts
  const lastSavedKeyRef = useRef<string>('');

  // Hilfsfunktion: erzeugt einfachen Key zur Vergleichsprüfung
  const computeDraftKey = (d: ArticleDraft) => {
    return [
      d.title ?? '',
      d.contentHtml ?? '',
      d.keywords ?? '',
      d.image?.uri ?? '',
      d.publishedAt ?? '',
    ].join('|||');
  };

  // Sync ref when draft.contentHtml changes from other sources
  useEffect(() => {
    lastContentRef.current = draft.contentHtml ?? '';
  }, [draft.contentHtml]);

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

      // initialen savedKey setzen, damit scheduleAutoSave direkt erkennt, ob Änderung vorliegt
      lastSavedKeyRef.current = computeDraftKey({
        ...toSet,
        keywords: toSet.keywords ?? '',
        image: toSet.image ?? null,
      });
    };

    loadCurrentDraft();
  }, [selectedWebsiteId, selectedArchiveId]);

  // Titel ändern
  const handleChangeDraftTitle = (title: string) => {
    setDraft(prev => {
      if (prev.title === title) return prev;
      return { ...prev, title };
    });
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
    // Speichere das Datum als lokale Mitternachtszeit (lokal) und konvertiere zu ISO.
    // So bleibt dateShow beim späteren Parsen lokal 00:00:00.
    const year = selectedDate.getFullYear();
    const monthIndex = selectedDate.getMonth(); // 0-basiert
    const day = selectedDate.getDate();

    const localMidnight = new Date(year, monthIndex, day, 0, 0, 0, 0);
    const iso = localMidnight.toISOString();

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
      //-> console.log('Draft gespeichert');
      setDraftDirty(false);
      // saved key aktualisieren
      lastSavedKeyRef.current = computeDraftKey(d);
    } catch (e) {
      console.error('Fehler beim Speichern:', e);
    }
  };

  const scheduleAutoSave = () => {
    // Nur Auto-Save, wenn es sich lohnt
    if (!hasDraftContent(draft)) {
      return;
    }

    // Prüfen, ob sich der Draft seit dem letzten Save wirklich geändert hat
    const currentKey = computeDraftKey(draft);
    if (currentKey === lastSavedKeyRef.current) {
      // nichts zu speichern
      setDraftDirty(false);
      return;
    }

    setDraftDirty(true);

    // alten Timer löschen
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // neuen Timer setzen (jetzt 1000 ms statt 2000 ms)
    // @ts-ignore - RN setTimeout returns number
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveCurrentDraft();
    }, 1000) as unknown as number;
  };

  const handleSave = async () => {
    await saveCurrentDraft();
  };

  const processImage = async (uri: string) => {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [
          // Auf max. 2500 px an der längeren Seite skalieren
          { resize: { width: 2500 } },
        ],
        {
          compress: 0.85, // 0–1, niedriger = kleinere Datei
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

  // Hilfs-Funktion: publishedAt (ISO) -> "YYYY-MM-DD HH:mm:SS"
  const formatDateShow = (iso: string | null): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  };

  // --- Publish-Flow ---
  const handlePublish = async () => {
    // Minimalanforderung: Titel + Inhalt
    if (!draft.title || draft.title.trim().length === 0) {
      Alert.alert('Fehler', 'Bitte gib einen Titel ein.');
      return;
    }
    if (!draft.contentHtml || draft.contentHtml.trim().length === 0) {
      Alert.alert('Fehler', 'Bitte füge Inhalt zum Artikel hinzu.');
      return;
    }
    if (!selectedWebsite || !selectedArchive) {
      Alert.alert('Fehler', 'Bitte wähle Website und Archiv aus.');
      return;
    }

    // Speichere finalen Entwurf vor Upload (optional)
    if (hasDraftContent(draft)) {
      await saveCurrentDraft();
    }

    try {
      setIsPublishing(true);
      setPublishStatusText('Artikel wird vorbereitet…');

      // 1) HTML für Upload sanitisieren und Plaintext erzeugen
      const sanitizedHtml = sanitizeHtmlForUpload(draft.contentHtml ?? '');
      const plain = htmlToPlainText(sanitizedHtml);

      // 2) KI verfügbar?
      const nativeAvailable = await LocalAISummarizer.isAvailable();

      let meta: GeneratedMeta;
      if (nativeAvailable) {
        setPublishStatusText('Meta-Daten werden generiert…');
        meta = await LocalAISummarizer.generate(draft.title, plain);
      } else {
        // Fallback: wir erzeugen initiale Werte per JS-Dummy, aber zeigen Modal für manuelles Editieren
        setPublishStatusText('Meta-Daten (manuell) vorbereiten…');
        const generated = await LocalAISummarizer.generate(draft.title, plain);
        setManualMeta(generated);
        setShowManualMetaModal(true);
        // Warten, bis Nutzer Modal bestätigt oder abbricht
        return;
      }

      // 3) Payload zusammenbauen
      const payloadItem: ArticlePayload = {
        title: draft.title,
        teaser: meta.teaser,
        article: sanitizedHtml,
        metaTitle: meta.metaTitle,
        metaDescription: meta.metaDescription,
        dateShow: formatDateShow(draft.publishedAt),
        keywords: draft.keywords ?? '',
        imageAlt: draft.image?.alt ?? '',
      };

      // 4) Upload starten
      setPublishStatusText('Artikel wird gesendet…');

      const endpoint = `${selectedWebsite.baseUrl.replace(/\/$/, '')}/newspullimport`;
      const token = selectedArchive.apiToken ?? '';

      const result = await uploadToContao(payloadItem, draft.image?.uri ?? null, token, endpoint);

      if (result.ok) {
        setPublishStatusText('Artikel übertragen ✅');

        // Draft löschen und UI leeren
        try {
          if (selectedWebsiteId && selectedArchiveId) {
            await deleteDraft(selectedWebsiteId, selectedArchiveId);
            console.log('Lokaler Draft gelöscht nach erfolgreichem Upload.');
          }
        } catch (err) {
          console.warn('Fehler beim Löschen des Drafts:', err);
        }

        // Draft im UI leeren
        setDraft(emptyDraft);
        setDraftDirty(false);
        lastSavedKeyRef.current = computeDraftKey(emptyDraft);

        Alert.alert('Erfolgreich', 'Artikel wurde veröffentlicht und lokaler Entwurf gelöscht.');
      } else {
        console.warn('Upload failed', result.status, result.body);
        setPublishStatusText(`Fehler beim Senden (${result.status})`);
        Alert.alert('Fehler', 'Der Upload ist fehlgeschlagen. Server antwortet: ' + String(result.body));
      }

    } catch (e) {
      console.error('Publish error:', e);
      Alert.alert('Fehler', 'Beim Veröffentlichen ist ein Fehler aufgetreten.');
    } finally {
      // kurz Status anzeigen, dann schließen
      setTimeout(() => {
        setIsPublishing(false);
        setPublishStatusText(null);
      }, 1500);
    }
  };

  // Callback: Nutzer bestätigt manuelle Meta-Eingabe im Modal
  const handleConfirmManualMeta = async () => {
    setShowManualMetaModal(false);

    // Verwende manuelle Meta und fahre mit Upload fort
    try {
      setIsPublishing(true);
      setPublishStatusText('Artikel wird gesendet…');
      const sanitizedHtml = sanitizeHtmlForUpload(draft.contentHtml ?? '');
      const payloadItem: ArticlePayload = {
        title: draft.title,
        teaser: manualMeta.teaser,
        article: sanitizedHtml,
        metaTitle: manualMeta.metaTitle,
        metaDescription: manualMeta.metaDescription,
        dateShow: formatDateShow(draft.publishedAt),
        keywords: draft.keywords ?? '',
        imageAlt: draft.image?.alt ?? '',
      };

      const endpoint = `${selectedWebsite!.baseUrl.replace(/\/$/, '')}/newspullimport`;
      const token = selectedArchive!.apiToken ?? '';

      const result = await uploadToContao(payloadItem, draft.image?.uri ?? null, token, endpoint);

      if (result.ok) {
        setPublishStatusText('Artikel übertragen ✅');

        try {
          if (selectedWebsiteId && selectedArchiveId) {
            await deleteDraft(selectedWebsiteId, selectedArchiveId);
            console.log('Lokaler Draft gelöscht nach erfolgreichem Upload (manuelle Meta).');
          }
        } catch (err) {
          console.warn('Fehler beim Löschen des Drafts:', err);
        }

        setDraft(emptyDraft);
        setDraftDirty(false);
        lastSavedKeyRef.current = computeDraftKey(emptyDraft);

        Alert.alert('Erfolgreich', 'Artikel wurde veröffentlicht und lokaler Entwurf gelöscht.');
      } else {
        setPublishStatusText(`Fehler beim Senden (${result.status})`);
        Alert.alert('Fehler', 'Der Upload ist fehlgeschlagen. Überprüfe die Server-Antwort.');
      }
    } catch (e) {
      console.error('Publish manual error:', e);
      Alert.alert('Fehler', 'Beim Veröffentlichen ist ein Fehler aufgetreten.');
    } finally {
      setTimeout(() => {
        setIsPublishing(false);
        setPublishStatusText(null);
      }, 1500);
    }
  };

  // Callback: Nutzer bricht manuelle Eingabe ab
  const handleCancelManualMeta = () => {
    setShowManualMetaModal(false);
    setIsPublishing(false);
    setPublishStatusText(null);
  };

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
                {draft.publishedAt ? formatDate(draft.publishedAt) : 'Datum setzen'}
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
              if (changeDebounceRef.current) {
                clearTimeout(changeDebounceRef.current);
              }
              // @ts-ignore
              changeDebounceRef.current = setTimeout(() => {
                setDraft(prev => {
                  if (prev.contentHtml === html) return prev;
                  lastContentRef.current = html;
                  scheduleAutoSave();
                  return { ...prev, contentHtml: html };
                });
              }, 40) as unknown as number;
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
                    <Text style={{ color: '#cc0000', fontSize: 12 }}>Bild entfernen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={{ marginTop: 0, alignItems: 'flex-end' }}>
            <TouchableOpacity onPress={handleSave}>
              <Text style={{ color: '#0a7ea4', fontWeight: '600' }}>Entwurf speichern</Text>
            </TouchableOpacity>
          </View>

          {/* Publish Button */}
          <View style={{ marginTop: 16, alignItems: 'flex-end' }}>
            <TouchableOpacity onPress={handlePublish}>
              <Text style={{ color: '#0a7ea4', fontWeight: '700' }}>Artikel veröffentlichen</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={{ color: '#999' }}>Bitte eine Website und ein Archiv auswählen.</Text>
      )}

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={draft.publishedAt ? new Date(draft.publishedAt) : tempDate ?? new Date()}
        onConfirm={handleConfirmDate}
        onCancel={handleCancelDate}
      />

      {/* Publishing Overlay / Status */}
      {isPublishing && (
        <View style={styles.publishOverlay}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={{ color: '#fff', marginTop: 8 }}>{publishStatusText ?? 'Bitte warten…'}</Text>
        </View>
      )}

      {/* Modal: manuelle Meta-Eingabe (wenn native KI nicht verfügbar) */}
      <Modal visible={showManualMetaModal} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>Meta-Felder bearbeiten</Text>

            <Text style={globalStyles.label}>Meta Title</Text>
            <TextInput
              style={globalStyles.input}
              value={manualMeta.metaTitle}
              onChangeText={metaTitle => setManualMeta(prev => ({ ...prev, metaTitle }))}
            />

            <Text style={globalStyles.label}>Meta Description (140–160 Zeichen empfohlen)</Text>
            <TextInput
              style={[globalStyles.input, { height: 90 }]}
              multiline
              value={manualMeta.metaDescription}
              onChangeText={metaDescription => setManualMeta(prev => ({ ...prev, metaDescription }))}
            />

            <Text style={globalStyles.label}>Teaser (250–400 Zeichen empfohlen)</Text>
            <TextInput
              style={[globalStyles.input, { height: 120 }]}
              multiline
              value={manualMeta.teaser}
              onChangeText={teaser => setManualMeta(prev => ({ ...prev, teaser }))}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <View style={{ marginRight: 8 }}>
                <Button title="Abbrechen" onPress={handleCancelManualMeta} />
              </View>
              <Button title="Veröffentlichen" onPress={handleConfirmManualMeta} />
            </View>
          </View>
        </View>
      </Modal>
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
  publishOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    marginHorizontal: 16,
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    maxHeight: '90%',
  },
});