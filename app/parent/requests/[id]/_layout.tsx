import { Stack } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/lib/constants";
import React from "react";
import CustomToast from "@/components/custom-toast";

export default function RequestDetailsLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerTitleStyle: { fontFamily: "Quicksand_700Bold" },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="edit"
          options={{
            title: "Edit Request",
            headerTitleStyle: { fontFamily: "Quicksand_700Bold" },
          }}
        />
      </Stack>
      <CustomToast />
    </>
  );
}
