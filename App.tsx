import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/lib/AuthContext';
import { colors } from './src/tokens';

// Fonts (Barlow/Inter/Space Mono) are embedded natively in
// android/app/src/main/assets/fonts — React Native resolves each fontFamily
// (e.g. 'Barlow-Black') to the matching TTF. No runtime loading, no blank gate.

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg.base, card: colors.bg.base },
};

// Turns a silent blank screen into a visible, readable error — uses system font
// (fontWeight, not fontFamily) so it renders even if anything goes wrong.
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: unknown) {
    console.error('App crash:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0E121A', padding: 24, paddingTop: 80 }}>
          <Text style={{ color: '#FC574E', fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
            Something broke on startup
          </Text>
          <ScrollView style={{ flex: 1 }}>
            <Text style={{ color: '#F0F0F0', fontSize: 13, lineHeight: 19 }}>
              {String(this.state.error?.stack ?? this.state.error)}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <NavigationContainer theme={navTheme}>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
