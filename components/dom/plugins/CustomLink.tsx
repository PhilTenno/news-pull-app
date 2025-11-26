// components/dom/plugins/CustomLink.tsx
import { LinkNode } from "@lexical/link";
import React from "react";

export default function CustomLink({ node }: { node: LinkNode }) {
  const url = node.getURL();

  return (
    <a
      href={url}
      title={`open website: ${url}`}
    >
      {node.getTextContent()}
    </a>
  );
}