# Required dependencies

Run this after `npx create-expo-app calledit --template blank-typescript`:

```bash
npx expo install \
  react-native-reanimated \
  react-native-gesture-handler \
  react-native-safe-area-context \
  react-native-svg \
  expo-haptics \
  expo-font \
  @expo-google-fonts/barlow \
  @expo-google-fonts/inter \
  @expo-google-fonts/space-mono
```

`react-native-svg` is required by `CredRing` (animated Cred Score ring).

Also install `expo-clipboard` (used by `InviteCodeCard` tap-to-copy):

```bash
npx expo install expo-clipboard
```

## Backend (Supabase)

```bash
npm install @supabase/supabase-js react-native-url-polyfill @react-native-async-storage/async-storage
```

Env vars in `.env` (Expo reads `EXPO_PUBLIC_*` automatically):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Server setup: see `backend.md` (migrations + `supabase functions deploy sharpen` +
`supabase secrets set ANTHROPIC_API_KEY=...`).

## Font loading (App.tsx)

```tsx
import { useFonts } from 'expo-font';
import {
  Barlow_400Regular,
  Barlow_600SemiBold,
  Barlow_700Bold,
  Barlow_900Black,
} from '@expo-google-fonts/barlow';
import {
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Barlow-Regular': Barlow_400Regular,
    'Barlow-SemiBold': Barlow_600SemiBold,
    'Barlow-Bold': Barlow_700Bold,
    'Barlow-Black': Barlow_900Black,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'SpaceMono-Regular': SpaceMono_400Regular,
    'SpaceMono-Bold': SpaceMono_700Bold,
  });

  if (!fontsLoaded) return null;
  // ...
}
```

## babel.config.js (for Reanimated)

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // must be last
  };
};
```

## GestureHandler (App.tsx root wrap)

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* navigation / screens */}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```
