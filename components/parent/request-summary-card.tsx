import React from "react";
import { Link } from "expo-router";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
// Imported from component file
// import ChartToggle from "./chart-toggle";
import { View } from "react-native";

interface RequestSummaryCardProps {
  taskStats: {
    total: number;
    completed: number;
    open: number;
    claimed: number;
    expired: number;
  };
  chartData: Array<{
    name: string;
    count: number;
    color: string;
    legendFontColor: string;
    legendFontSize: number;
  }>;
}

const RequestSummaryCard: React.FC<RequestSummaryCardProps> = ({
  taskStats,
  chartData,
}) => {
  // Render summary view
  const RenderSummary = () => (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="items-center justify-center"
    >
      <Text className="text-center mb-1">
        {taskStats.completed} of {taskStats.total} requests completed
      </Text>
      <Text className="text-center">
        {taskStats.open} open, {taskStats.claimed} claimed, {taskStats.expired}{" "}
        missed
      </Text>

      {/* Simple visual representation */}
      <View className="flex-row h-8 rounded-full overflow-hidden mt-4">
        {taskStats.total > 0 ? (
          <>
            <Animated.View
              entering={FadeInDown.delay(200).duration(500)}
              style={{
                flex: Math.max(0.1, taskStats.completed),
                backgroundColor: "#34D399",
              }}
            />
            <Animated.View
              entering={FadeInDown.delay(300).duration(500)}
              style={{
                flex: Math.max(0.1, taskStats.open),
                backgroundColor: "#3B82F6",
              }}
            />
            <Animated.View
              entering={FadeInDown.delay(400).duration(500)}
              style={{
                flex: Math.max(0.1, taskStats.claimed),
                backgroundColor: "#FBBF24",
              }}
            />
            <Animated.View
              entering={FadeInDown.delay(500).duration(500)}
              style={{
                flex: Math.max(0.1, taskStats.expired),
                backgroundColor: "#EF4444",
              }}
            />
          </>
        ) : (
          <View style={{ flex: 1, backgroundColor: "#E5E7EB" }} />
        )}
      </View>

      {/* Legend */}
      <View className="flex-row flex-wrap justify-center mt-4 gap-3">
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-[#34D399] mr-2" />
          <Text className="text-xs text-muted-foreground">Completed</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-[#3B82F6] mr-2" />
          <Text className="text-xs text-muted-foreground">Open</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-[#FBBF24] mr-2" />
          <Text className="text-xs text-muted-foreground">Claimed</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-[#EF4444] mr-2" />
          <Text className="text-xs text-muted-foreground">Missed</Text>
        </View>
      </View>
    </Animated.View>
  );
  return (
    <Animated.View entering={FadeInDown.delay(300).duration(600).springify()}>
      <Card>
        <CardContent>
          <Animated.View
            entering={FadeInDown.delay(400).duration(500)}
            className="w-full my-2"
          >
            {/* <ChartToggle taskStats={taskStats} chartData={chartData} /> */}
            <RenderSummary />
          </Animated.View>
        </CardContent>
        <CardFooter className="w-full">
          <Link href="/parent/(tabs)/requests" asChild>
            <Button size="lg" className="mt-3 w-full">
              <Text className="text-lg"> View All Requests</Text>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </Animated.View>
  );
};

export default RequestSummaryCard;
