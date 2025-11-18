import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import type { EditorState } from 'lexical';
import { $getRoot } from 'lexical';
import React from 'react';

type LexicalEditorProps = {
  value?: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
};

const theme = {
  // Hier können wir später Klassen/Tokens definieren
};

const Placeholder = () => {
  return <div style={{ opacity: 0.5 }}>Gib deinen Inhalt ein…</div>;
};

function onError(error: Error) {
  console.error('Lexical Editor Error:', error);
}

export function LexicalEditor(props: LexicalEditorProps) {
  const initialConfig = {
    namespace: 'NewsPullEditor',
    theme,
    onError,
    nodes: [],
    editorState: (editor: any) => {
      const value = props.value ?? '';

      editor.update(() => {
        const root = $getRoot();

        // Wenn es HTML gibt, dieses in Nodes umwandeln
        if (value && value.trim().length > 0) {
          const domParser = new DOMParser();
          const dom = domParser.parseFromString(value, 'text/html');

          // Vorhandene Kinder des Root entfernen
          root.clear();

          const nodes = $generateNodesFromDOM(editor, dom.body);

          nodes.forEach((node) => {
            root.append(node);
          });
        } else {
          // Kein Inhalt: Root bleibt leer, Lexical erzeugt einen Standard-Paragraph
          // oder wir könnten explizit einen Paragraph erzeugen – für jetzt reicht Standard.
        }
      });
    },
  };

  function InnerEditor() {
    const [editor] = useLexicalComposerContext();

    const handleChange = (editorState: EditorState) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor, null);
        if (props.onChange) {
          props.onChange(html);
        }
      });
    };

    return (
      <>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              style={{
                minHeight: 200,
                outline: 'none',
              }}
            />
          }
          placeholder={<Placeholder />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} />
      </>
    );
  }

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 8 }}>
      <LexicalComposer initialConfig={initialConfig}>
        <InnerEditor />
      </LexicalComposer>
    </div>
  );
}