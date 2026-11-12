import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, Input, Sheet, Text } from './ui';
import { radius, space, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { INVITE_BASE_URL, supabase } from '../lib/supabase';
import { store, useStore } from '../lib/store';
import type { Note } from '../lib/types';

type Invite = { id: string; invited_email: string | null; uses: number; max_uses: number; expires_at: string };

export function ShareSheet({ note, me, myName, visible, onClose }: { note: Note; me: string; myName: string; visible: boolean; onClose: () => void }) {
  const th = useTheme(); const { t } = useI18n();
  const members = useStore((s) => s.members[note.id] ?? []);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const isOwner = note.owner_id === me;

  const loadInvites = useCallback(async () => {
    const { data } = await supabase.rpc('list_note_invites', { p_note_id: note.id });
    setInvites((data as Invite[]) ?? []);
  }, [note.id]);
  useEffect(() => { if (visible) { setLink(null); setCopied(false); void loadInvites(); } }, [visible, loadInvites]);

  const makeLink = async (forEmail?: string): Promise<string | null> => {
    if (link && !forEmail) return link;
    setBusy(true);
    const { data, error } = await supabase.rpc('create_invite', { p_note_id: note.id, p_max_uses: 5, p_email: forEmail ?? null });
    setBusy(false);
    if (error || !data) { Alert.alert(t('error'), error?.message ?? ''); return null; }
    const url = `${INVITE_BASE_URL}/join/${data}`;
    if (!forEmail) setLink(url);
    void loadInvites();
    return url;
  };
  const text = (url: string) => t('inviteText', { name: myName, title: note.title || t('untitled'), link: url });

  const copy = async () => { const u = await makeLink(); if (!u) return; await Clipboard.setStringAsync(u); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const whatsapp = async () => {
    const u = await makeLink(); if (!u) return;
    const msg = encodeURIComponent(text(u));
    try { await Linking.openURL(`whatsapp://send?text=${msg}`); } catch { await Linking.openURL(`https://wa.me/?text=${msg}`); }
  };
  const mail = async () => {
    const addr = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(addr)) return;
    const u = await makeLink(addr); if (!u) return;
    setEmail('');
    await Linking.openURL(`mailto:${encodeURIComponent(addr)}?subject=${encodeURIComponent(t('inviteSubject'))}&body=${encodeURIComponent(text(u))}`);
  };
  const revoke = async (id: string) => { await supabase.rpc('revoke_invite', { p_invite_id: id }); void loadInvites(); };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('shareTitle')}>
      <ScrollView contentContainerStyle={{ gap: space.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Button style={{ flex: 1 }} variant="secondary" icon={copied ? 'checkmark' : 'link-outline'} title={copied ? t('linkCopied') : t('copyLink')} loading={busy} onPress={copy} />
          <Button style={{ flex: 1 }} variant="secondary" icon="logo-whatsapp" title={t('whatsapp')} onPress={whatsapp} />
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <Input value={email} onChangeText={setEmail} placeholder={t('email')} keyboardType="email-address" autoCapitalize="none"
            style={{ flex: 1, backgroundColor: th.surface, borderRadius: radius.pill, paddingHorizontal: space.lg, minHeight: 48 }} />
          <Button style={{ minHeight: 48, paddingHorizontal: space.lg }} icon="mail-outline" title={t('emailInvite')} onPress={mail} disabled={!/^\S+@\S+\.\S+$/.test(email.trim())} />
        </View>
        <Text variant="caption" dim="tertiary">{t('inviteValid')}</Text>

        <Text strong style={{ marginTop: space.sm }}>{t('partners')}</Text>
        {members.map((m) => (
          <View key={m.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 }}>
            <Avatar id={m.user_id} name={m.display_name || '?'} size={36} />
            <View style={{ flex: 1 }}>
              <Text>{m.user_id === me ? t('you') : m.display_name || '—'}</Text>
              {m.role === 'owner' && <Text variant="caption" dim="tertiary">{t('owner')}</Text>}
            </View>
            {isOwner && m.user_id !== me && (
              <Pressable accessibilityLabel={t('remove')} hitSlop={8} onPress={() => store.removeMember(note.id, m.user_id)}>
                <Ionicons name="close-circle-outline" size={24} color={th.textSecondary} />
              </Pressable>
            )}
          </View>
        ))}
        {invites.map((i) => (
          <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: th.textTertiary, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="time-outline" size={18} color={th.textTertiary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1}>{i.invited_email ?? t('copyLink')}</Text>
              <Text variant="caption" dim="tertiary">{t('pendingJoin')}</Text>
            </View>
            <Pressable accessibilityLabel={t('revoke')} hitSlop={8} onPress={() => revoke(i.id)}>
              <Ionicons name="close-circle-outline" size={24} color={th.textSecondary} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}
