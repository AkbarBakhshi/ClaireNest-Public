import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import {
  View,
  Alert as RNAlert,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useEffect, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import auth, { getAuth } from "@react-native-firebase/auth";
import {
  appleAuth,
  AppleButton,
} from "@invertase/react-native-apple-authentication";
import { AtSign } from "@/lib/icons/AtSign";
import { KeySquare } from "@/lib/icons/KeySquare";
import { Eye } from "@/lib/icons/Eye";
import { EyeClosed } from "@/lib/icons/EyeClosed";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
// import FullLogo from "../assets/images/full-logo.svg";
import GoogleContinueButton from "@/components/google-continue-button";
import {
  addUserData,
  getUserData,
  selectUserError,
  selectUserLoading,
} from "@/features/user/userSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import Animated, { FadeIn } from "react-native-reanimated";
import { H1 } from "@/components/ui/typography";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "@/lib/icons/AlertTriangle";
import * as Haptics from "expo-haptics";
import { getItem } from "@/lib/storage";
import * as Sentry from "@sentry/react-native";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

export default function SignIn() {
  const { colorScheme } = useColorScheme();

  const modularAuth = getAuth();

  const isLoadingUser = useAppSelector(selectUserLoading);
  const userError = useAppSelector(selectUserError);

  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [enteredEmail, setEnteredEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") {
      // onCredentialRevoked returns a function that will remove the event listener. useEffect will call this function when the component unmounts
      return appleAuth.onCredentialRevoked(async () => {
        console.warn(
          "If this function executes, User Credentials have been Revoked"
        );
      });
    }
  }, []); // passing in an empty array as the second argument ensures this is only ran once when component mounts initially.

  async function onAppleButtonPress() {
    try {
      // performs login request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        // Note: it appears putting FULL_NAME first is important, see issue #293
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      // get current authentication state for user
      // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user
      );

      // use credentialState response to ensure the user is authenticated
      if (credentialState === appleAuth.State.AUTHORIZED) {
        // user is authenticated
        // console.log(appleAuthRequestResponse)
        // Create a Firebase credential from the response
        const { identityToken, nonce, fullName } = appleAuthRequestResponse;
        const appleCredential = auth.AppleAuthProvider.credential(
          identityToken,
          nonce
        );
        // Sign-in the user with the credential
        const userCredentials = await modularAuth.signInWithCredential(
          appleCredential
        );

        const { uid } = userCredentials.user;

        // Check if the user exists in Firestore
        const result = await dispatch(getUserData(uid)).unwrap();
        const parentId = getItem("inviteParentId");

        if (!result) {
          // User does not exist, create new record
          dispatch(
            addUserData({
              user: userCredentials.user,
              appleFamilyName: fullName?.familyName,
              appleFirstName: fullName?.givenName,
              families: parentId
                ? [{ id: parentId as string, status: "pending" }]
                : [],
            })
          );
        }
        router.replace("/");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Apple login error: ", error);
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();

      if (signInResult.data) {
        // Try the new style of google-sign in result, from v13+ of that module
        let idToken = signInResult.data.idToken;
        if (!idToken) {
          // if you are using older versions of google-signin, try old style result
          idToken = signInResult.data.idToken;
        }
        if (!idToken) {
          throw new Error("No ID token found");
        }

        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(
          signInResult.data.idToken
        );

        // Sign-in the user with the credential
        const userCredentials = await modularAuth.signInWithCredential(
          googleCredential
        );

        const { uid } = userCredentials.user;

        // Check if the user exists in Firestore
        const result = await dispatch(getUserData(uid)).unwrap();
        const parentId = getItem("inviteParentId");
        if (!result) {
          // User does not exist, create new record
          dispatch(
            addUserData({
              user: userCredentials.user,
              families: parentId
                ? [{ id: parentId as string, status: "pending" }]
                : [],
            })
          );
        }

        router.replace("/");
      } else {
        Sentry.captureException(signInResult, {
          tags: {
            location: "sign-in-result-no-data",
          },
        });
        console.error("Google login failed");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        RNAlert.alert("Google login failed", "Please try again.");
      }
    } catch (error) {
      console.log("er: ", error);
      Sentry.captureException(error, {
        tags: {
          location: "sign-in-error",
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      RNAlert.alert("Google login failed", "Please try again.");
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            // operation (eg. sign in) already in progress
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // Android only, play services not available or outdated
            break;
          default:
          // some other error happened
        }
      } else {
        // an error that's not related to google sign in occurred
        Sentry.captureException(error, {
          tags: {
            location: "sign-in-error-unknown",
          },
        });
        RNAlert.alert("Google login failed", "Please try again.");
      }
    }
  };

  const handleSignIn = () => {
    setIsLoading(true);
    modularAuth
      .signInWithEmailAndPassword(enteredEmail, enteredPassword)
      .then(() => {
        // dispatch(setIsAuthenticated(true));
        router.replace("/");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      })
      .catch((error) => {
        // dispatch(setIsAuthenticated(false));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        RNAlert.alert(
          "Authentication failed",
          "Invalid Credentials entered. Please try again."
        );
        // console.error(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        backgroundColor: NAV_THEME[colorScheme].background,
      }}
    >
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.duration(500)} className="pt-4">
          <View className="px-7">
            <H1 className="my-4" style={{ fontFamily: "Quicksand_700Bold" }}>
              Sign in
            </H1>
            <View className="flex-1 flex-row justify-center items-center border border-input rounded-md px-2 mb-4 bg-background">
              <AtSign
                color={NAV_THEME[colorScheme].primary}
                size={15}
                className="px-4"
              />
              <Input
                autoCapitalize="none"
                autoCorrect
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEnteredEmail}
                value={enteredEmail}
                // autoFocus
                placeholder="Email address"
                className="flex-1 py-3 ps-0 pe-3 border-0"
              />
            </View>
            <View className="flex-1 flex-row justify-center items-center border border-input rounded-md px-2 mb-4 bg-background">
              <KeySquare
                color={NAV_THEME[colorScheme].primary}
                size={15}
                className="px-4"
              />
              <Input
                autoCapitalize="none"
                autoCorrect
                keyboardType="default"
                secureTextEntry={!showPassword}
                value={enteredPassword}
                onChangeText={setEnteredPassword}
                placeholder="Password"
                className="flex-1 py-3 ps-0 pe-3 border-0"
              />
              {showPassword ? (
                <Eye
                  onPress={() => setShowPassword(!showPassword)}
                  color={NAV_THEME[colorScheme].primary}
                  size={15}
                  className="px-4"
                />
              ) : (
                <EyeClosed
                  onPress={() => setShowPassword(!showPassword)}
                  color={NAV_THEME[colorScheme].primary}
                  size={15}
                  className="px-4"
                />
              )}
            </View>
            <View className="flex flex-row items-center justify-between">
              <Button
                size="lg"
                variant="secondary"
                onPress={() => {
                  router.back();
                }}
              >
                <Text>Back</Text>
              </Button>
              <Button
                onPress={handleSignIn}
                size="lg"
                disabled={isLoadingUser || isLoading}
              >
                <Text className="dark:text-foreground">Sign in</Text>
              </Button>
            </View>
            <View className="flex flex-row justify-center items-center mt-4">
              <Button
                variant="outline"
                onPress={() => {
                  router.push("/forgot-password");
                }}
              >
                <Text>Forgot password?</Text>
              </Button>
            </View>
            <View className="flex flex-row gap-2 items-center my-8">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="mx-7 text-sm">Or</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>
            {Platform.OS === "ios" && (
              <View className="mb-4">
                <AppleButton
                  buttonStyle={AppleButton.Style.WHITE_OUTLINE}
                  buttonType={AppleButton.Type.CONTINUE}
                  style={{
                    width: "100%", // You must specify a width
                    height: 49, // You must specify a height
                  }}
                  onPress={() => onAppleButtonPress()}
                />
              </View>
            )}
            <GoogleContinueButton
              onPress={handleGoogleSignIn}
              disabled={isLoadingUser || isLoading}
            />
          </View>
          {userError && (
            <Alert
              icon={AlertTriangle}
              variant="destructive"
              className="max-w-xl mt-4"
            >
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>
                Could not sign you in. Please try again later!
              </AlertDescription>
            </Alert>
          )}
          <Modal visible={isLoadingUser || isLoading} transparent={true}>
            <View
              className="flex-1 items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <ActivityIndicator
                size="large"
                color={NAV_THEME[colorScheme].text}
              />
            </View>
          </Modal>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
