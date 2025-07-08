import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { PortalHost } from "@rn-primitives/portal";
import { Alert, ActivityIndicator, Platform } from "react-native";
import { FullWindowOverlay } from "react-native-screens";
import React, { useState } from "react";
import { updateEmailFromFirebase } from "@/features/user/userAPI";
import * as Haptics from "expo-haptics";
import { getAuth } from "@react-native-firebase/auth";
import { resetUser } from "@/features/user/userSlice";
import { router } from "expo-router";
import { resetRequests } from "@/features/request/requestSlice";
import { useAppDispatch } from "@/hooks/useAppReduxHooks";
import { Input } from "./ui/input";

const CUSTOM_PORTAL_HOST_NAME = "update-email-dialog";
const WindowOverlay =
  Platform.OS === "ios" ? FullWindowOverlay : React.Fragment;

export default function UpdateEmailDialog({
  isLoading,
  setIsLoading,
}: {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}) {
  const auth = getAuth();
  const user = auth.currentUser;
  const dispatch = useAppDispatch();
  const [isDisabled, setIsDisabled] = useState(true);
  const [email, setEmail] = useState<string>(user!.email!);
  const [error, setError] = useState<string>(
    "Please enter a new email address."
  );

  const updateEmail = async () => {
    try {
      setIsLoading(true);
      await updateEmailFromFirebase({
        userId: user!.uid,
        newEmail: email,
      });
      await auth.signOut();
      dispatch(resetUser());
      dispatch(resetRequests());
      router.replace("/");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Error updating email:", error);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert("Error updating email", "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (text: string) => {
    if (text.trim() === user!.email) {
      setError("Please enter a new email address.");
      setIsDisabled(true);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text)) {
        setError("Please enter a valid email address.");
        setIsDisabled(true);
      } else {
        setError("");
        setIsDisabled(false);
      }
    }
  };

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="mt-6">
            <Text>Update Email Address</Text>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent portalHost={CUSTOM_PORTAL_HOST_NAME}>
          <AlertDialogHeader>
            <AlertDialogTitle>Read Below Before Updating Email</AlertDialogTitle>
            <AlertDialogDescription>
              You will be automatically logged out and need to sign in again
              using the new email address. You will also need to verify your new
              email address.
            </AlertDialogDescription>
            <Input
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                validateEmail(text);
              }}
              placeholder="New email address"
              className="mt-4"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              autoFocus={true}
              keyboardType="email-address"
              returnKeyType="done"
            />
            {error && <Text className="text-red-500">{error}</Text>}
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-between">
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              onPress={updateEmail}
              disabled={isDisabled}
              className="disabled:bg-muted"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text>Update Email</Text>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <WindowOverlay>
        <PortalHost name={CUSTOM_PORTAL_HOST_NAME} />
      </WindowOverlay>
    </>
  );
}
