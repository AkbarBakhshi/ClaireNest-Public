import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import {
  ActivityIndicator,
  Modal,
  Alert as RNALert,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  selectUserError,
  selectUserLoading,
  updateUserData,
} from "@/features/user/userSlice";
import { getAuth } from "@react-native-firebase/auth";
import * as Haptics from "expo-haptics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "@/lib/icons/AlertTriangle";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { LogOut } from "@/lib/icons/Logout";
import { resetRequests } from "@/features/request/requestSlice";
import { resetUser } from "@/features/user/userSlice";
import * as Sentry from '@sentry/react-native';

export default function SelectRoleScreen() {
  const auth = getAuth();
  const { colorScheme } = useColorScheme();

  const dispatch = useAppDispatch();
  const isLoadingUser = useAppSelector(selectUserLoading);
  const userError = useAppSelector(selectUserError);

  const handleRoleSelect = (role: "parent" | "supporter") => {
    try {
      // Navigate to appropriate setup flow
      dispatch(
        updateUserData({
          userId: auth.currentUser!.uid,
          updatedData: { role },
        })
      );
      router.push("/");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      RNALert.alert(
        "Error",
        "Failed to save role selection. Please try again."
      );
      Sentry.captureException(error, {
        tags: {
          location: "select-role",
        },
        extra: {
          userId: auth.currentUser!.uid,
          role,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  };

  const handleStartOver = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await auth.signOut();
      dispatch(resetUser());
      dispatch(resetRequests());
      router.replace("/");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      RNALert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 px-6 py-8 bg-background justify-between flex-col">
      {/* Title */}
      <Animated.View entering={FadeInUp.duration(500)}>
        <Text
          className="text-3xl text-center text-foreground mb-3"
          style={{ fontFamily: "Quicksand_700Bold" }}
        >
          Choose Your Role
        </Text>
        <Text className="text-lg text-muted-foreground text-center mb-6 max-w-96 mx-auto">
          Are you a parent needing support or here to help?{" "}
          <Text style={{ fontFamily: "Quicksand_700Bold" }}>
            (This cannot be changed later. You will need to create a new account
            for each role)
          </Text>
        </Text>
      </Animated.View>
      {/* Role Selection */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <View className="flex-row flex-wrap justify-center gap-6">
          {/* Parent Card */}
          <TouchableOpacity
            onPress={() => handleRoleSelect("parent")}
            activeOpacity={0.9}
            className="bg-card w-full max-w-md rounded-2xl p-8 items-center border border-transparent transition-all active:border-primary"
          >
            <Text
              className="text-2xl mb-2"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              I'm a Parent
            </Text>
            <Text className="text-muted-foreground text-center text-base">
              Create your support circle and coordinate help from loved ones.
            </Text>
          </TouchableOpacity>

          {/* Supporter Card */}
          <TouchableOpacity
            onPress={() => handleRoleSelect("supporter")}
            activeOpacity={0.9}
            className="bg-card w-full max-w-md rounded-2xl p-8 items-center border border-transparent transition-all active:border-secondary"
          >
            <Text
              className="text-2xl mb-2"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              I'm Here to Help
            </Text>
            <Text className="text-muted-foreground text-center text-base">
              Join a parent's circle and support them with tasks and errands.
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Error Message */}
      {userError && (
        <Animated.View entering={FadeInUp.delay(400).duration(500)}>
          <Alert
            icon={AlertTriangle}
            variant="destructive"
            className="max-w-xl mt-6 mx-auto"
          >
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>
              Something went wrong. Please try again later!
            </AlertDescription>
          </Alert>
        </Animated.View>
      )}

      {/* Start Over Button */}
      <Animated.View entering={FadeInUp.delay(600).duration(500)}>
        <TouchableOpacity
          onPress={handleStartOver}
          activeOpacity={0.7}
          className="flex-row items-center justify-center gap-2 py-3"
        >
          <LogOut size={20} color={NAV_THEME[colorScheme].text} />
          <Text
            className="text-foreground"
            style={{ fontFamily: "Quicksand_600SemiBold" }}
          >
            Start Over
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Loading Modal */}
      <Modal visible={isLoadingUser} transparent={true} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="bg-card p-6 rounded-2xl shadow-lg flex items-center">
            <ActivityIndicator
              size="large"
              color={NAV_THEME[colorScheme].text}
            />
            <Text className="text-lg text-foreground mt-3">Loading...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
