/**
 * Browser MediaRecorder wrapper. Returns a blob URL for the captured audio.
 */
export class WebRecorder {
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    const mime =
      MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4'
      : '';
    this.rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    this.rec.ondataavailable = e => { if (e.data.size > 0) this.chunks.push(e.data); };
    this.rec.start();
  }

  stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = this.rec;
      if (!r) return reject(new Error('Recorder not started'));
      r.onstop = () => {
        const blob = new Blob(this.chunks, { type: r.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        r.stream.getTracks().forEach(t => t.stop());
        this.rec = null;
        resolve(url);
      };
      r.stop();
    });
  }

  cancel() {
    const r = this.rec;
    if (!r) return;
    try { r.stop(); } catch {}
    r.stream.getTracks().forEach(t => t.stop());
    this.rec = null;
    this.chunks = [];
  }
}

/** Read a File/Blob as a base64 data URL — survives reload via localStorage. */
export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

/** Fetch a blob/object URL and convert to a persistent data URL. */
export async function uriToDataUrl(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri;
  const res = await fetch(uri);
  const blob = await res.blob();
  return fileToDataUrl(blob);
}
