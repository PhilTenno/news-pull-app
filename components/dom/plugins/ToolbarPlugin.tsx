//components/dom/plugins/Toolbarplugin.tsx
"use dom";

import { MaterialIcons } from "@expo/vector-icons"; // MaterialIcons verwenden
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

        if (type === "heading" && $isHeadingNode(element)) {
          const tag = element.getTag();
          nextBlockType = tag as HeadingTag;
        } else if (type === "paragraph") {
          nextBlockType = "paragraph";
        }

        if (element instanceof ListNode) {
          const listKind = element.getListType();
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
  const formatText = (
    format: "bold" | "italic" | "underline" | "subscript" | "superscript"
  ) => {
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
          const children = element.getChildren();
          children.forEach((child) => {
            paragraphNode.append(child);
          });
          element.replace(paragraphNode);
          targetElement = paragraphNode;
        } else {
          targetElement = element;
        }

        const offset = targetElement.getChildrenSize();
        selection.anchor.set(targetElement.getKey(), offset, "element");
        selection.focus.set(targetElement.getKey(), offset, "element");
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

      const offset = targetElement.getChildrenSize();
      selection.anchor.set(targetElement.getKey(), offset, "element");
      selection.focus.set(targetElement.getKey(), offset, "element");
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
          .filter((n) => n !== null) as Array<ReturnType<
          typeof $createParagraphNode
        >>;

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
          .filter((n) => n !== null) as Array<ReturnType<
          typeof $createParagraphNode
        >>;

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

      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    });
  };

  // Styling helpers
  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    padding: 6,
    borderRadius: 6,
    border: "none",
    background: "transparent",
    cursor: "pointer",
  };

  const ICON_SIZE = 14; // statt 18
  const activeBg = "#0a7ea4";
  const activeColor = "#efefef";
  const inactiveColor = "#efefef";

  return (
    <div
      className="toolBar" 
      style={{        
        position:'sticky',
        top:0,
        display: "flex",                
        flexWrap: "wrap",
        justifyContent:'space-between',
        gap: 4,
        paddingBlock: 8,
        paddingInline:8,
        backgroundColor:'#23272E',
        borderRadius:6,
        zIndex:1,
      }}
    >
      {/* Block-Typ Auswahl */}
      <select
        value={blockType}
        onChange={(e) => applyBlockType(e.target.value as HeadingTag)}
        style={{ paddingBlock:4,
          paddingInline:8,
          paddingInlineStart:10,
          maxWidth:80,
          borderColor:'#556070',
          color:'#efefef',
          backgroundColor:'rgba(255,255,255,0.1)'}}
      >
        <option value="paragraph">Absatz</option>
        <option value="h2">Überschrift 2</option>
        <option value="h3">Überschrift 3</option>
        <option value="h4">Überschrift 4</option>
        <option value="h5">Überschrift 5</option>
        <option value="h6">Überschrift 6</option>
      </select>

      {/* Inline-Formatierung mittels MaterialIcons */}
      <button
        type="button"
        onClick={() => formatText("bold")}
        style={{
          ...btnBase,
          backgroundColor: isBold ? activeBg : "transparent",
        }}
        aria-pressed={isBold}
        title="Fett"
        aria-label="Fett"
      >
        <MaterialIcons name="format-bold" size={ICON_SIZE} color={isBold ? activeColor : inactiveColor} />
      </button>

      <button
        type="button"
        onClick={() => formatText("italic")}
        style={{
          ...btnBase,
          backgroundColor: isItalic ? activeBg : "transparent",
        }}
        aria-pressed={isItalic}
        title="Kursiv"
        aria-label="Kursiv"
      >
        <MaterialIcons name="format-italic" size={ICON_SIZE} color={isItalic ? activeColor : inactiveColor} />
      </button>

      <button
        type="button"
        onClick={() => formatText("underline")}
        style={{
          ...btnBase,
          backgroundColor: isUnderline ? activeBg : "transparent",
        }}
        aria-pressed={isUnderline}
        title="Unterstrichen"
        aria-label="Unterstrichen"
      >
        <MaterialIcons name="format-underlined" size={ICON_SIZE} color={isUnderline ? activeColor : inactiveColor} />
      </button>

      {/* Listen */}
      <button
        type="button"
        onClick={toggleUnorderedList}
        style={{
          ...btnBase,
          backgroundColor: listType === "bullet" ? activeBg : "transparent",
        }}
        title="Ungeordnete Liste"
        aria-label="Ungeordnete Liste"
      >
        <MaterialIcons name="format-list-bulleted" size={ICON_SIZE} color={listType === "bullet" ? activeColor : inactiveColor} />
      </button>

      <button
        type="button"
        onClick={toggleOrderedList}
        style={{
          ...btnBase,
          backgroundColor: listType === "number" ? activeBg : "transparent",
        }}
        title="Geordnete Liste"
        aria-label="Geordnete Liste"
      >
        <MaterialIcons name="format-list-numbered" size={ICON_SIZE} color={listType === "number" ? activeColor : inactiveColor} />
      </button>

      <button
        type="button"
        onClick={() => formatText("subscript")}
        style={{
          ...btnBase,
          backgroundColor: isSubscript ? activeBg : "transparent",
        }}
        title="Tiefgestellt"
        aria-label="Tiefgestellt"
      >
        <MaterialIcons name="vertical-align-bottom" size={ICON_SIZE} color={isSubscript ? activeColor : inactiveColor} />
      </button>

      <button
        type="button"
        onClick={() => formatText("superscript")}
        style={{
          ...btnBase,
          backgroundColor: isSuperscript ? activeBg : "transparent",
        }}
        title="Hochgestellt"
        aria-label="Hochgestellt"
      >
        <MaterialIcons name="vertical-align-top" size={ICON_SIZE} color={isSuperscript ? activeColor : inactiveColor} />
      </button>
    </div>
  );
}