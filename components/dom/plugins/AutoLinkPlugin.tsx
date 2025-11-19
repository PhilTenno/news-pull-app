"use dom";

import { AutoLinkPlugin as LexicalAutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";

const URL_REGEX =
  /((https?:\/\/)(www\.)?[^\s/$.?#].[^\s]*)/i;

// optional: E-Mail, etc. – hier nur HTTP/HTTPS
const MATCHERS = [
  (text: string) => {
    const match = text.match(URL_REGEX);
    if (match === null) {
      return null;
    }
    const fullMatch = match[0];
    const index = match.index ?? 0;
    return {
      index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch,
    };
  },
];

export default function AutoLinkPlugin() {
  return <LexicalAutoLinkPlugin matchers={MATCHERS} />;
}