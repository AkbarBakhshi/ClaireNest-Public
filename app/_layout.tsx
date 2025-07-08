import "@/global.css";
import { useEffect, useState } from "react";
import {
  Theme,
  ThemeProvider,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_700Bold,
  Quicksand_500Medium,
} from "@expo-google-fonts/quicksand";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { getItem, removeItem, setItem } from "@/lib/storage";
import { setAndroidNavigationBar } from "@/lib/android-navigation-bar";
import { Provider } from "react-redux";
import { store } from "@/store";
import { PortalHost } from "@rn-primitives/portal";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import CustomToast from "@/components/custom-toast";
import { getAppCheck } from "@/lib/app-check";
import * as Sentry from "@sentry/react-native";
import { getToken } from "@react-native-firebase/app-check";

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "index",
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

if (!__DEV__) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enableNative: true,
    debug: false,
    tracesSampleRate: 0.1,
  });
}

export default function RootLayout() {
  const { colorScheme, isDarkColorScheme, setColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_700Bold,
  });

  useEffect(() => {
    (async () => {
      // Initialize App Check here along with theme setup
      try {
        const appCheckInstance = await getAppCheck();
        const token = await getToken(appCheckInstance);
        // console.log('token', token.token.slice(0, 10));
        // Add a breadcrumb but not a full event for successful initialization
        Sentry.captureMessage("App Check initialized successfully", {
          level: "info",
          tags: { category: "app_check" },
          extra: { token: token.token.slice(0, 10) },
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            location: "app_check_initialization",
          },
        });
      }
      const theme = getItem("theme");
      if (Platform.OS === "web") {
        // Adds the background color to the html element to prevent white background on overscroll.
        document.documentElement.classList.add("bg-background");
      }
      if (!theme) {
        setAndroidNavigationBar(colorScheme);
        setItem("theme", colorScheme);
        setIsColorSchemeLoaded(true);
        return;
      }
      const colorTheme = theme === "dark" ? "dark" : "light";
      setAndroidNavigationBar(colorTheme);
      if (colorTheme !== colorScheme) {
        setColorScheme(colorTheme);

        setIsColorSchemeLoaded(true);
        return;
      }
      setIsColorSchemeLoaded(true);
    })().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen after the fonts have loaded (or an error was returned) and the UI is ready.
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 2000);
    }
  }, [fontsLoaded, fontError]);

  if (!isColorSchemeLoaded) {
    return null;
  }

  // Prevent rendering until the font has loaded or an error was returned
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
      <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
      <Provider store={store}>
        {/* Stack will have different navigation transition with swipe to previous page which did not work for first signin even though I used router.replace() */}
        {/* <Stack
          screenOptions={{
            headerShown: false,
          }}
        />  */}
        <Slot />
        <CustomToast />
        <PortalHost />
      </Provider>
    </ThemeProvider>
  );
}
