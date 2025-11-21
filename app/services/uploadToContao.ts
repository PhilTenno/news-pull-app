// app/services/uploadToContao.ts
export type ArticlePayload = {
  title: string;
  teaser: string;
  article: string; // HTML
  metaTitle: string;
  metaDescription: string;
  dateShow: string | null; // z.B. "2025-06-10 04:06:00"
  keywords: string;
  imageAlt: string;
};

type UploadResult = {
  ok: boolean;
  status: number;
  body?: any;
};

export async function uploadToContao(
  payloadItem: ArticlePayload,
  imageUri: string | null,
  token: string,
  endpoint: string
): Promise<UploadResult> {
  const formData = new FormData();
  const jsonPayload = { items: [payloadItem] };

  // Versuche Blob mit application/json, fallback auf String
  try {
    const jsonString = JSON.stringify(jsonPayload);
    let appended = false;

    if (typeof Blob !== 'undefined') {
      try {
        const jsonBlob = new Blob([jsonString], { type: 'application/json' });
        // some RN runtimes may require `as any` for TS
        formData.append('payload', jsonBlob as any, 'payload.json');
        appended = true;
      } catch (e) {
        console.warn('Blob create failed, falling back to string payload part:', e);
      }
    }

    if (!appended) {
      formData.append('payload', JSON.stringify(jsonPayload));
    }
  } catch (e) {
    console.warn('Fehler beim Anhängen des payload-Parts, sende als String:', e);
    formData.append('payload', JSON.stringify(jsonPayload));
  }

  if (imageUri) {
    const filename = imageUri.split('/').pop() ?? 'image.jpg';
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: 'image/jpeg',
    } as any);
  }

  // Endpoint normalisieren: ensure no trailing slash and add /newspullimport only if not present
  const normalized = endpoint.replace(/\/$/, '');
  const hasPath = normalized.toLowerCase().includes('/newspullimport');
  const url = hasPath
    ? `${normalized}?token=${encodeURIComponent(token)}`
    : `${normalized}/newspullimport?token=${encodeURIComponent(token)}`;

  if (!token) {
    console.warn('uploadToContao: kein API-Token übergeben - Anfrage vermutlich nicht autorisiert.');
  }

  try {
    const resp = await fetch(url, {
      method: 'POST',
      body: formData,
      // Wichtig: Content-Type nicht manuell setzen (FormData setzt boundary)
      headers: {
        Accept: 'application/json',
      },
    });

    let body = null;
    try {
      body = await resp.json();
    } catch {
      body = await resp.text();
    }

    return { ok: resp.ok, status: resp.status, body };
  } catch (e) {
    console.error('uploadToContao error:', e);
    return { ok: false, status: 0, body: String(e) };
  }
}