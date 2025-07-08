import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import {
  View,
  Alert as RNAlert,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import auth, { getAuth, updateProfile } from "@react-native-firebase/auth";
import { AtSign } from "@/lib/icons/AtSign";
import { KeySquare } from "@/lib/icons/KeySquare";
import { Eye } from "@/lib/icons/Eye";
import { EyeClosed } from "@/lib/icons/EyeClosed";
import {
  AppleButton,
  appleAuth,
} from "@invertase/react-native-apple-authentication";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import GoogleContinueButton from "@/components/google-continue-button";
import {
  addUserData,
  getUserData,
  selectUserError,
  selectUserLoading,
} from "@/features/user/userSlice";
import Animated, { FadeIn } from "react-native-reanimated";
import { H1 } from "@/components/ui/typography";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "@/lib/icons/AlertTriangle";
import * as Haptics from "expo-haptics";
import { CircleX } from "@/lib/icons/CircleX";
import React from "react";
import { getItem } from "@/lib/storage";
import { User } from "@/lib/icons/User";
import * as Sentry from "@sentry/react-native";
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

export default function SignUp() {
  const { colorScheme } = useColorScheme();

  const modularAuth = getAuth();

  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [enteredName, setEnteredName] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [enteredConfirmPassword, setEnteredConfirmPassword] = useState("");
  const [enteredEmail, setEnteredEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isMinLength = enteredPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(enteredPassword);
  const hasLowercase = /[a-z]/.test(enteredPassword);
  const hasNumber = /\d/.test(enteredPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(enteredPassword);

  const isLoadingUser = useAppSelector(selectUserLoading);
  const userError = useAppSelector(selectUserError);

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
      modularAuth
        .signInWithCredential(appleCredential)
        .then(async (userCredentials) => {
          try {
            // If we have a name from Apple, update the user profile
            if (fullName && (fullName.givenName || fullName.familyName)) {
              // Create a display name from Apple's name parts
              const displayName = [fullName.givenName, fullName.familyName]
                .filter(Boolean)
                .join(" ");

              if (displayName) {
                // Update the profile if we have a name
                await userCredentials.user.updateProfile({
                  displayName: displayName,
                });
              }
            }

            // Get the updated user to ensure we have the latest data
            const updatedUser = modularAuth.currentUser || userCredentials.user;

            const parentId = getItem("inviteParentId");
            const currrentUserData = await dispatch(
              getUserData(updatedUser.uid)
            ).unwrap();
            if (!currrentUserData) {
              dispatch(
                addUserData({
                  user: updatedUser,
                  appleFamilyName: fullName?.familyName,
                  appleFirstName: fullName?.givenName,
                  families: parentId
                    ? [{ id: parentId as string, status: "pending" }]
                    : [],
                })
              );
            }
            router.replace("/");
          } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            RNAlert.alert(
              "Something went wrong",
              "Even though your acount was created, something went wrong during the process. Try signing out and logging back in, or sign up with a different email."
            );
          }
        })
        .catch((error) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          RNAlert.alert(
            "Authentication failed",
            "Invalid Credentials entered. Please try again."
          );
          // console.error(error);
        });
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
          Sentry.captureException(new Error("No ID token found"), {
            tags: {
              location: "google_sign_in-no_id_token",
            },
          });
          RNAlert.alert("Something went wrong", "Please try again later.");
          throw new Error("No ID token found");
        }

        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(
          signInResult.data.idToken
        );

        // Sign-in the user with the credential
        modularAuth
          .signInWithCredential(googleCredential)
          .then(async (userCredentials) => {
            try {
              // Get the updated user to ensure we have the latest data
              const updatedUser =
                modularAuth.currentUser || userCredentials.user;

              const parentId = getItem("inviteParentId");
              const currrentUserData = await dispatch(
                getUserData(updatedUser.uid)
              ).unwrap();
              if (!currrentUserData) {
                dispatch(
                  addUserData({
                    user: updatedUser,
                    families: parentId
                      ? [{ id: parentId as string, status: "pending" }]
                      : [],
                  })
                );
              }
              router.replace("/");
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              RNAlert.alert(
                "Something went wrong",
                "Even though your acount was created, something went wrong during the process. Try signing out and logging back in, or sign up with a different email."
              );
              Sentry.captureException(error, {
                tags: {
                  location: "google_sign_in-sign_in_result",
                },
              });
            }
          })
          .catch((error) => {
            // dispatch(setIsAuthenticated(false));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            RNAlert.alert(
              "Authentication failed",
              "Invalid Credentials entered. Please try again."
            );
            Sentry.captureException(error, {
              tags: {
                location: "google_sign_in-invalid_credentials",
              },
            });
            // console.error(error);
          });
      } else {
        // dispatch(setIsAuthenticated(false))
      }
    } catch (error) {
      // dispatch(setIsAuthenticated(false))
      console.log("error: ", error);
      Sentry.captureException(error, {
        tags: {
          location: "google_sign_in-catch",
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
      }
    }
  };

  const handleSignUp = () => {
    if (enteredEmail.trim() !== "" && enteredPassword.trim() !== "") {
      if (enteredConfirmPassword !== enteredPassword) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        RNAlert.alert(
          "Passwords do not match",
          "Please make sure they are the same."
        );
        return;
      }
      // Check if all criteria are met
      const isValidPassword =
        isMinLength &&
        hasUppercase &&
        hasLowercase &&
        hasNumber &&
        hasSpecialChar;
      if (isValidPassword) {
        setIsLoading(true);
        modularAuth
          .createUserWithEmailAndPassword(enteredEmail, enteredPassword)
          .then(async (userCredentials) => {
            try {
              // First, update the user's profile and wait for it to complete
              const user = userCredentials.user;
              await user.updateProfile({
                displayName: enteredName,
              });

              await user.reload();
              // Now, get the updated user to ensure we have the latest data
              const updatedUser = modularAuth.currentUser;

              // Then send email verification
              await user.sendEmailVerification();

              // Finally, add the user data with the updated profile
              const parentId = getItem("inviteParentId");
              try {
                await dispatch(
                  addUserData({
                    user: updatedUser || user,
                    families: parentId
                      ? [{ id: parentId as string, status: "pending" }]
                      : [],
                  })
                );

                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                setIsLoading(false);
                router.replace("/");
              } catch (err) {
                Sentry.captureException(err, {
                  tags: {
                    location: "add_user_to_database",
                  },
                });
                setIsLoading(false);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error
                );
                RNAlert.alert("Something went wrong adding user to database", err as string);
                return;
              }
            } catch (error) {
              setIsLoading(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              RNAlert.alert(
                "Something went wrong",
                "Even though your account was created, something went wrong during the process. Try signing out and logging back in, or sign up with a different email."
              );
              console.error("Error during sign-up process:", error);
            }
          })
          .catch((error) => {
            setIsLoading(false);
            let errorText = "";
            if (error.code === "auth/email-already-in-use") {
              errorText = "That email address is already in use!";
            }

            if (error.code === "auth/invalid-email") {
              errorText = "That email address is invalid!";
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            RNAlert.alert("Account creation failed", errorText);

            console.log(error);
          });
      } else {
        setIsLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        RNAlert.alert(
          "Account creation failed",
          "Password does not meet the requirements."
        );
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      RNAlert.alert(
        "Account creation failed",
        "Please povide a valid email and password."
      );
    }
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
              Sign up
            </H1>

            <View className="flex-1 flex-row justify-center items-center border border-input rounded-md px-2 bg-background mb-2">
              <User
                color={NAV_THEME[colorScheme].primary}
                size={15}
                className="px-4"
              />
              <Input
                autoCapitalize="words"
                autoCorrect
                autoComplete="name"
                keyboardType="default"
                onChangeText={setEnteredName}
                value={enteredName}
                // autoFocus
                placeholder="Enter your name"
                className="flex-1 py-3 ps-0 pe-3 border-0"
              />
            </View>

            <View className="flex-1 flex-row justify-center items-center border border-input rounded-md px-2 bg-background">
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
                placeholder="Enter your email address"
                className="flex-1 py-3 ps-0 pe-3 border-0"
              />
            </View>
            <Text className="text-sm mb-4">
              You will be required to verify your email address.
            </Text>
            <View className="flex-1 flex-row justify-center items-center border border-input rounded-md px-2 mb-2 bg-background">
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
                placeholder="Choose your password"
                className="flex-1 py-3 ps-0 pe-3 border-0"
                onEndEditing={(event) => {
                  if (event.nativeEvent.text.length === 0) {
                    setEnteredPassword("");
                  }
                }}
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
            {/* Password Requirements */}
            {enteredPassword.length > 0 && (
              <View className="mb-4">
                {[
                  { label: "At least 6 characters", valid: isMinLength },
                  { label: "At least 1 uppercase letter", valid: hasUppercase },
                  { label: "At least 1 lowercase letter", valid: hasLowercase },
                  { label: "At least 1 number", valid: hasNumber },
                  {
                    label: "At least 1 special character",
                    valid: hasSpecialChar,
                  },
                ].map(({ label, valid }, index) => (
                  <View key={index} className="flex-row items-center gap-2">
                    {!valid && (
                      <Animated.View
                        className="flex-row items-center gap-2"
                        entering={FadeIn.duration(500)}
                      >
                        <CircleX size={18} color="red" />
                        <Text className="text-base text-destructive">
                          {label}
                        </Text>
                      </Animated.View>
                    )}
                  </View>
                ))}
              </View>
            )}
            <View className="flex-1 flex-row justify-center items-center border border-input rounded-md px-2 bg-background">
              <KeySquare
                color={NAV_THEME[colorScheme].primary}
                size={15}
                className="px-4"
              />
              <Input
                autoCapitalize="none"
                autoCorrect
                keyboardType="default"
                secureTextEntry={!showConfirmPassword}
                value={enteredConfirmPassword}
                onChangeText={setEnteredConfirmPassword}
                placeholder="Confirm your password"
                className="flex-1 py-3 ps-0 pe-3 border-0"
              />
              {showConfirmPassword ? (
                <Eye
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  color={NAV_THEME[colorScheme].primary}
                  size={15}
                  className="px-4"
                />
              ) : (
                <EyeClosed
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  color={NAV_THEME[colorScheme].primary}
                  size={15}
                  className="px-4"
                />
              )}
            </View>
            {enteredConfirmPassword.length > 0 && (
              <View className="mb-4">
                {enteredConfirmPassword !== enteredPassword && (
                  <Text className="text-destructive">
                    Passwords do not match
                  </Text>
                )}
              </View>
            )}
            <Text className="mb-4">
              By creating an account you agree to the Terms of Service and
              Privacy Policy.
            </Text>
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
                onPress={handleSignUp}
                size="lg"
                disabled={isLoadingUser || isLoading}
              >
                <Text className="dark:text-foreground">Sign up</Text>
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
                Something Went Wrong. Please try again later!
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
