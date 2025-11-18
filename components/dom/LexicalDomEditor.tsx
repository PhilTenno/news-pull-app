"use dom";

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getRoot, type EditorState } from "lexical";
import { useState } from "react";
import ToolbarPlugin from "./plugins/ToolbarPlugin";

export type LexicalDomEditorProps = {
  value: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
  dom?: {
    style?: { height?: number; [key: string]: any };
    matchContents?: boolean;
    [key: string]: any;
  };
};

const placeholder = "Gib deinen Artikeltext ein…";

const theme = {
  // Hier könnten wir später Klassen definieren, z.B. für Überschriften etc.
};

function onError(error: Error) {
  console.error("Lexical Editor Error:", error);
}

export default function LexicalDomEditor(props: LexicalDomEditorProps) {
  const [initialHtml] = useState(props.value ?? "");

  const initialConfig = {
    namespace: "NewsPullEditor",
    theme,
    onError,
    nodes: [],
    editorState: (editor: any) => {
      const value = initialHtml;
      editor.update(() => {
        const root = $getRoot();

        if (value && value.trim().length > 0) {
          const domParser = new DOMParser();
          const dom = domParser.parseFromString(value, "text/html");

          root.clear();
          const nodes = $generateNodesFromDOM(editor, dom.body);
          nodes.forEach((node) => {
            root.append(node);
          });
        } else {
          // Lexical erstellt einen leeren Absatz
        }
      });
    },
  };

  const handleChange = (editorState: EditorState, editor: any) => {
    editorState.read(() => {
      const html = $generateHtmlFromNodes(editor, null);
      if (props.onChange) {
        props.onChange(html);
      }
    });
  };

  return (
    <div className="editor-container">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input"
                aria-placeholder={placeholder}
                placeholder={
                  <div className="editor-placeholder">{placeholder}</div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin
            onChange={handleChange}
            ignoreHistoryMergeTagChange
            ignoreSelectionChange
          />
        </div>
      </LexicalComposer>
    </div>
  );
}