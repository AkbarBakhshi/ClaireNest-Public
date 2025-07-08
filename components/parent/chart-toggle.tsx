import React, { useState } from "react";
import { View, Dimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartPie } from "@/lib/icons/ChartPie";
import { ChartColumnBig } from "@/lib/icons/ChartColumnBig";
import { BarChart, PieChart } from "react-native-chart-kit";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { cn } from "@/lib/utils";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useMemo } from "react";

// Chart toggle component
interface ChartToggleProps {
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

const ChartToggle: React.FC<ChartToggleProps> = ({ taskStats, chartData }) => {
  const { colorScheme } = useColorScheme();
  const [value, setValue] = useState<"summary" | "pie" | "bar">("summary");
  
  // Calculate fixed positions for the tabs based on the screen width
  const dimensions = useMemo(() => {
    const screenWidth = Dimensions.get("window").width;
    const chartWidth = screenWidth - 120; // Width for charts
    
    return {
      screenWidth,
      chartWidth
    };
  }, []);

  // Render pie chart
  const renderPieChart = () => (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="items-center mt-2"
    >
      <PieChart
        data={chartData}
        width={dimensions.chartWidth}
        height={180}
        chartConfig={{
          color: () => `#F3F4F6`, // Tailwind gray-100
        }}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="15"
      />
    </Animated.View>
  );

  // Render bar chart
  const renderBarChart = () => (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="items-center mt-2"
    >
      <BarChart
        style={{
          alignSelf: "center",
          borderRadius: 16,
        }}
        data={{
          labels: ["Open", "Claimed", "Missed", "Done"],
          datasets: [
            {
              data: [
                taskStats.open,
                taskStats.claimed,
                taskStats.expired,
                taskStats.completed,
              ],
            },
          ],
        }}
        yAxisLabel=""
        yAxisSuffix=""
        width={dimensions.chartWidth}
        height={220}
        fromZero
        showValuesOnTopOfBars
        chartConfig={{
          backgroundGradientFrom: NAV_THEME[colorScheme].background,
          backgroundGradientTo: NAV_THEME[colorScheme].background,
          fillShadowGradient: "#60A5FA",
          fillShadowGradientOpacity: 1,
          color: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`, // dark gray
          labelColor: () => "#6B7280",
          barPercentage: 0.5,
        }}
        verticalLabelRotation={0}
        withInnerLines={false}
        showBarTops
      />
    </Animated.View>
  );

  // Render summary view
  const renderSummary = () => (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="items-center justify-center"
    >
      <View className="p-4 bg-muted/30 rounded-lg">
        <Text
          className="text-center text-lg mb-2"
          style={{ fontFamily: "Quicksand_700Bold" }}
        >
          Request Summary
        </Text>
        <Text className="text-center text-muted-foreground mb-1">
          {taskStats.completed} of {taskStats.total} requests completed
        </Text>
        <Text className="text-center text-muted-foreground">
          {taskStats.open} open, {taskStats.claimed} claimed,{" "}
          {taskStats.expired} missed
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
      </View>
    </Animated.View>
  );

  return (
    <View className="w-full">
      {/* Custom tab bar container with fixed positioning */}
      <View className="mb-4 overflow-hidden rounded-lg border border-muted">
        {/* Tab buttons container */}

        <Tabs
          value={value}
          onValueChange={(value) =>
            setValue(value as "summary" | "pie" | "bar")
          }
          className="w-full h-full flex-1"
        >
          <TabsList className="flex-row w-full">
            <TabsTrigger value="summary" className="flex-1">
              <Text
                className={cn("text-lg", value === "summary" && "text-primary")}
              >
                Summary
              </Text>
            </TabsTrigger>
            <TabsTrigger value="pie" className="flex-1">
              <ChartPie
                color={
                  value === "pie" ? NAV_THEME[colorScheme].primary : "gray"
                }
              />
            </TabsTrigger>
            <TabsTrigger value="bar" className="flex-1">
              <ChartColumnBig
                color={
                  value === "bar" ? NAV_THEME[colorScheme].primary : "gray"
                }
              />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="flex-1">
            {renderSummary()}
          </TabsContent>
          <TabsContent value="pie" className="flex-1">
            {renderPieChart()}
          </TabsContent>
          <TabsContent value="bar" className="flex-1">
            {renderBarChart()}
          </TabsContent>
        </Tabs>
      </View>
    </View>
  );
};

export default ChartToggle; 