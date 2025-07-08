import React from "react";
import { NAV_THEME } from "@/lib/constants";
import { Link, router, Stack } from "expo-router";
import { Platform, TouchableOpacity } from "react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import { ChevronLeft } from "@/lib/icons/ChevronLeft";
import { Plus } from "@/lib/icons/Plus";
import CustomToast from "@/components/custom-toast";
import { ArrowLeft } from "@/lib/icons/ArrowLeft";
export default function ParentLayout() {
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
          options={{ headerShown: false, presentation: "modal" }}
        />

        <Stack.Screen
          name="child-profile"
          options={{
            title: "Child Profile",
            headerTitleAlign: "center",
            headerLeft: () => (
              <TouchableOpacity onPressIn={() => router.back()}>
                {Platform.OS === "ios" ? (
                  <ChevronLeft size={24} color={NAV_THEME[colorScheme].text} />
                ) : (
                  <ArrowLeft size={24} color={NAV_THEME[colorScheme].text} />
                )}
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity onPressIn={() => router.push("/parent/add-child")}>
                <Plus size={24} color={NAV_THEME[colorScheme].text} />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="add-child"
          options={{
            presentation: "modal",
            headerTitleAlign: "center",
            title: "Add Child",
            // headerLeft: () => (
            //   <TouchableOpacity onPress={() => router.back()}>
            //     <ChevronLeft size={24} color={NAV_THEME[colorScheme].text} />
            //   </TouchableOpacity>
            // ),
          }}
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
                  <ChevronLeft size={24} color={NAV_THEME[colorScheme].text} />
                ) : (
                  <ArrowLeft size={24} color={NAV_THEME[colorScheme].text} />
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
