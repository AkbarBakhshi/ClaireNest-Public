import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Settings } from "@/lib/icons/Settings";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Redirect, Tabs } from "expo-router";
import { ClipboardList } from "@/lib/icons/ClipboardList";
import { ClipboardEdit } from "@/lib/icons/ClipboardEdit";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Cog } from "@/lib/icons/Cog";
import { Home } from "@/lib/icons/Home";
import { House } from "@/lib/icons/House";
import * as Notifications from "expo-notifications";
import { EventSubscription } from "expo-modules-core";
import { registerForPushNotificationsAsync } from "@/lib/utils";
import { useRef, useEffect } from "react";
import { updateUserData } from "@/features/user/userSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import { selectUserData } from "@/features/user/userSlice";
import { RequestNotificationData } from "@/interfaces";
import { router } from "expo-router";
import { fetchRequests } from "@/features/request/requestSlice";
import { selectRequests } from "@/features/request/requestSlice";
import * as Haptics from "expo-haptics";
import { Alert, Platform } from "react-native";
import { HapticTab } from "@/components/navigation/HapticTab";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function SupporterLayout() {
  const notificationListener = useRef<EventSubscription>();
  const responseListener = useRef<EventSubscription>();
  const dispatch = useAppDispatch();
  const firestoreUser = useAppSelector(selectUserData);
  const requests = useAppSelector(selectRequests);

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

        if (
          notificationData.type === "requestCreated" ||
          notificationData.type === "requestMessageReceived"
        ) {
          if (
            !requests.find(
              (request) => request.id === notificationData.requestData.id
            )
          ) {
            const offset = 30;
            const dateObj = new Date(
              new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            );
            const fromDate = new Date(dateObj);
            fromDate.setDate(dateObj.getDate());
            const toDate = new Date(dateObj);
            toDate.setDate(dateObj.getDate() + offset - 1);
            const newRequest = await dispatch(
              fetchRequests({
                parentId: notificationData.requestData.parentId,
                from: fromDate.toISOString(),
                to: toDate.toISOString(),
              })
            );
            if (newRequest.type === "requests/fetchRequests/fulfilled") {
              const notificationRequestData = notificationData.requestData;
              setTimeout(() => {
                router.push(
                  `/supporter/requests/${notificationRequestData.id}`
                );
              }, 100);
            } else {
              console.log("error", "Failed to fetch requests");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                "Failed to fetch requests",
                "Please try again later."
              );
            }
          } else {
            const notificationRequestData = notificationData.requestData;
            setTimeout(() => {
              router.push(`/supporter/requests/${notificationRequestData.id}`);
            }, 100);
          }
        } else if (notificationData.type === "supporterRequestApproved") {
          setTimeout(() => {
            router.push(`/supporter/my-families`);
          }, 100);
        }
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
        console.log("notification", notificationData);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          const notificationContent = response.notification.request.content;
          // This is called once the notification is tapped (both ios and Android)
          const notificationData =
            notificationContent.data as RequestNotificationData;
          // console.log("notificationData Type:", notificationData.type);
          if (
            notificationData.type === "requestCreated" ||
            notificationData.type === "requestMessageReceived"
          ) {
            if (
              !requests.find(
                (request) => request.id === notificationData.requestData.id
              )
            ) {
              const offset = 30;
              const dateObj = new Date(
                new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
              );
              const fromDate = new Date(dateObj);
              fromDate.setDate(dateObj.getDate());
              const toDate = new Date(dateObj);
              toDate.setDate(dateObj.getDate() + offset - 1);
              const newRequest = await dispatch(
                fetchRequests({
                  parentId: notificationData.requestData.parentId,
                  from: fromDate.toISOString(),
                  to: toDate.toISOString(),
                })
              );
              if (newRequest.type === "requests/fetchRequests/fulfilled") {
                const notificationRequestData = notificationData.requestData;
                router.push(
                  `/supporter/requests/${notificationRequestData.id}`
                );
              } else {
                console.log("error", "Failed to fetch requests");
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error
                );
                Alert.alert(
                  "Failed to fetch requests",
                  "Please try again later."
                );
              }
            } else {
              const notificationRequestData = notificationData.requestData;
              router.push(`/supporter/requests/${notificationRequestData.id}`);
            }
          } else if (notificationData.type === "supporterRequestApproved") {
            router.push(`/supporter/my-families`);
          }
        }
      );

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
      <BottomSheetModalProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarLabelStyle: { fontFamily: "Quicksand_700Bold", fontSize: 12 },
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
                <TabBarIcon Icon={focused ? Home : House} color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="tasks"
            options={{
              title: "Tasks",
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon
                  Icon={focused ? ClipboardList : ClipboardEdit}
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
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
