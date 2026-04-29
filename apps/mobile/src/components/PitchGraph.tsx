import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';

export type Segment = {
  startSec: number;
  endSec: number;
  score: number; // 0–100
};

type Props = {
  teacherCurve: number[];
  studentCurve: number[];
  segments?: Segment[];
  width: number;
  height: number;
};

const WINDOW = 200;
const HZ_MIN = 80;
const HZ_MAX = 600;
const HOP_SEC = 0.05; // 50ms per frame

function hzToY(hz: number, h: number): number {
  if (hz <= 0) return h;
  const clamped = Math.max(HZ_MIN, Math.min(HZ_MAX, hz));
  const logMin = Math.log2(HZ_MIN);
  const logMax = Math.log2(HZ_MAX);
  return h - ((Math.log2(clamped) - logMin) / (logMax - logMin)) * h;
}

function buildPath(values: number[], w: number, h: number): string {
  const total = Math.min(values.length, WINDOW);
  const xStep = total > 1 ? w / (total - 1) : w;
  let path = '';
  for (let i = 0; i < total; i++) {
    const hz = values[i];
    if (hz <= 0) { path += ''; continue; }
    const x = i * xStep;
    const y = hzToY(hz, h);
    path += path === '' ? `M${x.toFixed(1)},${y.toFixed(1)}` : ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return path;
}

const NOTE_LABELS: { hz: number; label: string }[] = [
  { hz: 165, label: 'E3' },
  { hz: 220, label: 'A3' },
  { hz: 330, label: 'E4' },
  { hz: 440, label: 'A4' },
];

export default function PitchGraph({ teacherCurve, studentCurve, segments, width, height }: Props) {
  const teacherPath = buildPath(teacherCurve, width, height);
  const studentPath = buildPath(studentCurve, width, height);
  const totalSec = teacherCurve.length * HOP_SEC;

  return (
    <View style={[styles.container, { width, height: height + 20 }]}>
      <Svg width={width} height={height}>
        {/* Segment quality bands */}
        {segments?.map((seg, i) => {
          const x = (seg.startSec / totalSec) * width;
          const segW = ((seg.endSec - seg.startSec) / totalSec) * width;
          const fill =
            seg.score >= 70 ? colors.good :
            seg.score >= 45 ? colors.okay :
            colors.bad;
          return (
            <Rect
              key={i}
              x={x} y={0}
              width={segW} height={height}
              fill={fill}
              opacity={0.12}
            />
          );
        })}

        {/* Grid lines */}
        {NOTE_LABELS.map(n => {
          const y = hzToY(n.hz, height);
          return (
            <React.Fragment key={n.label}>
              <Line x1={0} y1={y} x2={width} y2={y} stroke={colors.border} strokeWidth={0.5} strokeDasharray="4,4" />
              <SvgText x={4} y={y - 3} fontSize={9} fill={colors.textDim}>{n.label}</SvgText>
            </React.Fragment>
          );
        })}

        {/* Teacher curve — indigo */}
        {teacherPath ? <Path d={teacherPath} stroke={colors.primary} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}

        {/* Student curve — green */}
        {studentPath ? <Path d={studentPath} stroke={colors.good} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}

        {/* Segment boundary ticks at bottom */}
        {segments?.map((seg, i) => {
          const x = (seg.startSec / totalSec) * width;
          return <Line key={i} x1={x} y1={height - 8} x2={x} y2={height} stroke={colors.border} strokeWidth={1} />;
        })}
      </Svg>

      {/* Time labels under graph */}
      {segments && (
        <View style={[styles.timeRow, { width }]}>
          {segments.map((seg, i) => {
            const left = (seg.startSec / totalSec) * width;
            return (
              <Text key={i} style={[styles.timeLabel, { position: 'absolute', left }]}>
                {Math.round(seg.startSec)}s
              </Text>
            );
          })}
        </View>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Teacher</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.good }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0A1628', borderRadius: 12, overflow: 'hidden' },
  legend: { position: 'absolute', top: 8, right: 8, gap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.textDim, fontSize: 11 },
  timeRow: { height: 18, position: 'relative' },
  timeLabel: { color: colors.textDim, fontSize: 9 },
});
