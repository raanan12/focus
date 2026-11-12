// Stripe-hosted Checkout inside an in-app WebView. Card data is typed on Stripe's page only.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton, Text } from '../components/ui';
import { space, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { supabase } from '../lib/supabase';

type Checkout = { url: string; success_url: string; cancel_url: string };

export function PaywallScreen({ navigation }: { navigation: any }) {
  const th = useTheme(); const { t } = useI18n(); const insets = useSafeAreaInsets();
  const [co, setCo] = useState<Checkout | null>(null);
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setStarting(true);
    const { data, error } = await supabase.functions.invoke('create-checkout');
    setStarting(false);
    if (error || !data?.url) { Alert.alert(t('error'), t('retry')); return; }
    setCo(data as Checkout);
  };

  useEffect(() => () => {}, []);

  if (!co) {
    return (
      <View style={{ flex: 1, backgroundColor: th.bg, padding: space.xl, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xl, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'flex-end' }}><IconButton name="close" label={t('cancel')} onPress={() => navigation.goBack()} /></View>
        <View style={{ gap: space.md }}>
          <Text style={{ fontSize: 56, lineHeight: 72 }}>✨</Text>
          <Text variant="hero">{t('paywallTitle')}</Text>
          <Text dim="secondary">{t('paywallBody')}</Text>
          <Text strong style={{ marginTop: space.lg }}>{t('priceLine')}</Text>
          <Text variant="caption" dim="tertiary">{t('securePayment')}</Text>
        </View>
        <Button title={t('subscribe')} loading={starting} onPress={start} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: th.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.sm }}>
        <IconButton name="close" label={t('cancel')} onPress={() => navigation.goBack()} />
        <Text variant="caption" dim="tertiary">🔒 Stripe</Text>
        <View style={{ width: 44 }} />
      </View>
      <WebView
        source={{ uri: co.url }}
        originWhitelist={['https://*']}
        javaScriptEnabled domStorageEnabled setSupportMultipleWindows={false} mixedContentMode="never"
        onLoadStart={() => setLoading(true)} onLoadEnd={() => setLoading(false)}
        onShouldStartLoadWithRequest={(req) => {
          if (req.url.startsWith(co.success_url)) { navigation.goBack(); return false; }   // webhook updates our DB; Settings/Home re-read access on focus
          if (req.url.startsWith(co.cancel_url)) { navigation.goBack(); return false; }
          return req.url.startsWith('https://') || req.url === 'about:blank';             // never load http/intent/custom schemes
        }}
        style={{ flex: 1, backgroundColor: th.bg }}
      />
      {loading && <View pointerEvents="none" style={{ position: 'absolute', top: '50%', alignSelf: 'center' }}><ActivityIndicator /></View>}
    </View>
  );
}
