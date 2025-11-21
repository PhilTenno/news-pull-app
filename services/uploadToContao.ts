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
) {
  const url = `${endpoint.replace(/\/$/, '')}?token=${encodeURIComponent(token)}`;

  const jsonPayload = { items: [payloadItem] };
  console.log('uploadToContao - jsonPayload:', JSON.stringify(jsonPayload, null, 2));

  const formData = new FormData();
  // WICHTIG: payload als String-Feld (nicht als Blob/File)
  formData.append('payload', JSON.stringify(jsonPayload));

  // Falls Bild vorhanden -> als multipart anhängen (Expo/React Native erwartet Objekt mit uri,name,type)
  if (imageUri) {
    const filename = imageUri.split('/').pop() ?? 'image.jpg';
    const extMatch = filename.match(/\.(\w+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: mime,
    } as any);

    //-> console.log('uploadToContao - appended image:', filename, mime);
  } else {
    //-> console.log('uploadToContao - no image attached, sending payload as form-field');
  }

  try {
    // NICHT: 'Content-Type': 'multipart/form-data' setzen -> fetch macht das mit Boundary automatisch
    const resp = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });

    let body: any = null;
    try {
      body = await resp.json();
    } catch {
      body = await resp.text();
    }

    //--> console.log('uploadToContao - response status:', resp.status);
    //-> console.log('uploadToContao - response body:', body);

    return { ok: resp.ok, status: resp.status, body };
  } catch (e) {
    console.error('uploadToContao - fetch error:', e);
    return { ok: false, status: 0, body: String(e) };
  }
}