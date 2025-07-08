import { Platform } from "react-native";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { House } from "@/lib/icons/House";
import { Settings } from "@/lib/icons/Settings";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Redirect, router, Tabs } from "expo-router";
import { HeartHandshake } from "@/lib/icons/HeartHandshake";
import { HandHelping } from "@/lib/icons/HandHelping";
import { ClipboardList } from "@/lib/icons/ClipboardList";
import { ClipboardEdit } from "@/lib/icons/ClipboardEdit";
import { Cog } from "@/lib/icons/Cog";
import * as Notifications from "expo-notifications";
import { EventSubscription } from "expo-modules-core";
import { registerForPushNotificationsAsync } from "@/lib/utils";
import { useRef, useEffect } from "react";
import { updateUserData } from "@/features/user/userSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import { selectUserData } from "@/features/user/userSlice";
import { RequestNotificationData } from "@/interfaces";
import { HapticTab } from "@/components/navigation/HapticTab";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function ParentLayout() {
  const notificationListener = useRef<EventSubscription>();
  const responseListener = useRef<EventSubscription>();
  const dispatch = useAppDispatch();
  const firestoreUser = useAppSelector(selectUserData);

  useEffect(() => {
    // Handle notifications when app is closed for android
    const handleInitialNotification = async () => {
      const initialNotification =
        await Notifications.getLastNotificationResponseAsync();
      if (initialNotification) {
        const notificationContent =
          initialNotification.notification.request.content;
        const notificationData =
          notificationContent.data as RequestNotificationData;
        // console.log("Initial notification Type:", notificationData.type);
        setTimeout(() => {
          if (
            notificationData.type === "requestClaimed" ||
            notificationData.type === "requestMessageReceived"
          ) {
            const notificationRequestData = notificationData.requestData;
            router.push(`/parent/requests/${notificationRequestData.id}`);
          } else if (notificationData.type === "supporterRequest") {
            router.push(`/parent/(tabs)/supporters`);
          }
        }, 100);
      }
    };

    handleInitialNotification();

    registerForPushNotificationsAsync()
      .then((token) => {
        dispatch(
          updateUserData({
            userId: firestoreUser!.userId,
            updatedData: { pushToken: token },
          })
        );
      })
      .catch((error: any) => console.log(`error: ${error}`));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // This is called when phone is on foreground (both ios and Android)  -- notification is shown on foreground too
        const notificationData = notification.request.content.data;
        console.log("notification", notificationData.type);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const notificationContent = response.notification.request.content;
        // This is called once the notification is tapped (both ios and Android)
        const notificationData =
          notificationContent.data as RequestNotificationData;
        // console.log("response", notificationData.type);

        // Add a small delay to ensure the app is ready
        setTimeout(() => {
          if (
            notificationData.type === "requestClaimed" ||
            notificationData.type === "requestMessageReceived"
          ) {
            const notificationRequestData = notificationData.requestData;
            router.push(`/parent/requests/${notificationRequestData.id}`);
          } else if (notificationData.type === "supporterRequest") {
            router.push(`/parent/(tabs)/supporters`);
          }
        }, 100);
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  if (!firestoreUser) {
    return <Redirect href="/" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarLabelStyle: { fontFamily: "Quicksand_700Bold", fontSize: 12 },
          tabBarButton: HapticTab,
          tabBarStyle: {
            height: Platform.OS === "android" ? 60 : 85,
          },
          animation: "shift",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon Icon={focused ? House : House} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: "Requests",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                Icon={!focused ? ClipboardList : ClipboardEdit}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="supporters"
          options={{
            title: "Supporters",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                Icon={focused ? HeartHandshake : HandHelping}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon Icon={!focused ? Settings : Cog} color={color} />
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
