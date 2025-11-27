// app/(tabs)/one.tsx
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { AppDropdown } from '@/components/AppDropdown';
import { globalStyles } from '@/styles/globalStyles';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import LexicalDomEditor from '../../components/dom/LexicalDomEditor';
import Button from '../../components/ui/Button';
import { SmallButton } from '../../components/ui/smallButton';
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
import { oneStyles } from '../../styles/one.styles';

import i18n from '@/utils/i18n';
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

  const editorContentFlatten = StyleSheet.flatten(oneStyles.editorContent) || {};

  const [draftDirty, setDraftDirty] = useState(false);
  const autoSaveTimeoutRef = useRef<number | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatusText, setPublishStatusText] = useState<string | null>(null);

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

  const lastContentRef = useRef<string>(draft.contentHtml ?? '');
  const lastSavedKeyRef = useRef<string>('');

  const computeDraftKey = (d: ArticleDraft) => {
    return [
      d.title ?? '',
      d.contentHtml ?? '',
      d.keywords ?? '',
      d.image?.uri ?? '',
      d.publishedAt ?? '',
    ].join('|||');
  };

  useEffect(() => {
    lastContentRef.current = draft.contentHtml ?? '';
  }, [draft.contentHtml]);

  // Reload websites on focus
  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        setLoading(true);
        try {
          const storedWebsites = await loadWebsites();
          setWebsites(storedWebsites);

          const firstWebsite = storedWebsites[0] ?? null;
          const firstWebsiteId = firstWebsite?.id ?? null;
          const firstArchiveId = firstWebsite?.archives[0]?.id ?? null;

          setSelectedWebsiteId(firstWebsiteId);
          setSelectedArchiveId(firstArchiveId);
        } catch (err) {
          console.error(i18n.t('errorLoadWebsites'), err);
        } finally {
          setLoading(false);
        }
      };

      void loadSettings();
    }, [])
  );

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

      lastSavedKeyRef.current = computeDraftKey({
        ...toSet,
        keywords: toSet.keywords ?? '',
        image: toSet.image ?? null,
      });
    };

    void loadCurrentDraft();
  }, [selectedWebsiteId, selectedArchiveId]);

  const handleChangeDraftTitle = (title: string) => {
    setDraft(prev => {
      if (prev.title === title) return prev;
      return { ...prev, title };
    });
    scheduleAutoSave();
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const openDatePicker = () => {
    setTempDate(draft.publishedAt ? new Date(draft.publishedAt) : new Date());
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setTempDate(draft.publishedAt ? new Date(draft.publishedAt) : new Date());
    setShowTimePicker(true);
  };

  const handleConfirmDate = async (selectedDate: Date) => {
    const existing = draft.publishedAt ? new Date(draft.publishedAt) : new Date();
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      existing.getHours(),
      existing.getMinutes(),
      existing.getSeconds(),
      0
    );
    const iso = newDate.toISOString();

    const nextDraft = { ...draft, publishedAt: iso };
    setDraft(nextDraft);
    setShowDatePicker(false);

    if (hasDraftContent(nextDraft)) {
      await saveCurrentDraft(nextDraft);
    }
  };

  const handleConfirmTime = async (selectedTime: Date) => {
    const existing = draft.publishedAt ? new Date(draft.publishedAt) : new Date();
    const newDate = new Date(
      existing.getFullYear(),
      existing.getMonth(),
      existing.getDate(),
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0
    );
    const iso = newDate.toISOString();

    const nextDraft = { ...draft, publishedAt: iso };
    setDraft(nextDraft);
    setShowTimePicker(false);

    if (hasDraftContent(nextDraft)) {
      await saveCurrentDraft(nextDraft);
    }
  };

  const handleCancelDate = () => setShowDatePicker(false);
  const handleCancelTime = () => setShowTimePicker(false);

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
      console.log(i18n.t('draftSaved'));
      setDraftDirty(false);
      lastSavedKeyRef.current = computeDraftKey(d);
    } catch (e) {
      console.error(i18n.t('errorSavingDraft'), e);
    }
  };

  const scheduleAutoSave = () => {
    if (!hasDraftContent(draft)) {
      return;
    }

    const currentKey = computeDraftKey(draft);
    if (currentKey === lastSavedKeyRef.current) {
      setDraftDirty(false);
      return;
    }

    setDraftDirty(true);

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // @ts-ignore
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
        [{ resize: { width: 2500 } }],
        {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return manipulated.uri;
    } catch (e) {
      console.warn(i18n.t('imageProcessingFailed'), e);
      return uri;
    }
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        i18n.t('accessRequired'),
        i18n.t('allowPhotoAccess')
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const asset = result.assets[0];
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

  const pickImageFromCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          i18n.t('cameraAccessRequired'),
          i18n.t('allowCameraAccess')
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
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
          i18n.t('cameraNotAvailable'),
          i18n.t('cameraNotAvailableSimulator')
        );
      } else {
        console.error(err);
        Alert.alert(i18n.t('error'), i18n.t('cameraError'));
      }
    }
  };

  const handlePhotoButtonPress = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: draft.image ? i18n.t('replacePhoto') : i18n.t('addPhoto'),
        options: [i18n.t('takePhoto'), i18n.t('chooseFromGallery'), i18n.t('cancel')],
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

  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId) ?? null;
  const archives: ArchiveConfig[] = selectedWebsite?.archives ?? [];
  const selectedArchive = archives.find(a => a.id === selectedArchiveId) ?? null;

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

  const handlePublish = async () => {
    if (!draft.title || draft.title.trim().length === 0) {
      Alert.alert(i18n.t('error'), i18n.t('enterTitle'));
      return;
    }
    if (!draft.contentHtml || draft.contentHtml.trim().length === 0) {
      Alert.alert(i18n.t('error'), i18n.t('addArticleContent'));
      return;
    }
    if (!selectedWebsite || !selectedArchive) {
      Alert.alert(i18n.t('error'), i18n.t('selectWebsiteAndArchive'));
      return;
    }

    if (hasDraftContent(draft)) {
      await saveCurrentDraft();
    }

    try {
      setIsPublishing(true);
      setPublishStatusText(i18n.t('preparingArticle'));

      const sanitizedHtml = sanitizeHtmlForUpload(draft.contentHtml ?? '');
      const plain = htmlToPlainText(sanitizedHtml);

      const nativeAvailable = await LocalAISummarizer.isAvailable();

      let meta: GeneratedMeta;
      if (nativeAvailable) {
        setPublishStatusText(i18n.t('generatingMetadata'));
        meta = await LocalAISummarizer.generate(draft.title, plain);
      } else {
        setPublishStatusText(i18n.t('preparingManualMetadata'));
        const generated = await LocalAISummarizer.generate(draft.title, plain);
        setManualMeta(generated);
        setShowManualMetaModal(true);
        return;
      }

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

      setPublishStatusText(i18n.t('sendingArticle'));

      const endpoint = `${selectedWebsite.baseUrl.replace(/\/$/, '')}/newspullimport`;
      const token = selectedArchive.apiToken ?? '';

      const result = await uploadToContao(payloadItem, draft.image?.uri ?? null, token, endpoint);

      if (result.ok) {
        setPublishStatusText(i18n.t('articleTransmitted'));

        try {
          if (selectedWebsiteId && selectedArchiveId) {
            await deleteDraft(selectedWebsiteId, selectedArchiveId);
            console.log(i18n.t('localDraftDeleted'));
          }
        } catch (err) {
          console.warn(i18n.t('errorDeletingDraft'), err);
        }

        setDraft(emptyDraft);
        setDraftDirty(false);
        lastSavedKeyRef.current = computeDraftKey(emptyDraft);

        Alert.alert(i18n.t('success'), i18n.t('articlePublishedAndDeleted'));
      } else {
        console.warn('Upload failed', result.status, result.body);
        setPublishStatusText(`${i18n.t('sendError')} (${result.status})`);
        Alert.alert(i18n.t('error'), i18n.t('uploadFailed') + String(result.body));
      }
    } catch (e) {
      console.error(i18n.t('publishError'), e);
      Alert.alert(i18n.t('error'), i18n.t('publishErrorOccurred'));
    } finally {
      setTimeout(() => {
        setIsPublishing(false);
        setPublishStatusText(null);
      }, 1500);
    }
  };

  const handleConfirmManualMeta = async () => {
    setShowManualMetaModal(false);

    try {
      setIsPublishing(true);
      setPublishStatusText(i18n.t('sendingArticle'));
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
        setPublishStatusText(i18n.t('articleTransmitted'));

        try {
          if (selectedWebsiteId && selectedArchiveId) {
            await deleteDraft(selectedWebsiteId, selectedArchiveId);
            console.log(i18n.t('localDraftDeletedManual'));
          }
        } catch (err) {
          console.warn(i18n.t('errorDeletingDraft'), err);
        }

        setDraft(emptyDraft);
        setDraftDirty(false);
        lastSavedKeyRef.current = computeDraftKey(emptyDraft);

        Alert.alert(i18n.t('success'), i18n.t('articlePublishedAndDeleted'));
      } else {
        setPublishStatusText(`${i18n.t('sendError')} (${result.status})`);
        Alert.alert(i18n.t('error'), i18n.t('uploadFailedCheckResponse'));
      }
    } catch (e) {
      console.error(i18n.t('publishManualError'), e);
      Alert.alert(i18n.t('error'), i18n.t('publishErrorOccurred'));
    } finally {
      setTimeout(() => {
        setIsPublishing(false);
        setPublishStatusText(null);
      }, 1500);
    }
  };

  const handleCancelManualMeta = () => {
    setShowManualMetaModal(false);
    setIsPublishing(false);
    setPublishStatusText(null);
  };

  if (loading) {
    return (
      <View style={[globalStyles.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
      </View>
    );
  }
  
  return (
    <ScrollView
      style={globalStyles.screenContainer}
      contentContainerStyle={globalStyles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {websites.length === 0 ? (
        <Text style={globalStyles.noContentTextColor}>
          <Text style={{ fontWeight: 'bold' }}>
            {i18n.t('noWebsitesConfigured')}
          </Text>
        </Text>
      ) : (
        <>
          <View style={globalStyles.row}>
            <View style={globalStyles.column}>
              <AppDropdown
                label={i18n.t('website')}
                placeholder={i18n.t('chooseWebsite')}
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
            <View style={[globalStyles.column, { marginLeft: 8 }]}>
              <AppDropdown
                label={i18n.t('archive')}
                placeholder={i18n.t('chooseArchive')}
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
              {i18n.t('noArchivesForWebsite')}
            </Text>
          )}
        </>
      )}

      {selectedWebsite && selectedArchive ? (
        <>
          <Text style={globalStyles.label}>{i18n.t('title')}</Text>
          <TextInput
            style={globalStyles.input}
            placeholder={i18n.t('articleTitle')}
            placeholderTextColor='rgba(255,255,255,0.4)'
            value={draft.title}
            onChangeText={handleChangeDraftTitle}
          />

          <View style={[globalStyles.rowBetween, { marginTop: 20, flexDirection: 'row', alignItems: 'stretch' }]}>
            <Text style={globalStyles.label}>{i18n.t('article')}</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[globalStyles.labelSmall]}>{i18n.t('publishOn')}</Text>
              <SmallButton
                iconName="calendar-outline"
                title={draft.publishedAt ? formatDate(draft.publishedAt) : ''}
                onPress={openDatePicker}
              />

              <SmallButton
                iconName="time-outline"
                title={draft.publishedAt ? formatTime(draft.publishedAt) : ''}
                onPress={openTimePicker}
              />
            </View>
          </View>

          <View style={oneStyles.editorWrapper}>
            <LexicalDomEditor
              value={draft.contentHtml}
              onChange={html => {
                setDraft(prev => {
                  if (prev.contentHtml === html) return prev;
                  lastContentRef.current = html;
                  scheduleAutoSave();
                  return { ...prev, contentHtml: html };
                });
              }}
              dom={{ style: { ...editorContentFlatten, height: 250 } }}
            />
          </View>
          <View style={oneStyles.keywordsContainer}>
            <Text style={globalStyles.label}>{i18n.t('articleKeywords')}</Text>
            <TextInput
              style={globalStyles.input}
              placeholder={i18n.t('keywordsPlaceholder')}
              placeholderTextColor='rgba(255,255,255,0.4)'
              value={draft.keywords}
              onChangeText={keywords => {
                setDraft(prev => ({ ...prev, keywords }));
                scheduleAutoSave();
              }}
            />
          </View>

          {/* Bild-Bereich */}
          <View style={oneStyles.imageWrapper}>
            <View style={globalStyles.rowEnd}>
              <SmallButton
                iconName="camera-outline"
                title={draft.image ? i18n.t('replacePhoto') : i18n.t('photo')}
                onPress={handlePhotoButtonPress}
              />
            </View>

            {draft.image && (
              <View style={oneStyles.imagePreview}>
                <Image
                  source={{ uri: draft.image.uri }}
                  style={oneStyles.imageStyle}
                  resizeMode="cover"
                />
                <TextInput
                  style={[globalStyles.input, oneStyles.imageAltInput]}
                  placeholder={i18n.t('imageDescription')}
                  placeholderTextColor='rgba(255,255,255,0.4)'
                  value={draft.image.alt}
                  onChangeText={alt => {
                    setDraft(prev => ({
                      ...prev,
                      image: prev.image ? { ...prev.image, alt } : prev.image,
                    }));
                    scheduleAutoSave();
                  }}
                />
                <View style={oneStyles.imageRemoveRow}>
                  <SmallButton
                    iconName="trash-outline"
                    title={i18n.t('removeImage')}
                    onPress={() => {
                      setDraft(prev => ({ ...prev, image: null }));
                      scheduleAutoSave();
                    }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Publish Button */}
          <View style={oneStyles.publishRow}>
            <Button className="btn btnPublish" onPress={handlePublish}>
              {i18n.t('publish')}
            </Button>
          </View>
        </>
      ) : (
        <Text style={{ color: '#999' }}>{i18n.t('selectWebsiteAndArchive')}</Text>
      )}

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={draft.publishedAt ? new Date(draft.publishedAt) : tempDate ?? new Date()}
        onConfirm={handleConfirmDate}
        onCancel={handleCancelDate}
      />

      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        date={draft.publishedAt ? new Date(draft.publishedAt) : tempDate ?? new Date()}
        onConfirm={handleConfirmTime}
        onCancel={handleCancelTime}
      />

      {isPublishing && (
        <View style={oneStyles.publishOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 8 }}>{publishStatusText ?? i18n.t('pleaseWait')}</Text>
        </View>
      )}

      {/* Modal: manuelle Meta-Eingabe */}
      <Modal visible={showManualMetaModal} animationType="slide" transparent={true}>
        <View style={globalStyles.modalBackdrop}>
          <View style={globalStyles.modalContainer}>
            <Text style={{ fontWeight: '700', marginBottom: 8, color: '#efefef' }}>
              {i18n.t('editMetaFields')}
            </Text>

            <Text style={globalStyles.label}>{i18n.t('metaTitle')}</Text>
            <TextInput
              style={globalStyles.input}
              value={manualMeta.metaTitle}
              onChangeText={metaTitle => setManualMeta(prev => ({ ...prev, metaTitle }))}
            />

            <Text style={globalStyles.label}>{i18n.t('metaDescription')}</Text>
            <TextInput
              style={[globalStyles.input, { height: 90 }]}
              multiline
              value={manualMeta.metaDescription}
              onChangeText={metaDescription => setManualMeta(prev => ({ ...prev, metaDescription }))}
            />

            <Text style={globalStyles.label}>{i18n.t('teaser')}</Text>
            <TextInput
              style={[globalStyles.input, { height: 120 }]}
              multiline
              value={manualMeta.teaser}
              onChangeText={teaser => setManualMeta(prev => ({ ...prev, teaser }))}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <View style={{ marginRight: 8 }}>
                <Button className="btn btnCancel" onPress={handleCancelManualMeta}>
                  {i18n.t('cancel')}
                </Button>
              </View>
              <Button className="btn btnPublish" onPress={handleConfirmManualMeta}>
                {i18n.t('publish')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}