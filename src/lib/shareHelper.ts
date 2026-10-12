// Utility for sharing files to WhatsApp and other apps across Android, iOS, and Web
import * as api from './api';

export interface ShareableItem {
  id?: string;
  name: string;
  uri: string;
  type?: string;
  size?: string;
}

/**
 * Converts a dataUrl or blob URL into a native File object for the Web Share API.
 */
export async function urlToFile(uri: string, filename: string, mimeType?: string): Promise<File> {
  const res = await fetch(uri);
  const blob = await res.blob();
  const mime = mimeType || blob.type || (filename.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
  return new File([blob], filename, { type: mime });
}

export async function resolveFileUri(item: ShareableItem): Promise<string> {
  if (item.uri && !item.uri.startsWith('__lazy__')) {
    return item.uri;
  }
  // Check localStorage uploads cache first for instant resolution
  try {
    const raw = localStorage.getItem('ownly_uploads_v2');
    if (raw) {
      const list = JSON.parse(raw);
      const match = list.find((x: any) => x.id === item.id || x.name === item.name);
      if (match?.uri && !match.uri.startsWith('__lazy__')) {
        return match.uri;
      }
    }
  } catch {}

  if (item.id) {
    try {
      // 5-second timeout on network fetch so it never hangs indefinitely
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
      const fetchPromise = api.getImage(item.id);
      const full = await Promise.race([fetchPromise, timeoutPromise]) as any;
      if (full?.dataUrl) return full.dataUrl;
    } catch (e) {
      console.warn('Failed or timed out resolving lazy image URI:', e);
    }
  }
  return item.uri;
}

/**
 * Attempts native file sharing (Web Share API Level 2).
 * This is supported on Android Chrome, Capacitor Android WebView, iOS Safari, etc.
 * When files are passed, Android launches the system share sheet containing WhatsApp, Gmail, Drive, etc.,
 * and directly attaches the actual file into WhatsApp!
 */
export async function shareFileNative(item: ShareableItem): Promise<{ success: boolean; error?: string; cancelled?: boolean }> {
  try {
    const uri = await resolveFileUri(item);
    if (!uri || uri.startsWith('__lazy__')) {
      return { success: false, error: 'File data is still loading. Please try again.' };
    }

    // Try sharing as an attached file object
    if (typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const fileObj = await urlToFile(uri, item.name, item.type);
        if (navigator.canShare({ files: [fileObj] })) {
          await navigator.share({
            files: [fileObj],
            title: item.name,
            text: `Sharing ${item.name} from OWNLY`,
          });
          return { success: true };
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return { success: false, cancelled: true };
        console.warn('Native files share failed, checking fallback:', err);
      }
    }

    // Fallback: standard navigator.share with http URL if available
    if (typeof navigator !== 'undefined' && navigator.share && uri.startsWith('http')) {
      try {
        await navigator.share({
          title: item.name,
          text: `Check out ${item.name} on OWNLY`,
          url: uri,
        });
        return { success: true };
      } catch (err: any) {
        if (err.name === 'AbortError') return { success: false, cancelled: true };
      }
    }

    return { success: false, error: 'Direct system share not supported on this browser.' };
  } catch (err: any) {
    if (err.name === 'AbortError') return { success: false, cancelled: true };
    return { success: false, error: err.message || 'Share failed' };
  }
}

/**
 * Share directly to WhatsApp via WhatsApp URL or Web.
 * If file cannot be attached via URL (since WhatsApp URL only takes text/link),
 * this opens WhatsApp with the filename and instructions or link, while prompting download.
 */
export function shareToWhatsAppDirect(item: ShareableItem) {
  const text = encodeURIComponent(`*${item.name}* shared from OWNLY app`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;
  window.open(whatsappUrl, '_blank');
}
