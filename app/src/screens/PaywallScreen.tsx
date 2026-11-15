// Apple In-App Purchase paywall (RevenueCat). Apple handles billing, tax, refunds and cancellation.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { Button, IconButton, Text } from '../components/ui';
import { space, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { getSubscriptionPackage, purchase, purchasesAvailable, restore } from '../lib/purchases';

const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

/** The webhook usually lands within a few seconds; wait for it so the UI unlocks without a restart. */
async function waitForAccess(): Promise<boolean> {
  for (let i = 0; i < 10; i++) {
    const { data } = await supabase.rpc('my_access');
    if (data?.status === 'active' || data?.status === 'trialing') return true;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

export function PaywallScreen({ navigation }: { navigation: any }) {
  const th = useTheme(); const { t } = useI18n(); const insets = useSafeAreaInsets();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  useEffect(() => {
    let alive = true;
    getSubscriptionPackage().then((p) => alive && setPkg(p)).catch(() => {}).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const finish = async () => {
    const ok = await waitForAccess();
    if (!ok) Alert.alert(t('purchasePending'));
    navigation.goBack();
  };

  const buy = async () => {
    if (!pkg) return;
    setBusy('buy');
    try { if (await purchase(pkg)) await finish(); }
    catch (e: any) { Alert.alert(t('error'), e?.message ?? t('retry')); }
    finally { setBusy(null); }
  };

  const doRestore = async () => {
    setBusy('restore');
    try { await restore(); await finish(); }
    catch (e: any) { Alert.alert(t('error'), e?.message ?? t('retry')); }
    finally { setBusy(null); }
  };

  const price = pkg?.product.priceString;

  return (
    <View style={{ flex: 1, backgroundColor: th.bg, padding: space.xl, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xl, justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'flex-end' }}><IconButton name="close" label={t('cancel')} onPress={() => navigation.goBack()} /></View>
      <View style={{ gap: space.md }}>
        <Text style={{ fontSize: 56, lineHeight: 72 }}>✨</Text>
        <Text variant="hero">{t('paywallTitle')}</Text>
        <Text dim="secondary">{t('paywallBody')}</Text>
        <Text strong style={{ marginTop: space.lg }}>{price ? t('priceLine', { price }) : loading ? '…' : t('storeUnavailable')}</Text>
        <Text variant="caption" dim="tertiary">{t('securePayment')}</Text>
        {!purchasesAvailable && <Text variant="caption" dim="tertiary">{t('storeOnlyInBuild')}</Text>}
      </View>
      <View style={{ gap: space.md }}>
        {loading ? <ActivityIndicator /> : (
          <Button title={price ? t('subscribeFor', { price }) : t('subscribe')} loading={busy === 'buy'} disabled={!pkg || busy !== null} onPress={buy} />
        )}
        <Button title={t('restorePurchases')} variant="ghost" loading={busy === 'restore'} disabled={!purchasesAvailable || busy !== null} onPress={doRestore} />
        <Text variant="caption" dim="tertiary" style={{ textAlign: 'center' }} onPress={() => Linking.openURL(TERMS_URL)}>{t('termsOfUse')}</Text>
      </View>
    </View>
  );
}
