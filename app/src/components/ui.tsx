import React from 'react';
import {
  ActivityIndicator, Modal, Pressable, StyleProp, StyleSheet, Text as RNText, TextInput as RNTextInput,
  TextInputProps, TextProps, TextStyle, View, ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { avatarColor, font, radius, space, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';

type Variant = 'body' | 'caption' | 'title' | 'hero';
export function Text({ variant = 'body', strong, dim, style, ...p }:
  TextProps & { variant?: Variant; strong?: boolean; dim?: 'secondary' | 'tertiary'; style?: StyleProp<TextStyle> }) {
  const th = useTheme(); const { rtl } = useI18n();
  const color = dim === 'secondary' ? th.textSecondary : dim === 'tertiary' ? th.textTertiary : th.text;
  return (
    <RNText
      {...p}
      style={[{ color, fontSize: font[variant], fontWeight: strong || variant === 'hero' || variant === 'title' ? '700' : '400',
        // 'auto' = start of the writing direction. An explicit 'right' gets mirrored by RN inside an RTL root view.
        textAlign: 'auto', writingDirection: rtl ? 'rtl' : 'ltr',
        lineHeight: Math.round(font[variant] * 1.35) }, style]}
    />
  );
}

export const Input = React.forwardRef<React.ComponentRef<typeof RNTextInput>, TextInputProps & { style?: StyleProp<TextStyle> }>(function Input(props, ref) {
  const th = useTheme(); const { rtl } = useI18n();
  return (
    <RNTextInput
      ref={ref}
      placeholderTextColor={th.textTertiary}
      {...props}
      style={[{ color: th.text, fontSize: font.body, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }, props.style]}
    />
  );
});

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style }:
  { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; icon?: keyof typeof Ionicons.glyphMap;
    loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const th = useTheme();
  const bg = variant === 'primary' ? th.primary : variant === 'danger' ? th.danger : variant === 'secondary' ? th.surface : 'transparent';
  const fg = variant === 'primary' ? th.onPrimary : variant === 'danger' ? '#fff' : th.text;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={title}
      disabled={disabled || loading} onPress={onPress}
      style={({ pressed }) => [{ minHeight: 52, borderRadius: radius.pill, backgroundColor: bg, paddingHorizontal: space.xl,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm,
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon && <Ionicons name={icon} size={20} color={fg} />}
          <RNText style={{ color: fg, fontSize: font.body, fontWeight: '700' }}>{title}</RNText>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ name, onPress, label, color, size = 24 }:
  { name: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string; color?: string; size?: number }) {
  const th = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8}
      style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}>
      <Ionicons name={name} size={size} color={color ?? th.text} />
    </Pressable>
  );
}

export function Avatar({ id, name, size = 28, ring, color }: { id: string; name: string; size?: number; ring?: string; color?: string }) {
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color ?? avatarColor(id),
      alignItems: 'center', justifyContent: 'center', borderWidth: ring ? 2 : 0, borderColor: ring }}>
      <RNText style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.42 }}>{initial}</RNText>
    </View>
  );
}

export function AvatarStack({ people, size = 24, ring, max = 3 }:
  { people: { id: string; name: string; color?: string }[]; size?: number; ring: string; max?: number }) {
  const shown = people.slice(0, max); const extra = people.length - shown.length;
  return (
    <View style={{ flexDirection: 'row' }}>
      {shown.map((p, i) => (
        <View key={p.id} style={{ marginStart: i === 0 ? 0 : -size * 0.35 }}><Avatar id={p.id} name={p.name} color={p.color} size={size} ring={ring} /></View>
      ))}
      {extra > 0 && (
        <View style={{ marginStart: -size * 0.35, width: size, height: size, borderRadius: size / 2, backgroundColor: ring,
          alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: ring }}>
          <RNText style={{ fontSize: size * 0.4, fontWeight: '700', color: '#111' }}>+{extra}</RNText>
        </View>
      )}
    </View>
  );
}

/** Bottom sheet (phone) — tap the scrim to dismiss. */
export function Sheet({ visible, onClose, children, title }:
  { visible: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  const th = useTheme(); const { rtl } = useI18n(); const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, direction: rtl ? 'rtl' : 'ltr', justifyContent: 'flex-end' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} onPress={onClose} accessibilityLabel="Close" />
        <View style={{ backgroundColor: th.bg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
          padding: space.xl, paddingBottom: space.xl + insets.bottom, maxHeight: '88%', gap: space.lg }}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: th.hairline }} />
          {title ? <Text variant="title">{title}</Text> : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function MenuRow({ icon, label, onPress, danger }:
  { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center',
      gap: space.lg, minHeight: 52, opacity: pressed ? 0.5 : 1 })}>
      <Ionicons name={icon} size={22} color={danger ? th.danger : th.text} />
      <Text style={{ color: danger ? th.danger : th.text, flex: 1 }}>{label}</Text>
    </Pressable>
  );
}
