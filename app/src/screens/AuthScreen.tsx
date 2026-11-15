import React from 'react';
import { Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButtons } from '../components/AuthButtons';
import { Text } from '../components/ui';
import { radius, space, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';

/** Decorative mini note: pastel card with two checklist rows. */
function MiniNote({ color, rotate, lift, done }: { color: string; rotate: string; lift: number; done: boolean }) {
  const th = useTheme();
  const line = (w: number, checked: boolean) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 11, height: 11, borderRadius: 4, borderWidth: 1.5, borderColor: checked ? th.primary : th.textTertiary, backgroundColor: checked ? th.primary : 'transparent' }} />
      <View style={{ width: w, height: 5, borderRadius: 3, backgroundColor: th.textTertiary, opacity: checked ? 0.35 : 0.7 }} />
    </View>
  );
  return (
    <View style={{ width: 88, height: 104, borderRadius: radius.md, backgroundColor: color, padding: space.md, gap: 10,
      transform: [{ rotate }, { translateY: lift }], shadowColor: '#000', shadowOpacity: th.dark ? 0.35 : 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 }}>
      <View style={{ width: 34, height: 6, borderRadius: 3, backgroundColor: th.text, opacity: 0.8 }} />
      {line(38, done)}
      {line(28, false)}
      {line(34, false)}
    </View>
  );
}

export function AuthScreen() {
  const th = useTheme(); const { t } = useI18n(); const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: th.bg, overflow: 'hidden' }}>
      {/* soft brand glow */}
      <View pointerEvents="none" style={{ position: 'absolute', top: -140, alignSelf: 'center', width: 520, height: 520, borderRadius: 260, backgroundColor: th.primary, opacity: th.dark ? 0.1 : 0.12 }} />
      <View pointerEvents="none" style={{ position: 'absolute', top: -20, alignSelf: 'center', width: 280, height: 280, borderRadius: 140, backgroundColor: th.primary, opacity: th.dark ? 0.1 : 0.12 }} />

      <View style={{ flex: 1, paddingTop: insets.top + space.xl, paddingHorizontal: space.xl, alignItems: 'center', justifyContent: 'center', gap: space.xl }}>
        <View style={{ alignItems: 'center', gap: space.md }}>
          <Image source={require('../../assets/logo-mark.png')} accessibilityLabel={t('appName')} resizeMode="contain" style={{ width: 104, height: 104 }} />
          <Text style={{ fontSize: 40, lineHeight: 52, fontWeight: '800', textAlign: 'center' }}>{t('appName')}</Text>
          <Text dim="secondary" style={{ textAlign: 'center', fontSize: 18 }}>{t('tagline')}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: space.lg, direction: 'ltr' }}>
          <MiniNote color={th.note.pink} rotate="-9deg" lift={6} done={false} />
          <View style={{ marginHorizontal: -10, zIndex: 2 }}><MiniNote color={th.note.yellow} rotate="0deg" lift={-6} done /></View>
          <MiniNote color={th.note.blue} rotate="9deg" lift={6} done={false} />
        </View>
      </View>

      <View style={{ paddingHorizontal: space.xl, paddingBottom: insets.bottom + space.xl }}>
        <AuthButtons />
      </View>
    </View>
  );
}
