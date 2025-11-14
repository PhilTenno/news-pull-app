// components/ArticleToolbar.tsx
import { AppDropdown } from '@/components/AppDropdown';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QuillEditor from 'react-native-cn-quill';

type HeadingOption = {
  id: string;
  label: string;
  value: number | 'paragraph';
};

const HEADING_OPTIONS: HeadingOption[] = [
  { id: 'p', label: 'Absatz', value: 'paragraph' },
  { id: 'h2', label: 'Überschrift 2', value: 2 },
  { id: 'h3', label: 'Überschrift 3', value: 3 },
  { id: 'h4', label: 'Überschrift 4', value: 4 },
  { id: 'h5', label: 'Überschrift 5', value: 5 },
  { id: 'h6', label: 'Überschrift 6', value: 6 },
];

type ArticleToolbarProps = {
  editorRef: React.RefObject<QuillEditor | null>;
  currentHtml: string;
  isHtmlMode: boolean;
  onToggleHtmlMode: () => void;
};

export const ArticleToolbar: React.FC<ArticleToolbarProps> = ({
  editorRef,
  currentHtml,
  isHtmlMode,
  onToggleHtmlMode,
}) => {
  const [selectedHeadingId, setSelectedHeadingId] = React.useState<string>('p');
  const applyHeading = async (option: HeadingOption) => {
    setSelectedHeadingId(option.id);
    const editor = editorRef.current;
    if (!editor) return;

    if (option.value === 'paragraph') {
      await editor.format('header', false);
    } else {
      await editor.format('header', option.value);
    }
  };

  const toggleFormat = async (format: 'bold' | 'italic' | 'underline') => {
    const editor = editorRef.current;
    if (!editor) return;
    await editor.format(format, true);
  };

  const toggleScript = async (scriptType: 'sub' | 'super') => {
    const editor = editorRef.current;
    if (!editor) return;
    await editor.format('script', scriptType);
  };

  const setList = async (type: 'bullet' | 'ordered') => {
    const editor = editorRef.current;
    if (!editor) return;
    await editor.format('list', type);
  };

  return (
    <View style={styles.container}>
      {/* Heading Dropdown */}
      <View style={styles.headingDropdown}>
        <AppDropdown
          label=""
          placeholder="Absatz"
          items={HEADING_OPTIONS.map((opt) => ({
            id: opt.id,
            label: opt.label,
          }))}
          selectedId={selectedHeadingId}
          onSelectId={(id) => {
            const opt = HEADING_OPTIONS.find((o) => o.id === id);
            if (opt) {
              applyHeading(opt);
            }
          }}
        />
      </View>

      {/* Buttons Reihe */}
      <View style={styles.buttonsRow}>
        <ToolbarButton label="B" onPress={() => toggleFormat('bold')} />
        <ToolbarButton label="I" onPress={() => toggleFormat('italic')} />
        <ToolbarButton label="U" onPress={() => toggleFormat('underline')} />
        <ToolbarButton label="x₂" onPress={() => toggleScript('sub')} />
        <ToolbarButton label="x²" onPress={() => toggleScript('super')} />
        <ToolbarButton label="=" onPress={() => setList('bullet')} />
        <ToolbarButton label="1." onPress={() => setList('ordered')} />
        <ToolbarButton label="</>" onPress={onToggleHtmlMode} />
      </View>
    </View>
  );
};

type ToolbarButtonProps = {
  label: string;
  onPress: () => void;
};

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ label, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  headingDropdown: {
    flex: 1,
    marginRight: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    flex: 1.5,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 5,
  },
  button: {
    minWidth: 37,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginInlineEnd: 8,
  },
  buttonText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});