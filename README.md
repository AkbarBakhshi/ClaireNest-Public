# ClaireNest - Family Calendar & Support App

ClaireNest is a mobile application built with Expo and React Native, designed to help families coordinate care and support for their children. The app provides a system that allows parents and supporters to stay organized and connected.

## Features

- Support for multiple parent accounts
- Role-based access (Parent/Supporter)
- Firebase backend integration
- Secure authentication with Google and Apple Sign-In

## Technical Stack

- Expo
- React Native
- Firebase (Firestore, Storage, Functions)
- Firebase App Check (with specific configuration for Google Sign-In)
- Google Sign-In for authentication
- Apple Sign-In for Authentication (only iOS)

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```

2. Start the app
   ```bash
   npx expo start --dev-client -c  
   ```

3. Choose your development environment:
   - [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
   - [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go) (limited functionality)

Note: This app requires a development build, either locally or through EAS (recommended).

## App Check Configuration

*NOTE ON APP CHECK:*
-------------------------------------------------------------
We have Firebase App Check enabled for all backend services
(Firestore, Storage, Functions, etc) to prevent abuse.

HOWEVER, we are *not* enforcing App Check for "Google Identity for iOS"
in Firebase Authentication settings.

This is because the `@react-native-google-signin/google-signin` library
does not currently send an App Check token to Google's OAuth endpoints.
Enforcing App Check on "Google Identity for iOS" will cause users to get
an `Authorization Error - Error 400: invalid_request` during sign-in.

Once Google/Firebase supports App Check tokens for external identity
providers in React Native, we can re-enable enforcement.

## Planned Features


- Screens and logic for users who are both parents and supporters
- Account switching functionality between parent and supporter roles
- Multiple pushTokens for one account (father and mother use the same account on their device)
