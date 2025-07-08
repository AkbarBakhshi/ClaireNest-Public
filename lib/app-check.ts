// @ts-ignore
import { ReactNativeFirebaseAppCheckProvider } from "@react-native-firebase/app-check";
import { getApp } from "@react-native-firebase/app";
import { initializeAppCheck } from "@react-native-firebase/app-check";
import Constants from "expo-constants";

const { firebaseDebugTokens } = Constants.expoConfig?.extra || {};

// Determine if this is a preview build
const isPreview = !__DEV__ && process.env.EXPO_PUBLIC_APP_ENV === 'preview';

const rnfbProvider = new ReactNativeFirebaseAppCheckProvider();
rnfbProvider.configure({
  android: {
    provider: __DEV__ || isPreview ? 'debug' : 'playIntegrity',
    debugToken: firebaseDebugTokens?.android,
  },
  apple: {
    provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
    debugToken: firebaseDebugTokens?.ios,
  },
  web: {
    provider: 'reCaptchaV3',
    siteKey: 'unknown',
  },
});

export const getAppCheck = async () => {
  return initializeAppCheck(getApp(), { provider: rnfbProvider, isTokenAutoRefreshEnabled: true });
};
