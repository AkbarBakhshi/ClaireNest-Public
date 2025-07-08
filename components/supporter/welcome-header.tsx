import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { FadeInDown } from "react-native-reanimated";

interface WelcomeHeaderProps {
  name: string;
  subtitle?: string;
}

export function WelcomeHeader({ 
  name, 
  subtitle = "Here's your support dashboard."
}: WelcomeHeaderProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(600).springify()}
      className="pt-6 pb-2"
    >
      <Text
        className="text-3xl"
        style={{ fontFamily: "Quicksand_700Bold" }}
      >
        Welcome, {name}! 👋
      </Text>
      <Text className="text-lg text-muted-foreground mt-1">
        {subtitle}
      </Text>
    </Animated.View>
  );
} 