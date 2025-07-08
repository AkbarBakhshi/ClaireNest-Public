import { useState, useRef, useEffect } from "react";
import { View, Alert, ScrollView, Linking, AppState } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SettingsLink from "@/components/settings-link";
import { Text } from "@/components/ui/text";
import { Switch } from "@/components/ui/switch";
import { getAuth } from "@react-native-firebase/auth";
import { Button } from "@/components/ui/button";

import { LogOut } from "@/lib/icons/Logout";
import { Bell } from "@/lib/icons/Bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Repeat } from "@/lib/icons/Repeat";
import { MessageCircleQuestion } from "@/lib/icons/MessageCircleQuestion";
import { Trash } from "@/lib/icons/Trash";
import { Info } from "@/lib/icons/Info";
import { ThemeToggle } from "@/components/theme-toggle";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/lib/constants";
import { router, Link } from "expo-router";
import * as Application from "expo-application";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Separator } from "@/components/ui/separator";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import {
  resetUser,
  deleteUser,
  selectUserData,
  updateUserData,
} from "@/features/user/userSlice";
import { resetRequests } from "@/features/request/requestSlice";
import { Edit } from "@/lib/icons/Edit";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";

export default function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const auth = getAuth();
  const [notificationsChecked, setNotificationsChecked] = useState(false);
  const user = useAppSelector(selectUserData);
  const dispatch = useAppDispatch();
  const appState = useRef(AppState.currentState);

  const getNotificationPermission = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      if (!user?.pushToken || user?.pushToken !== token) {
        dispatch(
          updateUserData({
            userId: user!.userId,
            updatedData: { pushToken: token },
          })
        );
      }
      setNotificationsChecked(true);
    } else {
      dispatch(
        updateUserData({
          userId: user!.userId,
          updatedData: { pushToken: "" },
        })
      );
      setNotificationsChecked(false);
    }
  };

  useEffect(() => {
    getNotificationPermission();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // console.log("App has come to the foreground!");
        getNotificationPermission();
      }

      appState.current = nextAppState;
      // console.log("AppState", appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const setNotificationStatus = async (value: boolean) => {
    const originalValue = notificationsChecked;
    setNotificationsChecked(value);
    Alert.alert(
      "Push Notification Permissions",
      "Would you like to change push notification permissions in the device settings?",
      [
        {
          text: "No",
          onPress: () => {
            setNotificationsChecked(originalValue);
          },
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            await Linking.openSettings();
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Are you sure you want to sign out?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            const updatedUser = await dispatch(
              updateUserData({
                userId: user!.userId,
                updatedData: { pushToken: "" },
              })
            );
            if (updatedUser.type === "users/updateUserData/fulfilled") {
              auth
                .signOut()
                .then(() => {
                  dispatch(resetUser());
                  dispatch(resetRequests());
                  router.replace("/");
                })
                .catch((e) => {
                  console.log("error", e);
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Error
                  );
                  Alert.alert(
                    "Signout failed!",
                    "Could not log you out. Please check your internet connection or try again later!"
                  );
                });
            }
          } catch (error) {
            console.log("error", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Failed to sign out. Please try again later.");
          }
        },
      },
    ]);
  };

  const deleteAccount = async () => {
    try {
      if (!user?.userId) {
        Alert.alert("Error", "User ID not found");
        return;
      }

      const result = await dispatch(deleteUser(user.userId)).unwrap();

      if (result) {
        // Sign out the user after successful deletion
        await auth.signOut();
        dispatch(resetUser());
        dispatch(resetRequests());
        router.replace("/");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Account deleted successfully",
          "All your data has been deleted. We're sorry to see you go! Feel free to contact us if you have any feedback or questions."
        );
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        "Failed to delete account. Please try again later. If the problem persists, please contact support@clairenest.com."
      );
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "This action is irreversible and will remove all your data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteAccount,
        },
      ]
    );
  };

  const sendHelpEmail = () => {
    const email = "support@clairenest.com";
    const subject = encodeURIComponent("ClaireNest Support Request");
    const body = encodeURIComponent("Hi, I need help with...");

    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const _handlePressButtonAsync = async () => {
    await WebBrowser.openBrowserAsync(
      "https://www.clairenest.com/privacy-policy",
      {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 px-6 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
      >
        <Animated.View entering={FadeInUp.duration(600)}>
          <View className="flex-row items-start justify-between w-full  mb-4">
            <Link href="/supporter/user-profile">
              <View>
                <Avatar
                  alt={`${user?.displayName}'s Avatar`}
                  className="me-2 h-20 w-20"
                >
                  <AvatarImage source={{ uri: user?.photoUrl || "" }} />
                  <AvatarFallback>
                    <Text className="text-xl">
                      {user?.displayName?.split(" ")[0].charAt(0)}{" "}
                      {user?.displayName?.split(" ")[1]?.charAt(0)}
                    </Text>
                  </AvatarFallback>
                </Avatar>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl mt-3" style={{fontFamily: "Quicksand_700Bold"}}>
                    {user?.displayName || "Guest User"}
                  </Text>
                  <Edit size={16} color={NAV_THEME[colorScheme].primary} />
                </View>

                <Text className="text-muted-foreground">{user?.email}</Text>
              </View>
            </Link>
            <ThemeToggle />
          </View>

          {/* Help & Feedback */}
          <SettingsLink
            text="Help"
            Icon={MessageCircleQuestion}
            onPress={sendHelpEmail}
          />
          <SettingsLink
            text="Feedback"
            Icon={Repeat}
            onPress={() => router.push("/supporter/feedback")}
          />
        </Animated.View>

        {/* Footer Actions */}
        <Animated.View entering={FadeInDown.duration(600)}>
          {/* Notifications */}
          <View className="flex-row justify-between items-center my-4">
            <View className="flex-row items-center">
              <View className="pe-3">
                <Bell size={25} color={NAV_THEME[colorScheme].text} />
              </View>
              <Text className="text-xl">Notifications</Text>
            </View>
            <Switch
              checked={notificationsChecked}
              onCheckedChange={(value) => setNotificationStatus(value)}
            />
          </View>

          {/* Separator */}
          <Separator />

          {/* Account Deletion */}
          <View className="flex-row items-center justify-between mt-4">
            <Button
              size="lg"
              variant="secondary"
              onPress={handleSignOut}
              className="flex-row px-5"
            >
              <LogOut size={25} color={NAV_THEME[colorScheme].primary} />
              <Text className="ml-5 text-lg dark:text-foreground">
                Sign Out
              </Text>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onPress={handleDeleteAccount}
              className="flex-row px-5"
            >
              <Trash size={20} color="white" />
              <Text className="ml-2 text-white">Delete Account</Text>
            </Button>
          </View>

          {/* App Version */}
          <View className="flex-row justify-between items-center mt-2">
            <View className="flex-row items-center">
              <Info size={18} color={NAV_THEME[colorScheme].text} />
              <Text className="text-muted-foreground ml-2">
                ClaireNest v{Application.nativeApplicationVersion}
              </Text>
            </View>

            <Button size="lg" variant="link" onPress={_handlePressButtonAsync}>
              <Text>Privacy Policy</Text>
            </Button>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
