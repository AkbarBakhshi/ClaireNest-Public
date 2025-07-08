import { ConfigContext, ExpoConfig } from "expo/config";

// Replace these with your EAS project ID and project slug.
// You can find them at https://expo.dev/accounts/[account]/projects/[project].
const EAS_PROJECT_ID = "f3ea8169-d8ee-4ef1-bd90-ba5492e6eada";
const PROJECT_SLUG = "clairenest";
const OWNER = "akbar89";

// App production config
const APP_NAME = "ClaireNest";
const BUNDLE_IDENTIFIER = "com.akbar89.clairenest";
const PACKAGE_NAME = "com.akbar89.clairenest";
const ICON = "./assets/icons/icon.png";
const ADAPTIVE_ICON = "./assets/icons/adaptive-icon.png";
const SCHEME = "app-scheme";

const IS_DEV = process.env.EXPO_PUBLIC_APP_ENV === "development";
const IS_PREVIEW = process.env.EXPO_PUBLIC_APP_ENV === "preview";

const getAndroidGoogleServicesFile = () => {
  if (IS_DEV) {
    return process.env.GOOGLE_SERVICES_JSON ?? "./google-services-dev.json";
  }

  if (IS_PREVIEW) {
    return process.env.GOOGLE_SERVICES_JSON ?? "./google-services-preview.json";
  }

  return process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json";
};

const getIosGoogleServicesFile = () => {
  if (IS_DEV) {
    return process.env.IOS_SERVICES_PLIST ?? "./GoogleService-Info-dev.plist";
  }

  if (IS_PREVIEW) {
    return (
      process.env.IOS_SERVICES_PLIST ?? "./GoogleService-Info-preview.plist"
    );
  }

  return process.env.IOS_SERVICES_PLIST ?? "./GoogleService-Info.plist";
};

export default ({ config }: ConfigContext): ExpoConfig => {
  console.log("⚙️ Building app for environment:", process.env.EXPO_PUBLIC_APP_ENV);
  const {
    name,
    bundleIdentifier,
    icon,
    adaptiveIcon,
    packageName,
    scheme,
    iosUrlScheme,
  } = getDynamicAppConfig(
    (process.env.EXPO_PUBLIC_APP_ENV as "development" | "preview" | "production") ??
      "development"
  );

  return {
    ...config,
    name: name,
    version: "1.0.2",
    slug: PROJECT_SLUG, // Must be consistent across all environments.
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    icon: icon,
    scheme: scheme,
    ios: {
      supportsTablet: true,
      bundleIdentifier: bundleIdentifier,
      googleServicesFile: getIosGoogleServicesFile(),
      usesAppleSignIn: true,
      userInterfaceStyle: "automatic",
      associatedDomains: [
        "applinks:clairenest.com",
        "applinks:www.clairenest.com",
      ],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      icon: {
        dark: "./assets/icons/ios-dark.png",
        light: "./assets/icons/ios-light.png",
        tinted: "./assets/icons/ios-tinted.png",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: adaptiveIcon,
        monochromeImage: adaptiveIcon,
        backgroundColor: "#ffffff",
      },
      package: packageName,
      googleServicesFile: getAndroidGoogleServicesFile(),
      userInterfaceStyle: "automatic",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            { scheme: "https", host: "clairenest.com", pathPrefix: "/invite" },
            {
              scheme: "https",
              host: "www.clairenest.com",
              pathPrefix: "/invite",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    updates: {
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: EAS_PROJECT_ID,
      },
      firebaseDebugTokens: {
        android: process.env.FIREBASE_APP_CHECK_ANDROID_TOKEN,
        ios: process.env.FIREBASE_APP_CHECK_IOS_TOKEN,
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/icons/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme,
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/icons/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            image: "./assets/icons/splash-icon.png",
            backgroundColor: "#111417",
          },
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icons/icon.png",
          color: "#ffffff",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "We request your permission to access the camera and photo library on your device. This allows you to take photos and select existing photos to upload. Your photos will only be used within the app.",
        },
      ],
      [
        "@sentry/react-native/expo",
        {
          organization: "clairenest",
          project: "clairenest",
          url: "https://sentry.io/",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    owner: OWNER,
  };
};

// Dynamically configure the app based on the environment.
// Update these placeholders with your actual values.
export const getDynamicAppConfig = (
  environment: "development" | "preview" | "production"
) => {
  if (environment === "production") {
    return {
      name: APP_NAME,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      packageName: PACKAGE_NAME,
      icon: ICON,
      adaptiveIcon: ADAPTIVE_ICON,
      scheme: SCHEME,
      iosUrlScheme:
        "com.googleusercontent.apps.311307542872-brgddhl3ogabej99d2n6me8etfup4r97",
    };
  }

  if (environment === "preview") {
    return {
      name: `${APP_NAME} Preview`,
      bundleIdentifier: `${BUNDLE_IDENTIFIER}.preview`,
      packageName: `${PACKAGE_NAME}.preview`,
      icon: "./assets/icons/icon.png",
      adaptiveIcon: "./assets/icons/adaptive-icon.png",
      scheme: `${SCHEME}-prev`,
      iosUrlScheme:
        "com.googleusercontent.apps.726263899456-nfpmks6slj42as4s7454ggo8r2jabf2u",
    };
  }

  return {
    name: `${APP_NAME} Development`,
    bundleIdentifier: `${BUNDLE_IDENTIFIER}.dev`,
    packageName: `${PACKAGE_NAME}.dev`,
    icon: "./assets/icons/icon.png",
    adaptiveIcon: "./assets/icons/adaptive-icon.png",
    scheme: `${SCHEME}-dev`,
    iosUrlScheme:
      "com.googleusercontent.apps.547978928012-rt4h4p2pjhvs6ukj3sm2sinrhftn7gvr",
  };
};
