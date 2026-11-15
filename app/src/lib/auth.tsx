import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { purchasesLogIn, purchasesLogOut } from './purchases';
import { store } from './store';

WebBrowser.maybeCompleteAuthSession();

type Auth = {
  session: Session | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  appleAvailable: boolean;
};

const AuthContext = createContext<Auth>(null as unknown as Auth);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      // accept any note shared to this e-mail before it signed up, then start syncing
      void (async () => {
        try { await supabase.rpc('claim_email_invites'); } catch {}
        void purchasesLogIn(session.user.id);
        await store.start(session.user.id);
      })();
    }
    else { store.stop(); void purchasesLogOut(); }
  }, [session?.user?.id]);

  const value: Auth = {
    session, loading, appleAvailable,

    async signInGoogle() {
      const redirectTo = Linking.createURL('auth-callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google', options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data.url) throw error ?? new Error('oauth');
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== 'success') return;
      const code = new URL(res.url).searchParams.get('code');
      if (!code) throw new Error('no code');
      const { error: e2 } = await supabase.auth.exchangeCodeForSession(code);
      if (e2) throw e2;
    },

    async signInApple() {
      const rawNonce = Crypto.randomUUID() + Crypto.randomUUID();
      const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
        nonce: hashed,
      });
      if (!cred.identityToken) throw new Error('no identity token');
      const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken, nonce: rawNonce });
      if (error) throw error;
      // Apple only returns the name on the very first sign-in
      const name = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ');
      if (name && data.user) await supabase.from('profiles').update({ display_name: name.slice(0, 80) }).eq('id', data.user.id);
    },

    async sendCode(email) {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
      if (error) throw error;
    },
    async verifyCode(email, code) {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
      if (error) throw error;
    },

    async signOut() {
      const uid = session?.user.id;
      await supabase.auth.signOut();
      if (uid) await store.clearLocal(uid);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
