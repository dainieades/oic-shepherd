import { createClient } from './client';

const BUCKET = 'photos';

export async function uploadPhoto(path: string, blob: Blob): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: 'image/jpeg',
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deletePhotos(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove(paths);
}

export async function resizeImageBlob(blob: Blob, maxDim: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/jpeg', 0.9);
    };
    img.onerror = reject;
    img.src = url;
  });
}
