import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButtons } from '../components/AuthButtons';
import { Text } from '../components/ui';
import { space, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';

export function AuthScreen() {
  const th = useTheme(); const { t } = useI18n(); const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: th.bg, paddingTop: insets.top + space.huge, paddingBottom: insets.bottom + space.xl, paddingHorizontal: space.xl, justifyContent: 'space-between' }}>
      <View style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.lg }}>
          {(['yellow', 'pink', 'blue'] as const).map((c, i) => (
            <View key={c} style={{ width: 48, height: 64, borderRadius: 16, backgroundColor: th.note[c], transform: [{ rotate: `${(i - 1) * 8}deg` }] }} />
          ))}
        </View>
        <Text variant="hero">{t('appName')}</Text>
        <Text dim="secondary">{t('tagline')}</Text>
      </View>
      <AuthButtons />
    </View>
  );
}
