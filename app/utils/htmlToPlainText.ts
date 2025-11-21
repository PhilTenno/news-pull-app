// app/utils/htmlToPlainText.ts

// kleine Entity-Decodierung (häufig genutzte Entities)
const htmlEntities: { [k: string]: string } = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
  // weitere bei Bedarf
};

function decodeEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
      if (htmlEntities[entity]) return htmlEntities[entity];
      // numerische Entities
      const m = entity.match(/^&#(\d+);$/);
      if (m) {
        return String.fromCharCode(parseInt(m[1], 10));
      }
      return entity;
    });
}

/**
 * htmlToPlainText
 * - Entfernt Tags
 * - Konvertiert Mehrfachspaces in ein Space
 * - Decodiert einfache Entities
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  // 1) Replace block-level tags with line breaks to keep some structure (p, br, li, etc.)
  let s = html.replace(/<(\/)?(p|div|br|li|h[1-6]|tr|blockquote)[^>]*>/gi, ' ');
  // 2) Remove remaining tags
  s = s.replace(/<[^>]+>/g, ' ');
  // 3) Decode entities and collapse whitespace
  s = decodeEntities(s).replace(/\s+/g, ' ').trim();
  return s;
}