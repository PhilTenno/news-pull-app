// components/dom/LexicalDomEditor.tsx
"use dom";

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  ContentEditable,
  type ContentEditableProps,
} from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getRoot, type EditorState } from "lexical";
import React, { useEffect, useRef } from "react";

import i18n from '@/utils/i18n';
import { AutoLinkNode, LinkNode } from "@lexical/link"; // <-- import both nodes
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { HeadingNode } from "@lexical/rich-text";
import AutoLinkPlugin from "./plugins/AutoLinkPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";


export type LexicalDomEditorProps = {
  /** HTML‑String that represents the editor content */
  value: string;
  /** Called whenever the editor changes (new HTML) */
  onChange?: (html: string) => void;
  /** Optional read‑only mode – not used in the current app but kept for future extension */
  readOnly?: boolean;
  /** Optional style overrides (e.g. height) */
  dom?: {
    style?: { height?: number; [key: string]: any };
    matchContents?: boolean;
    [key: string]: any;
  };
};

const placeholder = i18n.t('editorPlaceholder');

/* ------------------------------------------------------------------ */
/* Lexical theme – the `underline` class is mapped to a CSS rule   */
/* ------------------------------------------------------------------ */
const theme = {
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    subscript: "align-sub",
    superscript: "align-super",
  },
};

function onError(error: Error) {
  console.error("Lexical Editor Error:", error);
}

/* ------------------------------------------------------------------ */
/* Synchronise the external `value` prop with the internal editor.   */
/* The update is performed **without** triggering change events,    */
/* so that `onChange` in the parent does not re‑enter this function.*/
/* ------------------------------------------------------------------ */
function ExternalHtmlSyncPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext();
  const prevHtmlRef = useRef<string>("");

  useEffect(() => {
    if (!editor || !html) return;

    // Only update when the incoming HTML actually changed
    if (prevHtmlRef.current === html) return;

    editor.update(() => {
      const root = $getRoot();
      const currentHtml = $generateHtmlFromNodes(editor, null);

      if (currentHtml === html) return; // nothing to do

      root.clear();
      const domParser = new DOMParser();
      const dom = domParser.parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom.body);
      nodes.forEach((node) => root.append(node));
    });

    prevHtmlRef.current = html;
  }, [html, editor]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Main component – no `editorState` is used; the editor keeps its    */
/* internal state and only syncs with `value` via ExternalHtmlSyncPlugin.*/
/* ------------------------------------------------------------------ */
export default function LexicalDomEditor(props: LexicalDomEditorProps) {
  const { value, onChange, readOnly = false, dom } = props;
  const containerStyle = dom?.style ?? {};

  /* -------------------------------------------------------------- */
  /* Handle internal editor changes – forward new HTML to parent.   */
  /* -------------------------------------------------------------- */
  const handleChange = (editorState: EditorState, editor: any) => {
    editorState.read(() => {
      const newHtml = $generateHtmlFromNodes(editor, null);
      if (newHtml !== value) {
        onChange?.(newHtml);
      }
    });
  };

  /* -------------------------------------------------------------- */
  /* Editor configuration – no initial `editorState` to avoid re‑init. */
  /* -------------------------------------------------------------- */
  const initialConfig = {
    namespace: "NewsPullEditor",
    theme,
    onError,
    nodes: [HeadingNode, ListNode, ListItemNode, LinkNode, AutoLinkNode], // <-- include AutoLinkNode
  };

  /* -------------------------------------------------------------- */
  /* ContentEditable props – placeholder is required by the type.   */
  /* -------------------------------------------------------------- */
  const contentEditableProps: ContentEditableProps = {
    className: "editor-input",
    "aria-placeholder": placeholder,
    placeholder: <></>, // dummy element – actual UI handled by RichTextPlugin
  };

  /* -------------------------------------------------------------- */
  /* Inject custom CSS to style the editor and remove default focus ring. */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.querySelector("style[data-editor-theme-fix]")) return;

    const css = `
      .editor-container { width:100%; }
      .editor-input,
      .editor-input[contenteditable="true"],
      .editor-inner [contenteditable],
      .editor-inner [contenteditable="true"] {
        padding-block: 0;
        padding-inline: 12px 4px !important;
        font-family:'Roboto',sans-serif;
        font-weight:300;
        font-size:14px;
        color:#efefef;
      }
      .editor-input {
        min-height:100vh;
      }
      .editor-placeholder {
        font-family: 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif !important;
        font-weight:300;
        font-size:14px;
        color:#efefef;
        padding-inline: 8px 4px !important;
      }
      .editor-input:focus,
      .editor-input[contenteditable="true"]:focus,
      .editor-inner [contenteditable]:focus,
      .editor-inner [contenteditable="true"]:focus {
        outline:none !important;
        box-shadow:none !important;
      }
      .underline { text-decoration: underline !important; }
      a {color:#efefef !important;text-decoration:underline}
    `;

    const style = document.createElement("style");
    style.setAttribute("data-editor-theme-fix", "true");
    style.textContent = css;
    document.head.appendChild(style);

    return () => style.remove();
  }, []);

  /* -------------------------------------------------------------- */
  /* Render the editor.                                               */
  /* -------------------------------------------------------------- */
  return (
    <div className="editor-container" style={containerStyle}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <ExternalHtmlSyncPlugin html={value ?? ""} />

        <div className="editor-inner" style={{ position: "relative" }}>
          <RichTextPlugin
            contentEditable={<ContentEditable {...contentEditableProps} />}
            placeholder={
              <div className="editor-placeholder" style={{ position: "absolute", top: 0, left: 5 }}>
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