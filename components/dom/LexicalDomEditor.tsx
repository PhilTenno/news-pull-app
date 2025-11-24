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

  // ContentEditable props
  const contentEditableProps: ContentEditableProps = {
    className: "editor-input",
    "aria-placeholder": placeholder,
    placeholder: <></>,
  };

  // container inline style kommt von props.dom?.style (z. B. height)
  const containerStyle = props.dom?.style ?? {};
  const cssHref = "/styles/editor-theme.css";

  const cssFallbackScript = `(function(){ try {
    var href = '${cssHref}';
    var link = document.querySelector('link[href=\"' + href + '\"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
    link.onerror = function() {
      fetch(href).then(function(r){ return r.text(); }).then(function(t){
        var s = document.createElement('style');
        s.textContent = t;
        document.head.appendChild(s);
      }).catch(function(){/* ignore */});
    };
  } catch(e) { /* ignore in non-web env */ }})();`;

  // --- NEU ---
  // Inject very-specific strong overrides to neutralize UA blue focus ring (idempotent)
  // Also adjust padding: use logical properties: padding-block remains 12px, padding-inline becomes 8px
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.querySelector('style[data-editor-theme-fix]')) return;

    const css = `
      /* ensure editor input uses logical padding-inline */
      .editor-container .editor-input,
      .editor-container .editor-input[contenteditable="true"],
      .editor-container .editor-inner [contenteditable],
      .editor-container .editor-inner [contenteditable="true"] {
        padding-block: 0 8px !important;
        padding-inline: 12px 4px !important;
        font-family:'Roboto',sans-serif;
        font-weight:300;
        font-size:14px;
      }
      .editor-placeholder {
        font-family: 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif !important;
        font-weight:300;
        font-size:14px;
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
      {/* Externe CSS (wird vom Webserver / Dev-Server bereitgestellt) */}
      <link rel="stylesheet" href={cssHref} />
      {/* Fallback: falls Link nicht geladen werden kann, fetch + injizieren */}
      <script dangerouslySetInnerHTML={{ __html: cssFallbackScript }} />
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