/**
 * Web-native pitch extraction. Decodes audio with Web Audio API and runs YIN
 * directly in the browser — no WebView, no file-system copy.
 */

export async function extractPitch(audioUri: string): Promise<{ pitchCurve: number[]; durationMs: number }> {
  const res = await fetch(audioUri);
  const ab = await res.arrayBuffer();
  const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new Ctx();
  try {
    const buffer = await ctx.decodeAudioData(ab.slice(0));
    const samples = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const durationMs = Math.round(buffer.duration * 1000);
    const hopMs = 50;
    const hopSamples = Math.round((sr * hopMs) / 1000);
    const windowSamples = Math.round(sr * 0.08); // 80ms

    const raw: number[] = [];
    for (let offset = 0; offset + windowSamples < samples.length; offset += hopSamples) {
      raw.push(yin(samples.subarray(offset, offset + windowSamples), sr));
    }
    return { pitchCurve: medianSmooth(raw, 5), durationMs };
  } finally {
    ctx.close();
  }
}

function yin(samples: Float32Array, sr: number): number {
  const W = samples.length;
  const half = Math.floor(W / 2);
  const threshold = 0.1;

  const diff = new Float32Array(half);
  for (let tau = 1; tau < half; tau++) {
    let sum = 0;
    for (let j = 0; j < half; j++) {
      const d = samples[j] - samples[j + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }

  const cmnd = new Float32Array(half);
  cmnd[0] = 1;
  let runSum = 0;
  for (let tau = 1; tau < half; tau++) {
    runSum += diff[tau];
    cmnd[tau] = runSum === 0 ? 0 : (diff[tau] * tau) / runSum;
  }

  let tau = 2;
  while (tau < half) {
    if (cmnd[tau] < threshold) {
      while (tau + 1 < half && cmnd[tau + 1] < cmnd[tau]) tau++;
      break;
    }
    tau++;
  }

  if (tau === half || cmnd[tau] >= 0.5) return 0;

  const x0 = tau < 1 ? tau : tau - 1;
  const x2 = tau + 1 < half ? tau + 1 : tau;
  let betterTau: number;
  if (x0 === tau) betterTau = cmnd[tau] <= cmnd[x2] ? tau : x2;
  else if (x2 === tau) betterTau = cmnd[tau] <= cmnd[x0] ? tau : x0;
  else {
    const s0 = cmnd[x0], s1 = cmnd[tau], s2 = cmnd[x2];
    betterTau = tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }
  return sr / betterTau;
}

function medianSmooth(curve: number[], w: number): number[] {
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
