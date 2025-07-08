import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Users } from "@/lib/icons/Users";
import Animated, { FadeInUp } from "react-native-reanimated";

export function NoFamiliesConnected() {
  return (
    <Animated.View
      entering={FadeInUp.delay(100).duration(800)}
      className="flex-1 justify-center p-6 mt-10"
    >
      <View className="items-center">
        <Users size={64} color="#aaa" />
        <Text
          className="text-2xl mt-4 text-center"
          style={{ fontFamily: "Quicksand_700Bold" }}
        >
          You are not connected to any families yet.
        </Text>
        <Text className="text-center text-muted-foreground mt-4 text-lg">
          Each parent using ClaireNest has a unique invite link they can
          share with friends and family members. Contact them and ask them to
          send you their invitation link.
        </Text>
      </View>
    </Animated.View>
  );
} 