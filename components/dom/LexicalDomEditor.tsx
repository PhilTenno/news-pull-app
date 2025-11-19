"use dom";

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import {
  ContentEditable,
  type ContentEditableProps,
} from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getRoot, type EditorState } from "lexical";
import { useState } from "react";
import ToolbarPlugin from "./plugins/ToolbarPlugin";

import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
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

  // Dummy-Placeholder für ContentEditable, damit der Typ erfüllt ist
  const contentEditableProps: ContentEditableProps = {
    className: "editor-input",
    "aria-placeholder": placeholder,
    placeholder: <></>,
  };

  return (
    <div className="editor-container" style={props.dom?.style}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="editor-inner" style={{position:'relative'}}>
          <RichTextPlugin
            contentEditable={<ContentEditable {...contentEditableProps} />}
            placeholder={
              <div className="editor-placeholder" style={{position:'absolute',top:0,left:5,color:'#999',zIndex:-1}}>{placeholder}</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin
            onChange={handleChange}
            ignoreHistoryMergeTagChange
            ignoreSelectionChange
          />
          <ListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}