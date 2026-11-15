import { useColorScheme } from 'react-native';
import { createContext, useContext } from 'react';

export const NOTE_COLORS = [
  'yellow', 'lemon', 'amber', 'orange', 'peach', 'red',
  'rose', 'pink', 'magenta', 'purple', 'violet', 'indigo',
  'blue', 'sky', 'cyan', 'teal', 'mint', 'green',
  'lime', 'olive', 'sand', 'brown', 'gray', 'slate',
] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];
/** The original six, used when a new note picks a random color. */
export const DEFAULT_NOTE_COLORS: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'];

const noteLight: Record<NoteColor, string> = {
  yellow: '#FFF1A8', lemon: '#F4F6AE', amber: '#FFE0A3', orange: '#FFDDBA', peach: '#FFD6C4', red: '#FFC9C9',
  rose: '#FFC2D1', pink: '#FFD3DF', magenta: '#F5C2E7', purple: '#E3D6FF', violet: '#D2C9FF', indigo: '#C5CBFF',
  blue: '#CFE5FF', sky: '#C2EBFF', cyan: '#BFF3F5', teal: '#BDEFE0', mint: '#C8F5DA', green: '#CDEFD3',
  lime: '#E0F2B4', olive: '#E2E3AF', sand: '#EADFCB', brown: '#E3CDBB', gray: '#E3E4E8', slate: '#D3DAE6',
};
export type Theme = {
  dark: boolean;
  bg: string;
  text: string;
  textSecondary: string;   // ~65% opacity of text
  textTertiary: string;    // ~45%
  hairline: string;
  surface: string;         // sheets / inputs
  primary: string;         // the black FAB (white in dark)
  onPrimary: string;
  accent: string;          // blue dot / links
  danger: string;
  note: Record<NoteColor, string>;
};

export const lightTheme: Theme = {
  dark: false, bg: '#EDF3F7', text: '#1D3146', textSecondary: 'rgba(29,49,70,0.68)',
  textTertiary: 'rgba(29,49,70,0.44)', hairline: 'rgba(29,49,70,0.1)', surface: '#FFFFFF',
  primary: '#2C87A8', onPrimary: '#FFFFFF', accent: '#2C87A8', danger: '#E5484D', note: noteLight,
};
export const darkTheme: Theme = {
  dark: true, bg: '#1D3146', text: '#F2F7FA', textSecondary: 'rgba(242,247,250,0.7)',
  textTertiary: 'rgba(242,247,250,0.44)', hairline: 'rgba(242,247,250,0.1)', surface: '#2B415A',
  primary: '#4DD0D6', onPrimary: '#12263A', accent: '#4DD0D6', danger: '#FF6B70', note: noteLight,
};

// 8-point grid
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 };
export const radius = { md: 16, lg: 24, pill: 999 };
// max 4 sizes, 2 weights
export const font = { caption: 13, body: 16, title: 22, hero: 32 };

export const ThemeContext = createContext<Theme>(lightTheme);
export const useTheme = () => useContext(ThemeContext);

const whiteNotes = Object.fromEntries(NOTE_COLORS.map((c) => [c, '#FFFFFF'])) as Record<NoteColor, string>;

/**
 * In dark mode notes are plain white paper on the navy app background, so everything drawn ON a note
 * uses the light palette's dark ink. Wrap note surfaces in ThemeContext.Provider with this theme.
 * (The real dark theme keeps the pastel colors so the color picker swatches stay recognisable.)
 */
export function noteTheme(th: Theme): Theme {
  if (!th.dark) return th;
  return { ...lightTheme, dark: false, bg: th.bg, surface: '#F1F4F8', note: whiteNotes };
}

/** A stronger tone of a note's color — the small marker that keeps color-coding visible on white notes. */
export function noteAccent(color: NoteColor): string {
  const hex = noteLight[color].slice(1);
  const ch = [0, 2, 4].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.72));
  return `rgb(${ch[0]}, ${ch[1]}, ${ch[2]})`;
}

export function resolveTheme(pref: 'auto' | 'light' | 'dark', system: ReturnType<typeof useColorScheme>): Theme {
  if (pref === 'light') return lightTheme;
  if (pref === 'dark') return darkTheme;
  return system === 'dark' ? darkTheme : lightTheme;
}

// Distinct colors for the people in ONE note: each member gets the next color in join order, so two
// partners never share a color (up to 12; the member limit is 20, after that colors repeat).
const memberPalette = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#EC407A', '#6D4C41', '#F9A825', '#3949AB', '#7CB342', '#546E7A'];
export function memberColors(members: { user_id: string; joined_at?: string }[]): Record<string, string> {
  const order = [...members].sort((a, b) => (a.joined_at ?? '').localeCompare(b.joined_at ?? '') || a.user_id.localeCompare(b.user_id));
  const out: Record<string, string> = {};
  order.forEach((m, i) => { out[m.user_id] = memberPalette[i % memberPalette.length]; });
  return out;
}

// Fallback: stable avatar color per user id (used when the user isn't in the note's member list)
const avatarPalette = ['#FF8A65', '#4DB6AC', '#7986CB', '#F06292', '#FFB74D', '#4FC3F7', '#9CCC65', '#BA68C8'];
export function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return avatarPalette[h % avatarPalette.length];
}
