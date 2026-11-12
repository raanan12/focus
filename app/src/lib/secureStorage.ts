// Supabase session storage backed by the OS keychain / keystore (expo-secure-store).
// SecureStore limits values to ~2KB, so large JSON values are split into chunks.
import * as SecureStore from 'expo-secure-store';

const CHUNK = 1500;
const opts: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const count = await SecureStore.getItemAsync(`${key}.n`, opts);
    if (count === null) return null;
    const parts: string[] = [];
    for (let i = 0; i < Number(count); i++) {
      const p = await SecureStore.getItemAsync(`${key}.${i}`, opts);
      if (p === null) return null;
      parts.push(p);
    }
    return parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    await secureStorage.removeItem(key);
    const n = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < n; i++) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK), opts);
    }
    await SecureStore.setItemAsync(`${key}.n`, String(n), opts);
  },
  async removeItem(key: string): Promise<void> {
    const count = await SecureStore.getItemAsync(`${key}.n`, opts);
    if (count !== null) {
      for (let i = 0; i < Number(count); i++) await SecureStore.deleteItemAsync(`${key}.${i}`, opts);
      await SecureStore.deleteItemAsync(`${key}.n`, opts);
    }
  },
};
