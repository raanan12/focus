import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NOTE_COLORS, NoteColor, space, useTheme } from '../lib/theme';

const PER_ROW = 6;

export function ColorPicker({ value, onPick }: { value: NoteColor; onPick: (c: NoteColor) => void }) {
  const th = useTheme();
  const rows: NoteColor[][] = [];
  for (let i = 0; i < NOTE_COLORS.length; i += PER_ROW) rows.push(NOTE_COLORS.slice(i, i + PER_ROW) as NoteColor[]);
  return (
    <View style={{ gap: space.md }}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {row.map((c) => (
            <Pressable key={c} accessibilityRole="button" accessibilityLabel={c} accessibilityState={{ selected: value === c }} onPress={() => onPick(c)}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: th.note[c], alignItems: 'center', justifyContent: 'center',
                borderWidth: value === c ? 2 : 1, borderColor: value === c ? th.text : th.hairline }}>
              {value === c && <Ionicons name="checkmark" size={20} color={th.text} />}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
