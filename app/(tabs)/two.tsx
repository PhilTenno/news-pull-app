import { useState } from 'react';
import {
  Button,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { settingsStyles } from '../../styles/settingsStyles';

type ArchiveConfig = {
  id: string;
  name: string;
  apiToken: string;
};

export default function SettingsScreen() {
  const [baseUrl, setBaseUrl] = useState('');
  const [archives, setArchives] = useState<ArchiveConfig[]>([]);
  const [archiveName, setArchiveName] = useState('');
  const [archiveToken, setArchiveToken] = useState('');

  const resetArchiveForm = () => {
    setArchiveName('');
    setArchiveToken('');
  };

  const handleAddArchive = () => {
    if (!archiveName.trim() || !archiveToken.trim()) {
      return;
    }

    const newArchive: ArchiveConfig = {
      id: Date.now().toString(),
      name: archiveName.trim(),
      apiToken: archiveToken.trim(),
    };

    setArchives((prev) => [...prev, newArchive]);
    resetArchiveForm();
    // TODO: später per AsyncStorage persistieren
  };

  const handleRemoveArchive = (id: string) => {
    setArchives((prev) => prev.filter((a) => a.id !== id));
    // TODO: später per AsyncStorage persistieren
  };

  return (
    <View style={globalStyles.screenContainer}>
      <Text style={globalStyles.screenTitle}>Einstellungen</Text>

      {/* Basis-URL */}
      <Text style={globalStyles.sectionTitle}>Basis-URL</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="https://www.deineseite.de"
        value={baseUrl}
        onChangeText={setBaseUrl}
        autoCapitalize="none"
        keyboardType="url"
      />

      {/* Liste der Archive */}
      <Text style={globalStyles.sectionTitle}>News-Archive</Text>
      {archives.length === 0 ? (
        <Text style={settingsStyles.emptyText}>Noch keine Archive angelegt.</Text>
      ) : (
        <FlatList
          data={archives}
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
        />
      )}

      {/* Neues Archiv hinzufügen */}
      <Text style={globalStyles.sectionTitle}>Neues Archiv hinzufügen</Text>

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
    </View>
  );
}