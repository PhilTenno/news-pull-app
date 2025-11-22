// components/dom/LexicalDomEditor.tsx
"use dom";

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable, type ContentEditableProps } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getRoot, type EditorState } from "lexical";
import React, { useEffect, useState } from "react";
import ToolbarPlugin from "./plugins/ToolbarPlugin";

import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { HeadingNode } from "@lexical/rich-text";
import AutoLinkPlugin from "./plugins/AutoLinkPlugin";

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
  // Theme placeholders - falls später Klassen zugewiesen werden sollen
};

function onError(error: Error) {
  console.error("Lexical Editor Error:", error);
}

function ExternalHtmlSyncPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (html == null) return;

    editor.update(() => {
      const root = $getRoot();
      const currentHtml = $generateHtmlFromNodes(editor, null);
      if (currentHtml === html) {
        return;
      }

      if (!html || html.trim().length === 0) {
        root.clear();
        return;
      }

      const domParser = new DOMParser();
      const dom = domParser.parseFromString(html, "text/html");

      root.clear();
      const nodes = $generateNodesFromDOM(editor, dom.body);
      nodes.forEach((node) => {
        root.append(node);
      });
      root.select();
    });
  }, [html, editor]);

  return null;
}

export default function LexicalDomEditor(props: LexicalDomEditorProps) {
  const [initialHtml] = useState(props.value ?? "");

  const initialConfig = {
    namespace: "NewsPullEditor",
    theme,
    onError,
    nodes: [HeadingNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
    editorState: (editor: any) => {
      const value = initialHtml;
      if (!value || value.trim().length === 0) {
        return;
      }

      editor.update(() => {
        const root = $getRoot();
        const domParser = new DOMParser();
        const dom = domParser.parseFromString(value, "text/html");
        root.clear();
        const nodes = $generateNodesFromDOM(editor, dom.body);
        nodes.forEach((node) => {
          root.append(node);
        });
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

  // CSS injection: Google Fonts + focus removal + font override für Editor-Elemente
  const injectedCss = `
    /* Roboto aus Google Fonts (300/400/500/700) */
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

    .editor-container,
    .editor-inner,
    .editor-input,
    .editor-placeholder {
      font-family: 'Roboto', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      -webkit-font-smoothing:antialiased;
      -moz-osx-font-smoothing:grayscale;
    }

    /* Entferne Browser-Fokus-Rahmen für contenteditable */
    [contenteditable], .editor-input {
      outline: none !important;
      box-shadow: none !important;
      -webkit-tap-highlight-color: transparent;
    }
    [contenteditable]:focus, .editor-input:focus {
      outline: none !important;
      box-shadow: none !important;
    }

    /* Platzhalter styling */
    .editor-placeholder {
      pointer-events: none;
      color: #999;
    }

    /* Basis-Reset für Editor-Box */
    .editor-container {
      box-sizing: border-box;
    }

    /* optional: Paragraph styling, harmonisiert mit native UI */
    .editor-input p {
      margin: 0 0 0.85em 0;
    }
  `;

  // ContentEditable props
  const contentEditableProps: ContentEditableProps = {
    className: "editor-input",
    "aria-placeholder": placeholder,
    placeholder: <></>,
  };

  // container inline style kommt von props.dom?.style (z. B. height)
  const containerStyle = props.dom?.style ?? {};

  return (
    <div className="editor-container" style={containerStyle}>
      {/* injizierte CSS (wird im gerenderten HTML angewendet) */}
      <style dangerouslySetInnerHTML={{ __html: injectedCss }} />
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <ExternalHtmlSyncPlugin html={props.value ?? ""} />
        <div className="editor-inner" style={{ position: "relative" }}>
          <RichTextPlugin
            contentEditable={<ContentEditable {...contentEditableProps} />}
            placeholder={
              <div
                className="editor-placeholder"
                style={{ position: "absolute", top: 0, left: 5, color: "#999", zIndex: -1 }}
              >
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleChange} ignoreHistoryMergeTagChange ignoreSelectionChange />
          <ListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}