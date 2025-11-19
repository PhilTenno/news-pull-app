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

import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { HeadingNode } from "@lexical/rich-text";

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
  // hier könntest du später Klassen ergänzen (siehe Lexical Theming-Doku)
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
    // >>> NEU: Nodes registrieren
    // Siehe Beispiele z.B. in [Lexical Plugins](https://lexical.dev/docs/react/plugins)
    // und GitHub-Diskussionen #2745 / #5278.
    nodes: [HeadingNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
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
          // Lexical erstellt automatisch einen leeren Absatz
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
    <div className="editor-container" style={props.dom?.style}>
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
          {/* NEU */}
          <ListPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}