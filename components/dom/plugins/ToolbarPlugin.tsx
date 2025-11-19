"use dom";

import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type EditorState,
  type ElementNode,
  type LexicalCommand,
} from "lexical";
import { useCallback, useEffect, useState } from "react";

type HeadingTag = "paragraph" | "h2" | "h3" | "h4" | "h5" | "h6";
type ListType = "none" | "bullet" | "number";

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  // Inline-Format Status
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);

  // Block-/Listen-Status
  const [blockType, setBlockType] = useState<HeadingTag>("paragraph");
  const [listType, setListType] = useState<ListType>("none");

  const updateToolbar = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }

        // Inline-Formate
        setIsBold(selection.hasFormat("bold"));
        setIsItalic(selection.hasFormat("italic"));
        setIsUnderline(selection.hasFormat("underline"));
        setIsSubscript(selection.hasFormat("subscript"));
        setIsSuperscript(selection.hasFormat("superscript"));

        // Block-/Listen-Typ
        const anchor = selection.anchor.getNode();
        const element =
          anchor.getKey() === "root"
            ? anchor
            : anchor.getTopLevelElementOrThrow();
        const type = element.getType();

        let nextBlockType: HeadingTag = "paragraph";
        let nextListType: ListType = "none";

        // Heading?
        if (type === "heading" && $isHeadingNode(element)) {
          const tag = element.getTag(); // "h2" | "h3" | ...
          nextBlockType = tag as HeadingTag;
        } else if (type === "paragraph") {
          nextBlockType = "paragraph";
        }

        // Liste? (Top-Level ListNode oder ListItemNode mit Parent ListNode)
        if (element instanceof ListNode) {
          const listKind = element.getListType(); // "bullet" | "number"
          if (listKind === "bullet") {
            nextListType = "bullet";
          } else if (listKind === "number") {
            nextListType = "number";
          }
        } else if (element instanceof ListItemNode) {
          const parent = element.getParent();
          if (parent instanceof ListNode) {
            const listKind = parent.getListType();
            if (listKind === "bullet") {
              nextListType = "bullet";
            } else if (listKind === "number") {
              nextListType = "number";
            }
          }
        }

        setBlockType(nextBlockType);
        setListType(nextListType);
      });
    },
    [editor]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        updateToolbar(editorState);
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND as LexicalCommand<undefined>,
        () => {
          const editorState = editor.getEditorState();
          updateToolbar(editorState);
          return false;
        },
        1
      )
    );
  }, [editor, updateToolbar]);

  // === Inline-Format ===

  const formatText = (format: "bold" | "italic" | "underline" | "subscript" | "superscript") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  // === Blocktyp / Headings ===

  const applyBlockType = (tag: HeadingTag) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchorNode = selection.anchor.getNode();
      const element = (anchorNode.getKey() === "root"
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow()) as ElementNode;

      let targetElement: ElementNode = element;

      if (tag === "paragraph") {
        if (element.getType() !== "paragraph") {
          const paragraphNode = $createParagraphNode();
          // Kinder in den neuen Paragraphen übernehmen
          const children = element.getChildren();
          children.forEach((child) => {
            paragraphNode.append(child);
          });
          element.replace(paragraphNode);
          targetElement = paragraphNode;
        } else {
          targetElement = element;
        }

        // Selection ans Ende des Absatzes setzen
        const offset = targetElement.getChildrenSize();
        selection.anchor.set(
          targetElement.getKey(),
          offset,
          "element"
        );
        selection.focus.set(
          targetElement.getKey(),
          offset,
          "element"
        );
        $setSelection(selection);

        setBlockType("paragraph");
        return;
      }

      if (element.getType() === "heading" && $isHeadingNode(element)) {
        if (element.getTag() !== tag) {
          element.setTag(tag as any);
        }
        targetElement = element;
      } else {
        const headingNode = $createHeadingNode(tag as any);
        const children = element.getChildren();
        children.forEach((child) => {
          headingNode.append(child);
        });
        element.replace(headingNode);
        targetElement = headingNode;
      }

      // Selection ans Ende der Überschrift setzen
      const offset = targetElement.getChildrenSize();
      selection.anchor.set(
        targetElement.getKey(),
        offset,
        "element"
      );
      selection.focus.set(
        targetElement.getKey(),
        offset,
        "element"
      );
      $setSelection(selection);

      setBlockType(tag);
    });
  };

  // === Listen: Toggle UL ===

  const toggleUnorderedList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchor = selection.anchor.getNode();
      const element =
        anchor.getKey() === "root"
          ? anchor
          : anchor.getTopLevelElementOrThrow();

      // A: Top-Level ist eine UL -> zurück zu Paragraphen
      if (element instanceof ListNode && element.getListType() === "bullet") {
        const paragraphs = element
          .getChildren()
          .map((child) => {
            if (child instanceof ListItemNode) {
              const p = $createParagraphNode();
              child.getChildren().forEach((grandChild) => {
                p.append(grandChild);
              });
              return p;
            }
            return null;
          })
          .filter((n) => n !== null) as Array<ReturnType<typeof $createParagraphNode>>;

        if (paragraphs.length > 0) {
          element.replace(paragraphs[0]);
          for (let i = 1; i < paragraphs.length; i++) {
            paragraphs[0].insertAfter(paragraphs[i]);
          }
        } else {
          const p = $createParagraphNode();
          element.replace(p);
        }
        return;
      }

      // B: Cursor in ListItem einer UL -> Liste auflösen
      if (element instanceof ListItemNode) {
        const parent = element.getParent();
        if (parent instanceof ListNode && parent.getListType() === "bullet") {
          const p = $createParagraphNode();
          element.getChildren().forEach((child) => {
            p.append(child);
          });
          parent.replace(p);
          return;
        }
      }

      // Sonst: Standard UL-Kommandos (Paragraph -> UL oder OL -> UL)
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    });
  };

  // === Listen: Toggle OL ===

  const toggleOrderedList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchor = selection.anchor.getNode();
      const element =
        anchor.getKey() === "root"
          ? anchor
          : anchor.getTopLevelElementOrThrow();

      // A: Top-Level ist eine OL -> zurück zu Paragraphen
      if (element instanceof ListNode && element.getListType() === "number") {
        const paragraphs = element
          .getChildren()
          .map((child) => {
            if (child instanceof ListItemNode) {
              const p = $createParagraphNode();
              child.getChildren().forEach((grandChild) => {
                p.append(grandChild);
              });
              return p;
            }
            return null;
          })
          .filter((n) => n !== null) as Array<ReturnType<typeof $createParagraphNode>>;

        if (paragraphs.length > 0) {
          element.replace(paragraphs[0]);
          for (let i = 1; i < paragraphs.length; i++) {
            paragraphs[0].insertAfter(paragraphs[i]);
          }
        } else {
          const p = $createParagraphNode();
          element.replace(p);
        }
        return;
      }

      // B: Cursor in ListItem einer OL -> Liste auflösen
      if (element instanceof ListItemNode) {
        const parent = element.getParent();
        if (parent instanceof ListNode && parent.getListType() === "number") {
          const p = $createParagraphNode();
          element.getChildren().forEach((child) => {
            p.append(child);
          });
          parent.replace(p);
          return;
        }
      }

      // Sonst: Standard OL-Kommandos
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    });
  };

  // === Render ===

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        padding: 8,
      }}
    >
      {/* Block-Typ Auswahl */}
      <select
        value={blockType}
        onChange={(e) => applyBlockType(e.target.value as HeadingTag)}
        style={{ padding: 4 }}
      >
        <option value="paragraph">Absatz</option>
        <option value="h2">Überschrift 2</option>
        <option value="h3">Überschrift 3</option>
        <option value="h4">Überschrift 4</option>
        <option value="h5">Überschrift 5</option>
        <option value="h6">Überschrift 6</option>
      </select>

      {/* Inline-Formatierung */}
      <button
        type="button"
        onClick={() => formatText("bold")}
        style={{
          fontWeight: isBold ? "700" : "400",
          padding: "4px 8px",
        }}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => formatText("italic")}
        style={{
          fontStyle: isItalic ? "italic" : "normal",
          padding: "4px 8px",
        }}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => formatText("underline")}
        style={{
          textDecoration: isUnderline ? "underline" : "none",
          padding: "4px 8px",
        }}
      >
        U
      </button>

      {/* Listen */}
      <button
        type="button"
        onClick={toggleUnorderedList}
        style={{
          padding: "4px 8px",
          backgroundColor: listType === "bullet" ? "#e0e0e0" : "transparent",
        }}
      >
        • =
      </button>
      <button
        type="button"
        onClick={toggleOrderedList}
        style={{
          padding: "4px 8px",
          backgroundColor: listType === "number" ? "#e0e0e0" : "transparent",
        }}
      >
        1. =
      </button>

      <button
        type="button"
        onClick={() => formatText("subscript")}
        style={{
          padding: "4px 8px",
          backgroundColor: isSubscript ? "#e0e0e0" : "transparent",
        }}
      >
        x<sub>2</sub>
      </button>
      <button
        type="button"
        onClick={() => formatText("superscript")}
        style={{
          padding: "4px 8px",
          backgroundColor: isSuperscript ? "#e0e0e0" : "transparent",
        }}
      >
        x<sup>2</sup>
      </button>

    </div>
  );
}