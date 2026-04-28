/**
 * Hidden WebView that loads a teacher audio file, decodes it via Web Audio API,
 * runs autocorrelation pitch detection at 50ms intervals, and posts the result
 * back as { pitchCurve: number[], duration: number }.
 *
 * Render it invisible, wait for onPitchReady, then unmount it.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';

type Props = {
  audioUri: string;
  onPitchReady: (curve: number[], durationMs: number) => void;
  onError: (msg: string) => void;
};

export default function PitchExtractor({ audioUri, onPitchReady, onError }: Props) {
  const [base64, setBase64] = React.useState<string | null>(null);

  React.useEffect(() => {
    FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 })
      .then(setBase64)
      .catch(e => onError(e?.message ?? 'Could not read audio file'));
  }, [audioUri]);

  if (!base64) return null;

  // Detect audio MIME type from URI
  const ext = audioUri.split('.').pop()?.toLowerCase() ?? 'm4a';
  const mime = ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : 'audio/mp4';

  const html = `<!DOCTYPE html><html><body><script>
  (async () => {
    try {
      const b64 = ${JSON.stringify(base64)};
      const mime = ${JSON.stringify(mime)};
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = await ctx.decodeAudioData(bytes.buffer);
      const samples = buffer.getChannelData(0);
      const sr = buffer.sampleRate;
      const durationMs = Math.round(buffer.duration * 1000);
      const hopMs = 50;
      const hopSamples = Math.round(sr * hopMs / 1000);
      const windowSamples = Math.round(sr * 0.08); // 80ms window

      const pitchCurve = [];

      for (let offset = 0; offset + windowSamples < samples.length; offset += hopSamples) {
        const frame = samples.slice(offset, offset + windowSamples);
        const hz = yin(frame, sr);
        pitchCurve.push(hz);
      }

      // Median smooth to remove octave jumps and noise (window=5)
      const smoothed = medianSmooth(pitchCurve, 5);

      window.ReactNativeWebView.postMessage(JSON.stringify({ pitchCurve: smoothed, durationMs }));
      ctx.close();
    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ error: e.message }));
    }
  })();

  // YIN pitch detection algorithm
  function yin(samples, sr) {
    const W = samples.length;
    const half = Math.floor(W / 2);
    const threshold = 0.1;

    // Step 1: difference function
    const diff = new Float32Array(half);
    for (let tau = 1; tau < half; tau++) {
      let sum = 0;
      for (let j = 0; j < half; j++) {
        const d = samples[j] - samples[j + tau];
        sum += d * d;
      }
      diff[tau] = sum;
    }

    // Step 2: cumulative mean normalised difference
    const cmnd = new Float32Array(half);
    cmnd[0] = 1;
    let runSum = 0;
    for (let tau = 1; tau < half; tau++) {
      runSum += diff[tau];
      cmnd[tau] = runSum === 0 ? 0 : diff[tau] * tau / runSum;
    }

    // Step 3: absolute threshold — find first dip below threshold
    let tau = 2;
    while (tau < half) {
      if (cmnd[tau] < threshold) {
        while (tau + 1 < half && cmnd[tau + 1] < cmnd[tau]) tau++;
        break;
      }
      tau++;
    }

    if (tau === half || cmnd[tau] >= 0.5) return 0; // unvoiced / silence

    // Step 4: parabolic interpolation for sub-sample accuracy
    const x0 = tau < 1 ? tau : tau - 1;
    const x2 = tau + 1 < half ? tau + 1 : tau;
    let betterTau;
    if (x0 === tau) {
      betterTau = cmnd[tau] <= cmnd[x2] ? tau : x2;
    } else if (x2 === tau) {
      betterTau = cmnd[tau] <= cmnd[x0] ? tau : x0;
    } else {
      const s0 = cmnd[x0], s1 = cmnd[tau], s2 = cmnd[x2];
      betterTau = tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    }

    return sr / betterTau;
  }

  // Median filter — removes octave-jump spikes and noise
  function medianSmooth(curve, w) {
    const half = Math.floor(w / 2);
    return curve.map((_, i) => {
      const slice = curve
        .slice(Math.max(0, i - half), Math.min(curve.length, i + half + 1))
        .filter(v => v > 0);
      if (!slice.length) return 0;
      slice.sort((a, b) => a - b);
      return slice[Math.floor(slice.length / 2)];
    });
  }
  <\/script></body></html>`;

  return (
    <WebView
      style={styles.hidden}
      originWhitelist={['*']}
      source={{ html }}
      onMessage={e => {
        try {
          const data = JSON.parse(e.nativeEvent.data);
          if (data.error) { onError(data.error); return; }
          onPitchReady(data.pitchCurve, data.durationMs);
        } catch {
          onError('Failed to parse pitch data');
        }
      }}
      javaScriptEnabled
    />
  );
}

const styles = StyleSheet.create({
  hidden: { width: 0, height: 0, opacity: 0, position: 'absolute' },
});
