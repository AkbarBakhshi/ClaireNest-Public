import { Alert, View } from "react-native";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Text } from "@/components/ui/text";
import { AlertTriangle } from "@/lib/icons/AlertTriangle";
import { Button } from "./ui/button";
import { getAuth } from "@react-native-firebase/auth";
import { updateUserData } from "@/features/user/userSlice";
import Toast from "react-native-toast-message";
import { useAppDispatch } from "@/hooks/useAppReduxHooks";
import * as Haptics from "expo-haptics";

export default function EmailVerifiedBanner({
  email,
  alertTitle = "Action Required! Tap here for details.",
}: {
  email: string;
  alertTitle?: string;
}) {
  const auth = getAuth();
  const dispatch = useAppDispatch();
  const handleAlreadyVerified = () => {
    auth.currentUser!.reload().then(() => {
      const user = auth.currentUser!;
      if (user.emailVerified) {
        dispatch(
          updateUserData({
            userId: user!.uid,
            updatedData: { emailVerified: true },
          })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: "success",
          text1: "Thank you for verifying your email",
          text2: "You can now enjoy the full features of the app!",
          visibilityTime: 7000,
          position: "top",
        });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: "It appears that your email has not been verified. ",
          text2:
            "Please check your inbox/spam folder or use the other option to resend the email.",
          visibilityTime: 7000,
          position: "top",
        });
      }
    });
  };

  const handleResendEmail = () => {
    const user = auth.currentUser;
    user!
      .sendEmailVerification()
      .then(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: "success",
          text1: `An email has been sent to ${auth.currentUser!.email}.`,
          text2:
            "Please make sure to check your spam folder and follow the directions to verify your account.",
          visibilityTime: 8000,
          position: "top",
        });
      })
      .catch(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          "Something went wrong",
          "Please make sure you are connected to internet. You may need to close and reopen the app."
        );
      });
  };
  return (
    <View className="my-4 border-2 p-2 rounded-lg border-muted">
      <Collapsible>
        <CollapsibleTrigger className="flex-row items-center justify-start">
          <AlertTriangle size={20} className="me-3 text-destructive" />
          <Text className="text-lg text-destructive">{alertTitle}</Text>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Text>
            A verification link has been sent to your email account at{" "}
            <Text
              style={{ fontFamily: "Quicksand_700Bold" }}
              className="text-primary"
            >
              {email}
            </Text>
            . Make sure to also check your spam folder.
          </Text>
          <View className="flex-row justify-between items-center w-full mt-2">
            <Button size="sm" className="" onPress={handleAlreadyVerified}>
              <Text style={{ fontFamily: "Quicksand_700Bold" }}>
                Already Verified
              </Text>
            </Button>
            <Button size="sm" className="" onPress={handleResendEmail}>
              <Text style={{ fontFamily: "Quicksand_700Bold" }}>
                Resend Email
              </Text>
            </Button>
          </View>
        </CollapsibleContent>
      </Collapsible>
    </View>
  );
}
