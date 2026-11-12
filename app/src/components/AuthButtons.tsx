import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Input, Text } from './ui';
import { radius, space, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';

export function AuthButtons() {
  const th = useTheme(); const { t } = useI18n(); const auth = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [email, setEmail] = useState(''); const [sentTo, setSentTo] = useState<string | null>(null); const [code, setCode] = useState('');

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') Alert.alert(t('error'), e?.message ?? '');
    } finally { setBusy(null); }
  };

  if (sentTo) {
    return (
      <View style={{ gap: space.lg }}>
        <Text dim="secondary">{t('codeSent', { email: sentTo })}</Text>
        <Input value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder={t('code')}
          keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6}
          style={{ backgroundColor: th.surface, borderRadius: radius.md, padding: space.lg, fontSize: 22, letterSpacing: 6 }} />
        <Button title={t('verify')} loading={busy === 'verify'} disabled={code.length !== 6} onPress={() => run('verify', () => auth.verifyCode(sentTo, code))} />
        <Button title={t('back')} variant="ghost" onPress={() => { setSentTo(null); setCode(''); }} />
      </View>
    );
  }

  return (
    <View style={{ gap: space.md }}>
      <Button title={t('signInGoogle')} icon="logo-google" loading={busy === 'google'} onPress={() => run('google', auth.signInGoogle)} />
      {auth.appleAvailable && <Button title={t('signInApple')} icon="logo-apple" variant="secondary" loading={busy === 'apple'} onPress={() => run('apple', auth.signInApple)} />}
      <Text variant="caption" dim="tertiary" style={{ textAlign: 'center' }}>{t('or')}</Text>
      <Input value={email} onChangeText={setEmail} placeholder={t('email')} keyboardType="email-address" autoCapitalize="none"
        autoComplete="email" textContentType="emailAddress"
        style={{ backgroundColor: th.surface, borderRadius: radius.md, padding: space.lg }} />
      <Button title={t('sendCode')} variant="secondary" loading={busy === 'otp'} disabled={!/^\S+@\S+\.\S+$/.test(email.trim())}
        onPress={() => run('otp', async () => { await auth.sendCode(email); setSentTo(email.trim().toLowerCase()); })} />
    </View>
  );
}
