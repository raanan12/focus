// Subscriptions via Apple In-App Purchase / Google Play Billing, managed by RevenueCat.
// The RevenueCat app user id is the Supabase user id; a RevenueCat webhook (Edge Function
// `revenuecat-webhook`) mirrors the entitlement into public.subscriptions, which is what has_access() reads.
import { Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

// Public SDK keys (safe to ship): appl_... for iOS, goog_... for Android.
const API_KEY = (Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY) ?? '';
let configured = false;

/** Store purchases are only available in store builds (iOS / Android) that have a RevenueCat key. */
export const purchasesAvailable = (Platform.OS === 'ios' || Platform.OS === 'android') && API_KEY.length > 0;

function ensureConfigured() {
  if (!purchasesAvailable) return false;
  if (!configured) { Purchases.configure({ apiKey: API_KEY }); configured = true; }
  return true;
}

export async function purchasesLogIn(userId: string) {
  if (!ensureConfigured()) return;
  try { await Purchases.logIn(userId); } catch (e) { console.warn('purchases logIn', e); }
}

export async function purchasesLogOut() {
  if (!configured) return;
  try { await Purchases.logOut(); } catch { /* already anonymous */ }
}

/** The package to sell: the "current" offering's first package (configure it in the RevenueCat dashboard). */
export async function getSubscriptionPackage(): Promise<PurchasesPackage | null> {
  if (!ensureConfigured()) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages[0] ?? null;
}

/** Returns true on success, false if the user cancelled the Apple sheet. Throws on real errors. */
export async function purchase(pkg: PurchasesPackage): Promise<boolean> {
  try { await Purchases.purchasePackage(pkg); return true; }
  catch (e: any) { if (e?.userCancelled) return false; throw e; }
}

export async function restore(): Promise<void> {
  if (!ensureConfigured()) return;
  await Purchases.restorePurchases();
}

export async function manageSubscriptions() {
  if (!ensureConfigured()) return;
  await Purchases.showManageSubscriptions();
}
