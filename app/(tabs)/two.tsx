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
import { AppDropdown } from '../../components/AppDropdown';
import AppButton from '../../components/ui/AppButton';
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
      Alert.alert('Fehler', 'Bitte einen Namen für die Webseite eingeben.');
      return;
    }
    if (!baseUrlInput) {
      Alert.alert('Fehler', 'Bitte eine Basis-URL eingeben.');
      return;
    }

    if (!isValidUrl(baseUrlInput)) {
      Alert.alert('Fehler', 'Die Basis-URL ist ungültig.');
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
      'Sicher?',
      `Webseite "${website.name}" löschen? Alle zugehörigen Archive und lokalen Entwürfe werden entfernt.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
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
            console.warn('Fehler beim Löschen eines Drafts:', err);
          }
        }
      }

      const updated = websites.filter((w) => w.id !== websiteId);
      await persistWebsites(updated);

      if (selectedWebsiteId === websiteId) {
        setSelectedWebsiteId(updated[0]?.id ?? null);
      }
    } catch (err) {
      console.error('Fehler beim Löschen der Webseite:', err);
      Alert.alert('Fehler', 'Beim Löschen der Webseite ist ein Fehler aufgetreten.');
    }
  };

  // === Archive actions ===
  const openAddArchiveModal = () => {
    if (!selectedWebsite) {
      Alert.alert('Fehler', 'Bitte zuerst eine Webseite auswählen.');
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
      Alert.alert('Fehler', 'Keine Webseite ausgewählt.');
      return;
    }

    if (!name) {
      Alert.alert('Fehler', 'Bitte einen Namen für das Archiv eingeben.');
      return;
    }
    if (!token) {
      Alert.alert('Fehler', 'Bitte einen Token eingeben.');
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
      'Sicher?',
      `Archiv "${archive?.name ?? ''}" löschen? Alle zugehörigen lokalen Entwürfe werden entfernt.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
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
        console.warn('Fehler beim Löschen des Drafts:', err);
      }

      const updated = websites.map((w) =>
        w.id === selectedWebsite.id ? { ...w, archives: w.archives.filter((a) => a.id !== archiveId) } : w
      );
      await persistWebsites(updated);
    } catch (err) {
      console.error('Fehler beim Löschen des Archivs:', err);
      Alert.alert('Fehler', 'Beim Löschen des Archivs ist ein Fehler aufgetreten.');
    }
  };

  // Render archive item
  const renderArchiveItem = ({ item }: { item: ArchiveConfig }) => (
    <View style={twoStyles.archiveItem}>
      <View style={twoStyles.archiveMain}>
        <Text style={twoStyles.archiveName}>{item.name}</Text>
        <Text style={twoStyles.archiveDetailMasked}>Token: ••••••••••</Text>
      </View>

      <View style={twoStyles.archiveActions}>
        <AppButton title="Bearbeiten" variant="primary" onPress={() => openEditArchiveModal(item)} />
        <View style={{ width: theme.spacing.xs }} />
        <AppButton title="Löschen" variant="danger" onPress={() => confirmDeleteArchive(item.id)} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[globalStyles.screenContainer, globalStyles.centeredScreen]}>
        <Text>Lade Einstellungen…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={globalStyles.screenContainer}
      contentContainerStyle={twoStyles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header / Website selector */}
      <Text style={globalStyles.sectionTitle}>Einstellungen</Text>

      {websites.length === 0 ? (
        <Text style={twoStyles.emptyText}>Noch keine Webseiten angelegt.</Text>
      ) : (
        <AppDropdown
          label="Webseite auswählen"
          placeholder="Webseite wählen..."
          items={websites.map((w) => ({ id: w.id, label: w.name }))}
          selectedId={selectedWebsiteId}
          onSelectId={setSelectedWebsiteId}
        />
      )}

      <View style={twoStyles.buttonRow}>
        <AppButton title="Neue Webseite" variant="link" onPress={openAddWebsiteModal} style={twoStyles.topLinkButton} />
        {selectedWebsite && (
          <>
            <View style={{ marginLeft: 12 }}>
              <AppButton title="Bearbeiten" variant="primary" onPress={() => openEditWebsiteModal(selectedWebsite)} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <AppButton title="Löschen" variant="danger" onPress={() => confirmDeleteWebsite(selectedWebsite)} />
            </View>
          </>
        )}
      </View>

      {selectedWebsite && (
        <>
          <Text style={[globalStyles.sectionTitle,globalStyles.section]} >News-Archive</Text>

          {selectedWebsite.archives.length === 0 ? (
            <Text style={twoStyles.emptyText}>Noch keine Archive für diese Webseite angelegt.</Text>
          ) : (
            <FlatList
              data={selectedWebsite.archives}
              keyExtractor={(a) => a.id}
              renderItem={renderArchiveItem}
              scrollEnabled={false}
            />
          )}

          <View style={[twoStyles.buttonRow, { marginTop: 12 }]}>
            <AppButton title="Neues Archiv" variant="link" onPress={openAddArchiveModal} />
          </View>
        </>
      )}

      {/* Website Modal */}
      <Modal visible={showWebsiteModal} animationType="slide" transparent>
        <View style={twoStyles.modalBackdrop}>
          <View style={twoStyles.modalContainer}>
            <Text style={twoStyles.modalTitle}>
              {websiteModalMode === 'add' ? 'Neue Webseite hinzufügen' : 'Webseite bearbeiten'}
            </Text>

            <Text style={globalStyles.label}>Webseiten-Name</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="z.B. MeinBlog, Firmenname"
              value={websiteModalName}
              onChangeText={setWebsiteModalName}
              autoCapitalize="none"
            />

            <Text style={globalStyles.label}>Basis-URL</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="https://meine-domain.de"
              value={websiteModalBaseUrl}
              onChangeText={setWebsiteModalBaseUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={twoStyles.modalButtonRow}>
              <View style={twoStyles.modalButtonRightGap}>
                <AppButton title="Abbrechen" variant="link" onPress={() => setShowWebsiteModal(false)} />
              </View>
              <AppButton title={websiteModalMode === 'add' ? 'Anlegen' : 'Speichern'} variant="primary" onPress={handleSaveWebsite} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Archive Modal */}
      <Modal visible={showArchiveModal} animationType="slide" transparent>
        <View style={twoStyles.modalBackdrop}>
          <View style={twoStyles.modalContainer}>
            <Text style={twoStyles.modalTitle}>
              {archiveModalMode === 'add' ? 'Neues Archiv anlegen' : 'Archiv bearbeiten'}
            </Text>

            <Text style={globalStyles.label}>Archiv-Name</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="z.B. Startseite, Magazin, Blog"
              value={archiveModalName}
              onChangeText={setArchiveModalName}
              autoCapitalize="none"
            />

            <Text style={globalStyles.label}>Archiv-Token</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Token eintragen"
              value={archiveModalToken}
              onChangeText={setArchiveModalToken}
              autoCapitalize="none"
              secureTextEntry
            />

            <View style={twoStyles.modalButtonRow}>
              <View style={twoStyles.modalButtonRightGap}>
                <AppButton title="Abbrechen" variant="link" onPress={() => setShowArchiveModal(false)} />
              </View>
              <AppButton title={archiveModalMode === 'add' ? 'Anlegen' : 'Speichern'} variant="primary" onPress={handleSaveArchive} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}