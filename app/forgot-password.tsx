import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import { View, StyleSheet, Alert, Image } from "react-native";
import { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuth } from "@react-native-firebase/auth";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { AtSign } from "@/lib/icons/AtSign";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/lib/constants";
import Animated, { FadeIn } from "react-native-reanimated";
import { H1 } from "@/components/ui/typography";
import * as Haptics from "expo-haptics";

export default function ForgotPassword() {
  const auth = getAuth();
  const { colorScheme } = useColorScheme();

  const [enteredEmail, setEnteredEmail] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleForgotPassword = () => {
    if (!enteredEmail.trim().includes("@")) {
      Alert.alert("Invalid input. Please enter a valid email.");
    } else {
      setUpdating(true);
      auth
        .sendPasswordResetEmail(enteredEmail)
        .then(() => {
          setUpdating(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
          Alert.alert(
            "Email sent",
            "If the provided email exists in our database, you will receive an email from us with instructions to reset your password. Please make sure to check your spam folder as well."
          );
        })
        .catch((error) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert(
            "Request failed",
            "Invalid Credentials entered. Please try again."
          );
          setUpdating(false);
          // console.error(error);
        });
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
        <Animated.View entering={FadeIn.duration(500)} className="px-7 pt-4">
          <H1 className="my-4" style={{ fontFamily: "Quicksand_700Bold" }}>
            Reset password
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
              autoFocus
              keyboardType="email-address"
              onChangeText={setEnteredEmail}
              value={enteredEmail}
              // autoFocus
              blurOnSubmit
              placeholder="Enter your email address"
              className="flex-1 py-3 ps-0 pe-3 border-0"
            />
          </View>
          <Text className="text-sm mt-2 mb-4">
            Enter the email you used to create your account. We'll send you
            instructions so you can set a new password.
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
              disabled={updating}
              onPress={handleForgotPassword}
              size="lg"
            >
              <Text>{updating ? "Processing ..." : "Submit"}</Text>
            </Button>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
    fontFamily: "Exo_400Regular",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 2,
    fontSize: 16,
    flex: 1,
    marginBottom: 12,
  },
});
