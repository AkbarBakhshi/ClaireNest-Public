import React from "react";
import { NAV_THEME } from "@/lib/constants";
import { router, Stack } from "expo-router";
import { TouchableOpacity, Platform } from "react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import { ChevronLeft } from "@/lib/icons/ChevronLeft";
import { ArrowLeft } from "@/lib/icons/ArrowLeft";
import CustomToast from "@/components/custom-toast";

export default function SupporterLayout() {
  const { colorScheme } = useColorScheme();
  return (
    <>
      <Stack
        screenOptions={{
          headerTitleStyle: { fontFamily: "Quicksand_700Bold" },
        }}
      >
        {/* Bottom tab navigator */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Request details should be a modal, not a tab */}
        <Stack.Screen
          name="requests/[id]"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="user-profile"
          options={{
            presentation: "modal",
            headerTitleAlign: "center",
            title: "Profile",
            // headerLeft: () => (
            //   <TouchableOpacity onPress={() => router.back()}>
            //     <ChevronLeft size={24} color={NAV_THEME[colorScheme].text} />
            //   </TouchableOpacity>
            // ),
          }}
        />
        <Stack.Screen
          name="feedback"
          options={{
            title: "Feedback",
            headerTitleAlign: "center",
            headerLeft: () => (
              <TouchableOpacity onPressIn={() => router.back()}>
                {Platform.OS === "ios" ? (
                  <ChevronLeft
                    size={24}
                    color={NAV_THEME[colorScheme].text}
                  />
                ) : (
                  <ArrowLeft
                    size={24}
                    color={NAV_THEME[colorScheme].text}
                  />
                )}
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="my-families"
          options={{
            title: "My Families",
            headerTitleAlign: "center",
            headerTitleStyle: { fontFamily: "Quicksand_700Bold" },
            headerLeft: () => (
              <TouchableOpacity onPressIn={() => router.back()}>
                {Platform.OS === "ios" ? (
                  <ChevronLeft
                    size={24}
                    color={NAV_THEME[colorScheme].text}
                  />
                ) : (
                  <ArrowLeft
                    size={24}
                    color={NAV_THEME[colorScheme].text}
                  />
                )}
              </TouchableOpacity>
            ),
          }}
        />
      </Stack>
      <CustomToast />
    </>
  );
}
