import { Stack } from "expo-router";
import React from "react";
import CustomToast from "@/components/custom-toast";

export default function RequestDetailsLayout() {

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
      </Stack>
      <CustomToast />
    </>
  );
}
