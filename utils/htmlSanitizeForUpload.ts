// utils/htmlSanitizeForUpload.ts
export function sanitizeHtmlForUpload(html: string): string {
  if (!html) return html;
  let out = String(html);
  // <span ...> entfernen (öffnende Tags) und schließende </span>
  out = out.replace(/<span\b[^>]*>/gi, '').replace(/<\/span>/gi, '');
  // Attribute-Quotes normalisieren (optional)
  out = out.replace(/(\s[\w-:]+)="([^"]*)"/g, (_m, attr, val) => {
    const safeVal = val.replace(/'/g, '&#39;');
    return `${attr}='${safeVal}'`;
  });
  return out;
}

export default sanitizeHtmlForUpload;