import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { PrefsProvider } from './src/lib/prefs';
import { AuthProvider, useAuth } from './src/lib/auth';
import { useTheme } from './src/lib/theme';
import { useI18n } from './src/lib/i18n';
import { INVITE_BASE_URL } from './src/lib/supabase';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { NoteScreen } from './src/screens/NoteScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { JoinScreen } from './src/screens/JoinScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [Linking.createURL('/'), 'focus://', ...(INVITE_BASE_URL ? [INVITE_BASE_URL] : [])],
  config: { screens: { Join: 'join/:token' } },
};

function Root() {
  const { session, loading } = useAuth();
  const th = useTheme(); const { rtl } = useI18n();
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: th.bg }}><ActivityIndicator /></View>;
  return (
    <NavigationContainer linking={linking} direction={rtl ? 'rtl' : 'ltr'} theme={{ ...(th.dark ? DarkTheme : DefaultTheme), colors: { ...(th.dark ? DarkTheme : DefaultTheme).colors, background: th.bg } }}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: rtl ? 'slide_from_left' : 'slide_from_right' }}>
        {session ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Note" component={NoteScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
        <Stack.Screen name="Join" component={JoinScreen} />
      </Stack.Navigator>
      <StatusBar style={th.dark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PrefsProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </PrefsProvider>
    </SafeAreaProvider>
  );
}
