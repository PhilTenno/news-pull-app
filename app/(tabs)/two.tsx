// app/(tabs)/two.tsx
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  ArchiveConfig,
  loadWebsites,
  saveWebsites,
  WebsiteConfig,
} from '@/storage/settingsStorage';
import { globalStyles } from '@/styles/globalStyles';
import { theme } from '@/styles/theme';
import { twoStyles } from '@/styles/two.styles';
import i18n from '@/utils/i18n';
import { AppDropdown } from '../../components/AppDropdown';
import Button from '../../components/ui/Button';
import { deleteDraft } from '../../storage/articleDraftStorage';

type WebsiteModalMode = 'add' | 'edit';
type ArchiveModalMode = 'add' | 'edit';

export default function SettingsScreen() {
  const [websites, setWebsites] = useState<WebsiteConfig[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Website modal
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [websiteModalMode, setWebsiteModalMode] = useState<WebsiteModalMode>('add');
  const [websiteModalName, setWebsiteModalName] = useState('');
  const [websiteModalBaseUrl, setWebsiteModalBaseUrl] = useState('');
  const [editingWebsiteId, setEditingWebsiteId] = useState<string | null>(null);

  // Archive modal
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveModalMode, setArchiveModalMode] = useState<ArchiveModalMode>('add');
  const [archiveModalName, setArchiveModalName] = useState('');
  const [archiveModalToken, setArchiveModalToken] = useState('');
  const [editingArchiveId, setEditingArchiveId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const stored = await loadWebsites();
      setWebsites(stored);
      setSelectedWebsiteId(stored[0]?.id ?? null);
      setLoading(false);
    };
    void load();
  }, []);

  const persistWebsites = async (updated: WebsiteConfig[]) => {
    setWebsites(updated);
    await saveWebsites(updated);
  };

  const selectedWebsite =
    websites.find((w) => w.id === selectedWebsiteId) ?? null;

  // Helpers
  const ensureHttps = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const isValidUrl = (url: string) => {
    try {
      const withProto = ensureHttps(url);
      // eslint-disable-next-line no-new
      new URL(withProto);
      return true;
    } catch {
      return false;
    }
  };

  // === Website actions ===
  const openAddWebsiteModal = () => {
    setWebsiteModalMode('add');
    setEditingWebsiteId(null);
    setWebsiteModalName('');
    setWebsiteModalBaseUrl('');
    setShowWebsiteModal(true);
  };

  const openEditWebsiteModal = (website: WebsiteConfig) => {
    setWebsiteModalMode('edit');
    setEditingWebsiteId(website.id);
    setWebsiteModalName(website.name);
    setWebsiteModalBaseUrl(website.baseUrl);
    setShowWebsiteModal(true);
  };

  const handleSaveWebsite = async () => {
    const name = websiteModalName.trim();
    const baseUrlInput = websiteModalBaseUrl.trim();

    if (!name) {
      Alert.alert(i18n.t('error'), i18n.t('enterWebsiteName'));
      return;
    }
    if (!baseUrlInput) {
      Alert.alert(i18n.t('error'), i18n.t('enterBaseUrl'));
      return;
    }

    if (!isValidUrl(baseUrlInput)) {
      Alert.alert(i18n.t('error'), i18n.t('invalidBaseUrl'));
      return;
    }

    const baseUrl = ensureHttps(baseUrlInput);

    if (websiteModalMode === 'add') {
      const newWebsite: WebsiteConfig = {
        id: Date.now().toString(),
        name,
        baseUrl,
        archives: [],
      };
      const updated = [...websites, newWebsite];
      await persistWebsites(updated);
      setSelectedWebsiteId(newWebsite.id);
    } else if (websiteModalMode === 'edit' && editingWebsiteId) {
      const updated = websites.map((w) =>
        w.id === editingWebsiteId ? { ...w, name, baseUrl } : w
      );
      await persistWebsites(updated);
      setSelectedWebsiteId(editingWebsiteId);
    }

    setShowWebsiteModal(false);
  };

  const confirmDeleteWebsite = (website: WebsiteConfig) => {
    Alert.alert(
      i18n.t('deleteWebsiteConfirmTitle'),
      i18n.t('deleteWebsiteConfirmMessage', { name: website.name }),
      [
        { text: i18n.t('cancel'), style: 'cancel' },
        {
          text: i18n.t('delete'),
          style: 'destructive',
          onPress: () => void handleDeleteWebsite(website.id),
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteWebsite = async (websiteId: string) => {
    try {
      const toDelete = websites.find((w) => w.id === websiteId);
      if (toDelete) {
        for (const archive of toDelete.archives) {
          try {
            await deleteDraft(websiteId, archive.id);
          } catch (err) {
            console.warn(i18n.t('deleteDraftError'), err);
          }
        }
      }

      const updated = websites.filter((w) => w.id !== websiteId);
      await persistWebsites(updated);

      if (selectedWebsiteId === websiteId) {
        setSelectedWebsiteId(updated[0]?.id ?? null);
      }
    } catch (err) {
      console.error(i18n.t('deleteWebsiteError'), err);
      Alert.alert(i18n.t('error'), i18n.t('deleteWebsiteError'));
    }
  };

  // === Archive actions ===
  const openAddArchiveModal = () => {
    if (!selectedWebsite) {
      Alert.alert(i18n.t('error'), i18n.t('selectWebsiteFirst'));
      return;
    }
    setArchiveModalMode('add');
    setEditingArchiveId(null);
    setArchiveModalName('');
    setArchiveModalToken('');
    setShowArchiveModal(true);
  };

  const openEditArchiveModal = (archive: ArchiveConfig) => {
    setArchiveModalMode('edit');
    setEditingArchiveId(archive.id);
    setArchiveModalName(archive.name);
    setArchiveModalToken(archive.apiToken ?? '');
    setShowArchiveModal(true);
  };

  const handleSaveArchive = async () => {
    const name = archiveModalName.trim();
    const token = archiveModalToken.trim();

    if (!selectedWebsite) {
      Alert.alert(i18n.t('error'), i18n.t('noWebsiteSelected'));
      return;
    }

    if (!name) {
      Alert.alert(i18n.t('error'), i18n.t('enterArchiveName'));
      return;
    }
    if (!token) {
      Alert.alert(i18n.t('error'), i18n.t('enterToken'));
      return;
    }

    if (archiveModalMode === 'add') {
      const newArchive: ArchiveConfig = {
        id: Date.now().toString(),
        name,
        apiToken: token,
      };

      const updated = websites.map((w) =>
        w.id === selectedWebsite.id ? { ...w, archives: [...w.archives, newArchive] } : w
      );
      await persistWebsites(updated);
    } else if (archiveModalMode === 'edit' && editingArchiveId) {
      const updated = websites.map((w) =>
        w.id === selectedWebsite.id
          ? {
              ...w,
              archives: w.archives.map((a) =>
                a.id === editingArchiveId ? { ...a, name, apiToken: token } : a
              ),
            }
          : w
      );
      await persistWebsites(updated);
    }

    setShowArchiveModal(false);
  };

  const confirmDeleteArchive = (archiveId: string) => {
    const archive = selectedWebsite?.archives.find((a) => a.id === archiveId);
    Alert.alert(
      i18n.t('deleteArchiveConfirmTitle'),
      i18n.t('deleteArchiveConfirmMessage', { name: archive?.name ?? '' }),
      [
        { text: i18n.t('cancel'), style: 'cancel' },
        {
          text: i18n.t('delete'),
          style: 'destructive',
          onPress: () => void handleDeleteArchive(archiveId),
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteArchive = async (archiveId: string) => {
    if (!selectedWebsite) return;
    try {
      try {
        await deleteDraft(selectedWebsite.id, archiveId);
      } catch (err) {
        console.warn(i18n.t('deleteDraftError'), err);
      }

      const updated = websites.map((w) =>
        w.id === selectedWebsite.id ? { ...w, archives: w.archives.filter((a) => a.id !== archiveId) } : w
      );
      await persistWebsites(updated);
    } catch (err) {
      console.error(i18n.t('deleteArchiveError'), err);
      Alert.alert(i18n.t('error'), i18n.t('deleteArchiveError'));
    }
  };

  // Render archive item
  const renderArchiveItem = ({ item }: { item: ArchiveConfig }) => (
    <View style={twoStyles.archiveItem}>
      <View style={twoStyles.archiveMain}>
        <Text style={twoStyles.archiveName}>{item.name}</Text>
      </View>

      <View style={twoStyles.archiveActions}>
        <Button className="btn btnEdit" onPress={() => openEditArchiveModal(item)}>
          {i18n.t('edit')}
        </Button>
        <View style={{ width: theme.spacing.xs }} />
        <Button className="btn btnDelete" onPress={() => confirmDeleteArchive(item.id)}>
          {i18n.t('delete')}
        </Button>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[globalStyles.screenContainer, globalStyles.centeredScreen]}>
        <Text>{i18n.t('loadingSettings')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={globalStyles.screenContainer}
      contentContainerStyle={globalStyles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header / Website selector */}
      <Text style={globalStyles.sectionTitle}>{i18n.t('settings')}</Text>

      {websites.length === 0 ? (
        <Text style={globalStyles.emptyText}>{i18n.t('noWebsites')}</Text>
      ) : (
        <AppDropdown
          label={i18n.t('selectWebsite')}
          placeholder={i18n.t('chooseWebsite')}
          items={websites.map((w) => ({ id: w.id, label: w.name }))}
          selectedId={selectedWebsiteId}
          onSelectId={setSelectedWebsiteId}
        />
      )}

      <View style={globalStyles.buttonRow}>
        <Button className="btn btnAdd" onPress={openAddWebsiteModal}>
          {i18n.t('newWebsite')}
        </Button>
        {selectedWebsite && (
          <>
            <View style={{ marginLeft: 12 }}>
              <Button className="btn btnEdit" onPress={() => openEditWebsiteModal(selectedWebsite)}>
                {i18n.t('edit')}
              </Button>
            </View>
            <View style={{ marginLeft: 12 }}>
              <Button className="btn btnDelete" onPress={() => confirmDeleteWebsite(selectedWebsite)}>
                {i18n.t('delete')}
              </Button>
            </View>
          </>
        )}
      </View>

      {selectedWebsite && (
        <>
          <Text style={[globalStyles.sectionTitle, globalStyles.section]}>{i18n.t('newsArchives')}</Text>

          {selectedWebsite.archives.length === 0 ? (
            <Text style={globalStyles.emptyText}>{i18n.t('noArchives')}</Text>
          ) : (
            <FlatList
              data={selectedWebsite.archives}
              keyExtractor={(a) => a.id}
              renderItem={renderArchiveItem}
              scrollEnabled={false}
            />
          )}

          <View style={[globalStyles.buttonRow, { marginTop: 12 }]}>
            <Button className="btn btnAdd" onPress={openAddArchiveModal}>
              {i18n.t('newArchive')}
            </Button>
          </View>
        </>
      )}

      {/* Website Modal */}
      <Modal visible={showWebsiteModal} animationType="slide" transparent>
        <View style={globalStyles.modalBackdrop}>
          <View style={globalStyles.modalContainer}>
            <Text style={globalStyles.modalTitle}>
              {websiteModalMode === 'add' ? i18n.t('addWebsite') : i18n.t('editWebsite')}
            </Text>

            <Text style={globalStyles.modalLabel}>{i18n.t('websiteName')}</Text>
            <TextInput
              style={globalStyles.modalInput}
              placeholder={i18n.t('websiteNamePlaceholder')}
              placeholderTextColor='rgba(255,255,255,0.4)'
              value={websiteModalName}
              onChangeText={setWebsiteModalName}
              autoCapitalize="none"
            />

            <Text style={globalStyles.modalLabel}>{i18n.t('baseUrl')}</Text>
            <TextInput
              style={globalStyles.modalInput}
              placeholder={i18n.t('baseUrlPlaceholder')}
              placeholderTextColor='rgba(255,255,255,0.4)'
              value={websiteModalBaseUrl}
              onChangeText={setWebsiteModalBaseUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={globalStyles.modalButtonRow}>
              <View style={globalStyles.modalButtonRightGap}>
                <Button className="btn btnCancel" onPress={() => setShowWebsiteModal(false)}>
                  {i18n.t('cancel')}
                </Button>
              </View>
              <Button className="btn btnAdd" onPress={handleSaveWebsite}>
                {websiteModalMode === 'add' ? i18n.t('create') : i18n.t('save')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Archive Modal */}
      <Modal visible={showArchiveModal} animationType="slide" transparent>
        <View style={globalStyles.modalBackdrop}>
          <View style={globalStyles.modalContainer}>
            <Text style={globalStyles.modalTitle}>
              {archiveModalMode === 'add' ? i18n.t('addArchive') : i18n.t('editArchive')}
            </Text>

            <Text style={globalStyles.label}>{i18n.t('archiveName')}</Text>
            <TextInput
              style={globalStyles.input}
              placeholder={i18n.t('archiveNamePlaceholder')}
              placeholderTextColor='rgba(255,255,255,0.4)'
              value={archiveModalName}
              onChangeText={setArchiveModalName}
              autoCapitalize="none"
            />

            <Text style={globalStyles.label}>{i18n.t('archiveToken')}</Text>
            <TextInput
              style={globalStyles.input}
              placeholder={i18n.t('archiveTokenPlaceholder')}
              placeholderTextColor='rgba(255,255,255,0.4)'
              value={archiveModalToken}
              onChangeText={setArchiveModalToken}
              autoCapitalize="none"
              secureTextEntry
            />

            <View style={globalStyles.modalButtonRow}>
              <View style={globalStyles.modalButtonRightGap}>
                <Button className="btn btnCancel" onPress={() => setShowArchiveModal(false)}>
                  {i18n.t('cancel')}
                </Button>
              </View>
              <Button className="btn btnAdd" onPress={handleSaveArchive}>
                {archiveModalMode === 'add' ? i18n.t('create') : i18n.t('save')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}