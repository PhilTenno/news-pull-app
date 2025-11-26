// components/dom/plugins/AutoLinkPlugin.tsx
"use dom";

import { AutoLinkPlugin as LexicalAutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";

/* --------------------------------------------------------------- */
/* 1️⃣  Regex für URLs                                            */
/*    – mindestens ein Punkt im Host (Sub‑/Multi‑TLD)             */
/*    – TLD muss ≥ 2 Zeichen haben                               */
/*    – endet bei Leerzeichen / Zeilenende                        */
/* --------------------------------------------------------------- */
const URL_REGEX =
  /((https?:\/\/)[^\s/$.?#].[^\s]*?\.[a-z]{2,}(?:\.[a-z]{2,})*)(?=\s|$)/i;

/* --------------------------------------------------------------- */
/* 2️⃣  Regex für E‑Mail                                         */
/*    – einfacher, aber gut genug für die meisten Fälle           */
/* --------------------------------------------------------------- */
const EMAIL_REGEX =
  /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}(?:\.[a-z]{2,})*)(?=\s|$)/i;

/* --------------------------------------------------------------- */
/* 3️⃣  Matcher‑Array – prüft zuerst URL, dann E‑Mail             */
/* --------------------------------------------------------------- */
const MATCHERS = [
  (text: string) => {
    let match;

    /* ---- URL ------------------------------------------------ */
    if ((match = text.match(URL_REGEX))) {
      const url = match[0];
      return {
        index: match.index ?? 0,
        length: url.length,
        text: url,
        url,                                 // <a href="url">
        attributes: {
          title: `open website: ${url}`
        },
      };
    }

    /* ---- E‑Mail --------------------------------------------- */
    if ((match = text.match(EMAIL_REGEX))) {
      const email = match[0];
      return {
        index: match.index ?? 0,
        length: email.length,
        text: email,
        url: `mailto:${email}`,              // <a href="mailto:…">
        attributes: {
          title: `send mail to ${email}`,
        },
      };
    }

    return null;   // kein Treffer
  },
];

export default function AutoLinkPlugin() {
  return <LexicalAutoLinkPlugin matchers={MATCHERS} />;
}