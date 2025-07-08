import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import AnimatedCounter from "@/components/animated-counter";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Link } from "expo-router";

interface SupporterStatsCardProps {
  total: number;
  pending: number;
}

const SupporterStatsCard: React.FC<SupporterStatsCardProps> = ({
  total,
  pending,
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(450).duration(600).springify()}>
      <Link href="/parent/(tabs)/supporters" className="w-full">
        <Card className="w-full">
          <CardContent className="flex-row justify-between my-3">
            <View className="items-center">
              <AnimatedCounter value={total} />
              <Text className="text-muted-foreground mt-2">
                Active Supporters
              </Text>
            </View>
            <View className="items-center">
              <AnimatedCounter value={pending} />
              <Text className="text-muted-foreground mt-2">
                Pending Requests
              </Text>
            </View>
          </CardContent>
        </Card>
      </Link>
    </Animated.View>
  );
};

export default SupporterStatsCard;
