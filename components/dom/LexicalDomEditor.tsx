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

/**
 * Wichtig: Theme als Objekt (nicht Funktion) und mit text.underline
 * Dadurch hängt Lexical die Klasse an die gerenderten Elemente, sodass
 * Underline sichtbar wird (z. B. class="underline" => text-decoration)
 */
const theme = {
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline", // <-- zentrale Änderung: sorgt dafür, dass Underline sichtbar wird
    strikethrough: "line-through",
    subscript: "align-sub",
    superscript: "align-super",
  },
  // du kannst hier später noch paragraph/heading/list/etc. ergänzen
};

function onError(error: Error) {
  console.error("Lexical Editor Error:", error);
}

function ExternalHtmlSyncPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (html == null) return;
    if (typeof window === "undefined" || typeof document === "undefined") return;

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
      nodes.forEach(node => root.append(node));
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

  // ContentEditable props
  const contentEditableProps: ContentEditableProps = {
    className: "editor-input",
    "aria-placeholder": placeholder,
    placeholder: <></>,
  };

  // container inline style kommt von props.dom?.style (z. B. height)
  const containerStyle = props.dom?.style ?? {};
  



  // --- NEU ---
  // Inject very-specific strong overrides to neutralize UA blue focus ring (idempotent)
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.querySelector('style[data-editor-theme-fix]')) return;

    const css = `
      /* ensure editor input uses logical padding-inline */
      .editor-container {
        width:100%;
      }
      .editor-container .editor-input,
      .editor-container .editor-input[contenteditable="true"],
      .editor-container .editor-inner [contenteditable],
      .editor-container .editor-inner [contenteditable="true"] {
        padding-block: 0 8px !important;
        padding-inline: 12px 4px !important;
        font-family:'Roboto',sans-serif;
        font-weight:300;
        font-size:14px;
        color:#efefef;
      }
      .editor-placeholder {
        font-family: 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif !important;
        font-weight:300;
        font-size:14px;
        color:#efefef;
        padding-inline: 8px 4px !important;
      }
      /* very specific overrides for editor focus to neutralize UA blue ring */
      .editor-container .editor-input:focus,
      .editor-container .editor-input[contenteditable="true"]:focus,
      .editor-container .editor-inner [contenteditable]:focus,
      .editor-container .editor-inner [contenteditable="true"]:focus,
      .editor-container .editor-input *:focus,
      .editor-container .editor-inner [contenteditable] *:focus,
      .editor-container [data-lexical-editor] :focus {
        outline: 0 !important;
        outline-style: none !important;
        outline-color: transparent !important;
        outline-width: 0 !important;
        outline-offset: 0 !important;
        box-shadow: none !important;
        -webkit-box-shadow: none !important;
        -moz-box-shadow: none !important;
        border-color: inherit !important;
        -webkit-focus-ring-color: transparent !important;
        -moz-outline-color: transparent !important;
      }
      /* Underline für Lexical-Textnodes */
      .editor-input .underline,
      .editor-inner .underline,
      .editor-container .underline,
      .underline {
        text-decoration: underline !important;
      }

      /* remove any :focus-visible ring as requested */
      .editor-container .editor-input:focus-visible,
      .editor-container .editor-input[contenteditable="true"]:focus-visible,
      .editor-container .editor-inner [contenteditable]:focus-visible,
      .editor-container .editor-inner [contenteditable="true"]:focus-visible,
      .editor-container .editor-input *:focus-visible,
      .editor-container .editor-inner [contenteditable] *:focus-visible {
        outline: 0 !important;
        box-shadow: none !important;
        -webkit-box-shadow: none !important;
        border-color: inherit !important;
      }
    `;

    const style = document.createElement("style");
    style.setAttribute("data-editor-theme-fix", "true");
    style.textContent = css;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);
  // --- ENDE NEU ---

  return (
    <div className="editor-container" style={containerStyle}>

      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <ExternalHtmlSyncPlugin html={props.value ?? ""} />
        <div className="editor-inner" style={{ position: "relative" }}>
          <RichTextPlugin
            contentEditable={<ContentEditable {...contentEditableProps} />}
            placeholder={
              <div
                className="editor-placeholder"
                style={{ position: "absolute", top: 0, left: 5, color: "#efefef", zIndex: -1 }}
              >
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin
            onChange={handleChange}
            ignoreHistoryMergeTagChange={true}
            ignoreSelectionChange={true}
          />
          <ListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}