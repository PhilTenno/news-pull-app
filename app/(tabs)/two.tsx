import { AppDropdown } from '@/components/AppDropdown';
import {
  ArchiveConfig,
  loadWebsites,
  saveWebsites,
  WebsiteConfig,
} from '@/storage/settingsStorage';
import { globalStyles } from '@/styles/globalStyles';
import { settingsStyles } from '@/styles/settingsStyles';
import { useEffect, useState } from 'react';
import {
  Button,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const [websites, setWebsites] = useState<WebsiteConfig[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);

  // Formular für "Neue Website"
  const [newWebsiteName, setNewWebsiteName] = useState('');
  const [newWebsiteBaseUrl, setNewWebsiteBaseUrl] = useState('');

  // Formular für "Neues Archiv" (für aktuell ausgewählte Website)
  const [archiveName, setArchiveName] = useState('');
  const [archiveToken, setArchiveToken] = useState('');

  // Beim Start Websites laden
  useEffect(() => {
    const load = async () => {
      const storedWebsites = await loadWebsites();
      setWebsites(storedWebsites);
      setSelectedWebsiteId(storedWebsites[0]?.id ?? null);
    };
    load();
  }, []);

  const persistWebsites = async (updated: WebsiteConfig[]) => {
    setWebsites(updated);
    await saveWebsites(updated);
  };

  const selectedWebsite =
    websites.find((w) => w.id === selectedWebsiteId) ?? null;

  const handleAddWebsite = async () => {
    if (!newWebsiteName.trim() || !newWebsiteBaseUrl.trim()) {
      return;
    }

    const newWebsite: WebsiteConfig = {
      id: Date.now().toString(),
      name: newWebsiteName.trim(),
      baseUrl: newWebsiteBaseUrl.trim(),
      archives: [],
    };

    const updated = [...websites, newWebsite];
    await persistWebsites(updated);

    setNewWebsiteName('');
    setNewWebsiteBaseUrl('');
    setSelectedWebsiteId(newWebsite.id);
  };

  const handleUpdateWebsiteBaseUrl = async (value: string) => {
    if (!selectedWebsite) return;
    const updated = websites.map((w) =>
      w.id === selectedWebsite.id ? { ...w, baseUrl: value } : w,
    );
    await persistWebsites(updated);
  };

  const handleUpdateWebsiteName = async (value: string) => {
    if (!selectedWebsite) return;
    const updated = websites.map((w) =>
      w.id === selectedWebsite.id ? { ...w, name: value } : w,
    );
    await persistWebsites(updated);
  };

  const handleRemoveWebsite = async (id: string) => {
    const updated = websites.filter((w) => w.id !== id);
    await persistWebsites(updated);

    if (selectedWebsiteId === id) {
      setSelectedWebsiteId(updated[0]?.id ?? null);
    }
  };

  const handleAddArchive = async () => {
    if (!selectedWebsite) return;
    if (!archiveName.trim() || !archiveToken.trim()) {
      return;
    }

    const newArchive: ArchiveConfig = {
      id: Date.now().toString(),
      name: archiveName.trim(),
      apiToken: archiveToken.trim(),
    };

    const updated = websites.map((w) =>
      w.id === selectedWebsite.id
        ? { ...w, archives: [...w.archives, newArchive] }
        : w,
    );

    await persistWebsites(updated);
    setArchiveName('');
    setArchiveToken('');
  };

  const handleRemoveArchive = async (archiveId: string) => {
    if (!selectedWebsite) return;

    const updated = websites.map((w) =>
      w.id === selectedWebsite.id
        ? {
            ...w,
            archives: w.archives.filter((a) => a.id !== archiveId),
          }
        : w,
    );

    await persistWebsites(updated);
  };

  return (
    <ScrollView
      style={globalStyles.screenContainer}
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
    >

      {/* Website-Auswahl */}
      {websites.length === 0 ? (
        <>
          <Text style={globalStyles.sectionTitle}>Webseite auswählen</Text>
          <Text style={settingsStyles.emptyText}>
            Noch keine Webseiten angelegt.
          </Text>
        </>
      ) : (
        <AppDropdown
          label="Webseite auswählen"
          placeholder="Webseite wählen..."
          items={websites.map((w) => ({ id: w.id, label: w.name }))}
          selectedId={selectedWebsiteId}
          onSelectId={setSelectedWebsiteId}
        />
      )}

      {/* Details zur ausgewählten Website */}
      {selectedWebsite && (
        <>
          <Text style={globalStyles.sectionTitle}>Ausgewählte Webseite</Text>

          <Text style={globalStyles.label}>Name der Webseite</Text>
          <TextInput
            style={globalStyles.input}
            value={selectedWebsite.name}
            onChangeText={handleUpdateWebsiteName}
            placeholder="z.B. Hauptseite, Blog, Mandantenportal"
          />

          <Text style={globalStyles.label}>Basis-URL</Text>
          <TextInput
            style={globalStyles.input}
            value={selectedWebsite.baseUrl}
            onChangeText={handleUpdateWebsiteBaseUrl}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://meine-domain.de"
          />

          <View style={settingsStyles.buttonRow}>
            <Button
              title="Diese Webseite löschen"
              color="#e74c3c"
              onPress={() => handleRemoveWebsite(selectedWebsite.id)}
            />
          </View>

          {/* Archive für diese Website */}
          <Text style={globalStyles.sectionTitle}>News-Archive</Text>
          {selectedWebsite.archives.length === 0 ? (
            <Text style={settingsStyles.emptyText}>
              Noch keine Archive für diese Webseite angelegt.
            </Text>
          ) : (
            <FlatList
              data={selectedWebsite.archives}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={settingsStyles.archiveItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={settingsStyles.archiveName}>{item.name}</Text>
                    <Text style={settingsStyles.archiveDetailMasked}>
                      Token: ••••••••••
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={settingsStyles.removeButton}
                    onPress={() => handleRemoveArchive(item.id)}
                  >
                    <Text style={settingsStyles.removeButtonText}>Löschen</Text>
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
            />
          )}

          {/* Neues Archiv für diese Website */}
          <Text style={globalStyles.sectionTitle}>Neues Archiv anlegen</Text>

          <Text style={globalStyles.label}>Archiv-Name</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="z.B. Startseite, Magazin, Blog"
            value={archiveName}
            onChangeText={setArchiveName}
          />

          <Text style={globalStyles.label}>Archiv-Token</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Token eintragen"
            value={archiveToken}
            onChangeText={setArchiveToken}
            autoCapitalize="none"
            secureTextEntry
          />

          <View style={settingsStyles.buttonRow}>
            <Button title="Archiv hinzufügen" onPress={handleAddArchive} />
          </View>
        </>
      )}

      {/* Neue Website hinzufügen */}
      <Text style={globalStyles.sectionTitle}>Neue Webseite hinzufügen</Text>

      <Text style={globalStyles.label}>Webseiten-Name</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="z.B. MeinBlog, Firmenname"
        value={newWebsiteName}
        onChangeText={setNewWebsiteName}
      />

      <Text style={globalStyles.label}>Basis-URL</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="https://meine-domain.de"
        value={newWebsiteBaseUrl}
        onChangeText={setNewWebsiteBaseUrl}
        autoCapitalize="none"
        keyboardType="url"
      />

      <View style={settingsStyles.buttonRow}>
        <Button title="Webseite hinzufügen" onPress={handleAddWebsite} />
      </View>
    </ScrollView>
  );
}