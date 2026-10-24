import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Txt } from './Txt';

const PALETTES: [string, string][] = [
  ['#22C55E', '#06B6D4'],
  ['#F97316', '#F43F5E'],
  ['#8B5CF6', '#EC4899'],
  ['#3B82F6', '#06B6D4'],
  ['#EAB308', '#F97316'],
  ['#14B8A6', '#6366F1'],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

export function Avatar({ name, url, size = 44 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <LinearGradient
      colors={PALETTES[hash(name) % PALETTES.length]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Txt color="#fff" weight="800" style={{ fontSize: size * 0.38 }}>
        {initials(name)}
      </Txt>
    </LinearGradient>
  );
}
