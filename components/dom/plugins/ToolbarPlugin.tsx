"use dom";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React from "react";

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const applyBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  };

  const applyItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  };

  return (
    <div className="toolbar">
      <button type="button" onClick={applyBold}>
        B
      </button>
      <button type="button" onClick={applyItalic}>
        I
      </button>
    </div>
  );
}