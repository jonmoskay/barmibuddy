import React from 'react';
import { Platform, View } from 'react-native';

type Props = {
  primary?: string;
  secondary?: string;
};

// Sport-jersey diagonal stripes + comic-book halftone dots.
// 12-year-old coded: stadium energy, not generic blob orbs.
// Web-first: uses CSS gradients via raw <div>s (react-native-web allows it).
export default function BackgroundFX({ primary = '#7C3AED', secondary = '#0EA5E9' }: Props) {
  if (Platform.OS !== 'web') {
    return <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }} />;
  }

  const stripes = `repeating-linear-gradient(135deg, ${hexA(primary, 0.13)} 0 28px, transparent 28px 96px)`;
  const stripesAlt = `repeating-linear-gradient(135deg, ${hexA(secondary, 0.08)} 0 14px, transparent 14px 96px)`;
  const dots = `radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.6px)`;
  const burst = `radial-gradient(circle at 90% 0%, ${hexA(primary, 0.32)} 0%, transparent 55%)`;
  const burstFar = `radial-gradient(circle at 0% 100%, ${hexA(secondary, 0.18)} 0%, transparent 50%)`;

  // @ts-ignore — raw HTML on web
  return (
    <div
      // @ts-ignore
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* Glow burst from corner */}
      {/* @ts-ignore */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `${burst}, ${burstFar}` }} />
      {/* Diagonal jersey hoops */}
      {/* @ts-ignore */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: stripes }} />
      {/* @ts-ignore */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: stripesAlt }} />
      {/* Halftone dots */}
      {/* @ts-ignore */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: dots, backgroundSize: '22px 22px' }} />
      {/* Top-edge highlight bar (jersey collar feel) */}
      {/* @ts-ignore */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 6,
          background: `linear-gradient(90deg, ${hexA(primary, 0.6)}, ${hexA(secondary, 0.7)})`,
        }}
      />
    </div>
  );
}

function hexA(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
