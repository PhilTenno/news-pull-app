// app/(tabs)/two.tsx
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppDropdown } from '@/components/AppDropdown';
import { deleteDraft } from '@/storage/articleDraftStorage';
import {
  ArchiveConfig,
  loadWebsites,
  saveWebsites,
  WebsiteConfig,
} from '@/storage/settingsStorage';
import { globalStyles } from '@/styles/globalStyles';
import { settingsStyles } from '@/styles/settingsStyles';

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
      // basic validation by trying to construct URL
      // ensure protocol present before constructing
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
      // Keep selection on edited website
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
        // Delete drafts for all archives of this website
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

      // adjust selection
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
      // delete drafts for this archive
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
    <View style={settingsStyles.archiveItem}>
      <View style={{ flex: 1 }}>
        <Text style={settingsStyles.archiveName}>{item.name}</Text>
        <Text style={settingsStyles.archiveDetailMasked}>Token: ••••••••••</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          style={settingsStyles.removeButton}
          onPress={() => openEditArchiveModal(item)}
        >
          <Text style={settingsStyles.removeButtonText}>Bearbeiten</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={settingsStyles.removeButton}
          onPress={() => confirmDeleteArchive(item.id)}
        >
          <Text style={settingsStyles.removeButtonText}>Löschen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[globalStyles.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Lade Einstellungen…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={globalStyles.screenContainer}
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header / Website selector */}
      <Text style={globalStyles.sectionTitle}>Einstellungen</Text>

      {websites.length === 0 ? (
        <Text style={settingsStyles.emptyText}>Noch keine Webseiten angelegt.</Text>
      ) : (
        <AppDropdown
          label="Webseite auswählen"
          placeholder="Webseite wählen..."
          items={websites.map((w) => ({ id: w.id, label: w.name }))}
          selectedId={selectedWebsiteId}
          onSelectId={setSelectedWebsiteId}
        />
      )}

      <View style={settingsStyles.buttonRow}>
        <Button title="Neue Webseite" onPress={openAddWebsiteModal} />
        {selectedWebsite && (
          <>
            <Button title="Bearbeiten" onPress={() => openEditWebsiteModal(selectedWebsite)} />
            <Button
              title="Löschen"
              color="#e74c3c"
              onPress={() => confirmDeleteWebsite(selectedWebsite)}
            />
          </>
        )}
      </View>

      {selectedWebsite && (
        <>
          <Text style={globalStyles.sectionTitle}>News-Archive</Text>

          {selectedWebsite.archives.length === 0 ? (
            <Text style={settingsStyles.emptyText}>Noch keine Archive für diese Webseite angelegt.</Text>
          ) : (
            <FlatList
              data={selectedWebsite.archives}
              keyExtractor={(a) => a.id}
              renderItem={renderArchiveItem}
              scrollEnabled={false}
            />
          )}

          <View style={[settingsStyles.buttonRow, { marginTop: 12 }]}>
            <Button title="Neues Archiv" onPress={openAddArchiveModal} />
          </View>
        </>
      )}

      {/* Website Modal */}
      <Modal visible={showWebsiteModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>
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

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <View style={{ marginRight: 8 }}>
                <Button title="Abbrechen" onPress={() => setShowWebsiteModal(false)} />
              </View>
              <Button title={websiteModalMode === 'add' ? 'Anlegen' : 'Speichern'} onPress={handleSaveWebsite} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Archive Modal */}
      <Modal visible={showArchiveModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={{ fontWeight: '700', marginBottom: 8 }}>
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

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <View style={{ marginRight: 8 }}>
                <Button title="Abbrechen" onPress={() => setShowArchiveModal(false)} />
              </View>
              <Button title={archiveModalMode === 'add' ? 'Anlegen' : 'Speichern'} onPress={handleSaveArchive} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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