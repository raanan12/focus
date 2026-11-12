import { useColorScheme } from 'react-native';
import { createContext, useContext } from 'react';

export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';
export const NOTE_COLORS: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'];

const noteLight: Record<NoteColor, string> = {
  yellow: '#FFF1A8', pink: '#FFD3DF', blue: '#CFE5FF', green: '#CDEFD3', purple: '#E3D6FF', orange: '#FFDDBA',
};
const noteDark: Record<NoteColor, string> = {
  yellow: '#4B4320', pink: '#4D2B38', blue: '#243B55', green: '#263F2D', purple: '#383052', orange: '#503622',
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
  dark: false, bg: '#FFFFFF', text: '#111113', textSecondary: 'rgba(17,17,19,0.65)',
  textTertiary: 'rgba(17,17,19,0.42)', hairline: 'rgba(17,17,19,0.08)', surface: '#F4F4F6',
  primary: '#111113', onPrimary: '#FFFFFF', accent: '#2F7BFF', danger: '#E5484D', note: noteLight,
};
export const darkTheme: Theme = {
  dark: true, bg: '#0C0C0E', text: '#F5F5F7', textSecondary: 'rgba(245,245,247,0.68)',
  textTertiary: 'rgba(245,245,247,0.42)', hairline: 'rgba(245,245,247,0.1)', surface: '#1B1B1F',
  primary: '#F5F5F7', onPrimary: '#0C0C0E', accent: '#5B9BFF', danger: '#FF6369', note: noteDark,
};

// 8-point grid
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 };
export const radius = { md: 16, lg: 24, pill: 999 };
// max 4 sizes, 2 weights
export const font = { caption: 13, body: 16, title: 22, hero: 32 };

export const ThemeContext = createContext<Theme>(lightTheme);
export const useTheme = () => useContext(ThemeContext);

export function resolveTheme(pref: 'auto' | 'light' | 'dark', system: ReturnType<typeof useColorScheme>): Theme {
  if (pref === 'light') return lightTheme;
  if (pref === 'dark') return darkTheme;
  return system === 'dark' ? darkTheme : lightTheme;
}

// Stable avatar color per user id
const avatarPalette = ['#FF8A65', '#4DB6AC', '#7986CB', '#F06292', '#FFB74D', '#4FC3F7', '#9CCC65', '#BA68C8'];
export function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return avatarPalette[h % avatarPalette.length];
}
