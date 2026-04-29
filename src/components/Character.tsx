import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect, G, Defs, ClipPath } from 'react-native-svg';
import { Character } from '../types';

const SKIN: Record<string, string> = {
  light: '#F5D6BA',
  medium: '#E0AC8A',
  tan: '#BC7B5C',
  dark: '#6B4226',
};

const HAIR: Record<string, string> = {
  shortBrown: '#5C3A21',
  shortBlack: '#1A1A1A',
  curly: '#3A2415',
  red: '#B85423',
  blonde: '#E0B96A',
};

export const DEFAULT_CHARACTER: Character = {
  skin: 'medium',
  hair: 'shortBrown',
  headwear: 'yarmulke',
  glasses: 'none',
  mouth: 'smile',
  peiyot: 'none',
};

type Props = {
  character: Character;
  size?: number;
  ringColor?: string;
  teamPrimary?: string;
  teamSecondary?: string;
};

export default function CharacterAvatar({
  character, size = 88, ringColor,
  teamPrimary = '#7C3AED', teamSecondary = '#FBBF24',
}: Props) {
  const s = size;
  const skin = SKIN[character.skin];
  const hair = character.hair === 'none' ? null : HAIR[character.hair];
  const peiyotColor = hair ?? '#3A2415';

  return (
    <Svg width={s} height={s} viewBox="0 0 100 100">
      {ringColor ? (
        <Circle cx={50} cy={50} r={49} fill={ringColor} opacity={0.18} />
      ) : null}
      <Defs>
        <ClipPath id="head">
          <Ellipse cx={50} cy={42} rx={22} ry={24} />
        </ClipPath>
        <ClipPath id="bodyClip">
          <Rect x={0} y={68} width={100} height={32} />
        </ClipPath>
      </Defs>

      {/* Body / footy guernsey */}
      <G clipPath="url(#bodyClip)">
        {/* Torso fill in team primary */}
        <Path
          d="M 14 100 Q 14 76 32 72 L 42 70 Q 50 78 58 70 L 68 72 Q 86 76 86 100 Z"
          fill={teamPrimary}
        />
        {/* Horizontal stripe in team secondary (footy guernsey hoop) */}
        <Rect x={10} y={86} width={80} height={6} fill={teamSecondary} opacity={0.85} />
        {/* Inner shading */}
        <Path
          d="M 14 100 Q 14 76 32 72 L 42 70 Q 50 78 58 70 L 68 72 Q 86 76 86 100"
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth={0.6}
        />
        {/* V-neck */}
        <Path d="M 42 70 L 50 80 L 58 70" stroke={skin} strokeWidth={3} fill="none" strokeLinejoin="round" />
      </G>

      {/* Neck */}
      <Rect x={44} y={62} width={12} height={10} rx={3} fill={skin} />

      {/* Head */}
      <Ellipse cx={50} cy={42} rx={22} ry={24} fill={skin} />

      {/* Ears */}
      <Ellipse cx={26} cy={44} rx={3.2} ry={5} fill={skin} />
      <Ellipse cx={74} cy={44} rx={3.2} ry={5} fill={skin} />

      {/* Peiyot (sidelocks) — in front of ears */}
      {character.peiyot === 'short' && (
        <G fill={peiyotColor}>
          <Path d="M 28 38 Q 26 48 30 54 Q 32 50 31 42 Z" />
          <Path d="M 72 38 Q 74 48 70 54 Q 68 50 69 42 Z" />
        </G>
      )}
      {character.peiyot === 'long' && (
        <G fill={peiyotColor}>
          <Path d="M 28 36 Q 24 50 28 64 Q 32 60 32 42 Z" />
          <Path d="M 72 36 Q 76 50 72 64 Q 68 60 68 42 Z" />
        </G>
      )}
      {character.peiyot === 'curly' && (
        <G fill={peiyotColor}>
          <Circle cx={28} cy={40} r={3.5} />
          <Circle cx={28} cy={46} r={3.5} />
          <Circle cx={29} cy={52} r={3.5} />
          <Circle cx={30} cy={58} r={3.2} />
          <Circle cx={72} cy={40} r={3.5} />
          <Circle cx={72} cy={46} r={3.5} />
          <Circle cx={71} cy={52} r={3.5} />
          <Circle cx={70} cy={58} r={3.2} />
        </G>
      )}

      {/* Hair — on top of head */}
      {hair && character.hair !== 'curly' && (
        <Path
          d="M 28 42 Q 28 22 50 20 Q 72 22 72 42 Q 72 32 60 30 Q 54 26 50 28 Q 46 26 40 30 Q 28 32 28 42 Z"
          fill={hair}
          clipPath="url(#head)"
        />
      )}
      {hair && character.hair === 'curly' && (
        <G>
          <Circle cx={34} cy={26} r={6} fill={hair} />
          <Circle cx={42} cy={22} r={6} fill={hair} />
          <Circle cx={50} cy={20} r={6} fill={hair} />
          <Circle cx={58} cy={22} r={6} fill={hair} />
          <Circle cx={66} cy={26} r={6} fill={hair} />
          <Circle cx={30} cy={34} r={5.5} fill={hair} />
          <Circle cx={70} cy={34} r={5.5} fill={hair} />
        </G>
      )}

      {/* Headwear */}
      {character.headwear === 'yarmulke' && (
        <G>
          <Path d={`M 32 24 Q 50 ${character.hair === 'curly' ? 4 : 12} 68 24 Z`} fill="#1E3A8A" />
          <Path d="M 34 22 Q 50 12 66 22" stroke="#FBBF24" strokeWidth={1} fill="none" />
        </G>
      )}
      {character.headwear === 'capBaseball' && (
        <G>
          {/* Crown — team primary */}
          <Path d="M 28 26 Q 28 14 50 12 Q 72 14 72 26 L 72 30 L 28 30 Z" fill={teamPrimary} />
          {/* Brim — team secondary */}
          <Path d="M 50 30 Q 80 30 86 36 Q 86 38 80 38 Q 60 36 50 36 Z" fill={teamSecondary} />
          {/* Button on top */}
          <Circle cx={50} cy={14} r={1.5} fill={teamSecondary} />
          {/* Front panel highlight */}
          <Path d="M 28 26 Q 50 22 72 26" stroke={teamSecondary} strokeWidth={0.6} fill="none" opacity={0.6} />
        </G>
      )}
      {character.headwear === 'hatBeach' && (
        <G>
          {/* Wide brim */}
          <Ellipse cx={50} cy={32} rx={36} ry={5} fill="#E8C988" />
          {/* Crown */}
          <Path d="M 36 28 Q 36 14 50 12 Q 64 14 64 28 Z" fill="#F2D89C" />
          {/* Hatband */}
          <Path d="M 36 26 Q 50 24 64 26" stroke="#A0522D" strokeWidth={2} fill="none" />
        </G>
      )}
      {character.headwear === 'beanie' && (
        <G>
          {/* Knit crown */}
          <Path d="M 26 30 Q 26 12 50 10 Q 74 12 74 30 Z" fill="#3B2D6E" />
          {/* Cuff */}
          <Path d="M 26 28 L 74 28 L 74 32 L 26 32 Z" fill="#6E5BBE" />
          {/* Pom pom */}
          <Circle cx={50} cy={8} r={4} fill="#F1F5F9" />
          {/* Knit ribs */}
          <Path d="M 40 12 Q 40 24 38 30" stroke="#291F4E" strokeWidth={0.5} fill="none" />
          <Path d="M 60 12 Q 60 24 62 30" stroke="#291F4E" strokeWidth={0.5} fill="none" />
        </G>
      )}

      {/* Eyes */}
      <Circle cx={41} cy={43} r={2.2} fill="#1A1A1A" />
      <Circle cx={59} cy={43} r={2.2} fill="#1A1A1A" />
      <Circle cx={41.6} cy={42.4} r={0.7} fill="#FFF" />
      <Circle cx={59.6} cy={42.4} r={0.7} fill="#FFF" />

      {/* Glasses */}
      {character.glasses === 'round' && (
        <G stroke="#1A1A1A" strokeWidth={1.4} fill="none">
          <Circle cx={41} cy={43} r={5.5} />
          <Circle cx={59} cy={43} r={5.5} />
          <Path d="M 46.5 43 L 53.5 43" />
        </G>
      )}
      {character.glasses === 'square' && (
        <G stroke="#1A1A1A" strokeWidth={1.4} fill="none">
          <Rect x={35} y={38.5} width={11} height={9} rx={1.5} />
          <Rect x={54} y={38.5} width={11} height={9} rx={1.5} />
          <Path d="M 46 43 L 54 43" />
        </G>
      )}
      {character.glasses === 'aviator' && (
        <G stroke="#FBBF24" strokeWidth={1.4} fill="rgba(251,191,36,0.25)">
          <Path d="M 34 40 Q 34 50 42 50 Q 48 50 48 42 Q 48 38 42 38 Q 34 38 34 40 Z" />
          <Path d="M 52 42 Q 52 38 58 38 Q 66 38 66 40 Q 66 50 58 50 Q 52 50 52 42 Z" />
          <Path d="M 48 42.5 L 52 42.5" />
        </G>
      )}

      {/* Mouth */}
      {character.mouth === 'smile' && (
        <Path d="M 42 54 Q 50 60 58 54" stroke="#7A2A2A" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      )}
      {character.mouth === 'grin' && (
        <G>
          <Path d="M 41 53 Q 50 62 59 53 Z" fill="#7A2A2A" />
          <Path d="M 43 55 Q 50 56 57 55" stroke="#FFF" strokeWidth={1.2} fill="none" />
        </G>
      )}
      {character.mouth === 'smirk' && (
        <Path d="M 43 56 Q 52 56 57 53" stroke="#7A2A2A" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      )}
      {character.mouth === 'surprised' && (
        <Ellipse cx={50} cy={56} rx={2.4} ry={3} fill="#7A2A2A" />
      )}
    </Svg>
  );
}

export const CHARACTER_OPTIONS = {
  skin: ['light', 'medium', 'tan', 'dark'] as const,
  hair: ['shortBrown', 'shortBlack', 'curly', 'red', 'blonde', 'none'] as const,
  headwear: ['yarmulke', 'capBaseball', 'hatBeach', 'beanie', 'none'] as const,
  glasses: ['none', 'round', 'square', 'aviator'] as const,
  mouth: ['smile', 'grin', 'smirk', 'surprised'] as const,
  peiyot: ['none', 'short', 'long', 'curly'] as const,
};

export const OPTION_LABELS: Record<string, string> = {
  light: 'Light', medium: 'Medium', tan: 'Tan', dark: 'Dark',
  shortBrown: 'Short brown', shortBlack: 'Short black', curly: 'Curly', red: 'Red', blonde: 'Blonde', none: 'None',
  yarmulke: 'Yarmulke', capBaseball: 'Cap', hatBeach: 'Beach hat', beanie: 'Beanie',
  round: 'Round', square: 'Square', aviator: 'Aviator',
  smile: 'Smile', grin: 'Grin', smirk: 'Smirk', surprised: 'Surprised',
  short: 'Short', long: 'Long',
};
