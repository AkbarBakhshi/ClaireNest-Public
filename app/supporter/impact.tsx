import React, { useEffect, useState } from "react";
import { View, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart } from "react-native-chart-kit";
import { ChartPie } from "@/lib/icons/ChartPie";
import { ChartColumnBig } from "@/lib/icons/ChartColumnBig";
import { ChevronLeft } from "@/lib/icons/ChevronLeft";
import { Users } from "@/lib/icons/Users";
import { Calendar } from "@/lib/icons/Calendar";
import { Utensils } from "@/lib/icons/Utensils";
import { Baby } from "@/lib/icons/Baby";
import { Heart } from "@/lib/icons/Heart";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAppSelector } from "@/hooks/useAppReduxHooks";
import { cn } from "@/lib/utils";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Badge } from "@/components/ui/badge";
import { HelpRequest, UserData, TaskType } from "@/interfaces";
import { CheckCircle } from "@/lib/icons/CheckCircle";
import { ShoppingCart } from "@/lib/icons/ShoppingCart";
import { Car } from "lucide-react-native";

// Create a Medal icon since it doesn't exist
const Medal = (props: { size?: number; color?: string; className?: string }) => {
  const { size = 24, color = "currentColor" } = props;
  return (
    <CheckCircle size={size} color={color} />
  );
};

type ChartType = "pie" | "bar";

export default function SupporterImpactScreen() {
  const { colorScheme } = useColorScheme();
  const [chartType, setChartType] = useState<ChartType>("pie");
  const screenWidth = Dimensions.get("window").width - 40; // Accounting for padding

  // Get supporter data from redux store
  const firestoreUser = useAppSelector((state) => state.user.userData as UserData);
  const requests = useAppSelector((state) => state.request.requests) as HelpRequest[];
  
  // Calculate statistics
  const claimedTasksCount = requests.filter(
    (task) => task.status === "claimed" && task.claimedBy === firestoreUser?.userId
  ).length;
  
  const completedTasksCount = (firestoreUser as any)?.tasksCompleted || 0;
  
  const familiesSupported = firestoreUser?.families?.filter(
    (f: any) => f.status === "approved"
  ).length || 0;
  
  // Calculate task types distribution
  const [taskDistribution, setTaskDistribution] = useState([
    { name: "Meals", count: 0, color: "#FFA500", icon: Utensils },
    { name: "Childcare", count: 0, color: "#4682B4", icon: Baby },
    { name: "Groceries", count: 0, color: "#2E8B57", icon: ShoppingCart },
    { name: "Transportation", count: 0, color: "#8A2BE2", icon: Car },
    { name: "Other", count: 0, color: "#CD5C5C", icon: Heart },
  ]);
  
  // Calculate monthly progress data (dummy data for now, replace with actual data)
  const monthlyData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [3, 5, 2, 8, 12, 9], // Replace with actual monthly task data
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };
  
  // Prepare achievement badges
  const achievementBadges = [
    {
      name: "Active Helper",
      description: "Completed 5+ tasks",
      unlocked: completedTasksCount >= 5,
      icon: Medal,
      color: "#10b981",
    },
    {
      name: "Meal Master",
      description: "Provided 3+ meals",
      unlocked: (firestoreUser as any)?.mealsProvided >= 3,
      icon: Utensils,
      color: "#f59e0b",
    },
    {
      name: "Community Pillar",
      description: "Supported 3+ families",
      unlocked: familiesSupported >= 3,
      icon: Users,
      color: "#3b82f6",
    },
    {
      name: "Regular Support",
      description: "Maintained weekly support for a month",
      unlocked: (firestoreUser as any)?.weeklyProgress?.completed >= 4,
      icon: Calendar,
      color: "#ec4899",
    },
  ];
  
  // Update task distribution when requests change
  useEffect(() => {
    if (!requests.length) return;
    
    const newDistribution = [...taskDistribution];
    
    // Reset counts
    newDistribution.forEach(item => item.count = 0);
    
    // Count tasks by type
    requests.forEach(task => {
      if (task.claimedBy === firestoreUser?.userId) {
        switch (task.type as string) {
          case "meal":
            newDistribution[0].count++;
            break;
          case "childcare":
            newDistribution[1].count++;
            break;
          case "groceries":
            newDistribution[2].count++;
            break;
          case "transportation":
            newDistribution[3].count++;
            break;
          default:
            newDistribution[4].count++;
            break;
        }
      }
    });
    
    setTaskDistribution(newDistribution);
  }, [requests, firestoreUser?.userId]);
  
  // For pie chart data
  const pieChartData = taskDistribution
    .filter(item => item.count > 0)
    .map(item => ({
      name: item.name,
      count: item.count,
      color: item.color,
      legendFontColor: NAV_THEME[colorScheme].text,
      legendFontSize: 12,
    }));
  
  // Fall back to showing all categories if none have counts
  const pieChartDataWithFallback = pieChartData.length > 0 
    ? pieChartData 
    : taskDistribution.map(item => ({
        name: item.name,
        count: 0,
        color: item.color,
        legendFontColor: NAV_THEME[colorScheme].text,
        legendFontSize: 12,
      }));
  
  // For muted color reference
  const mutedColor = "#71717a";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header with back button */}
      <View className="flex-row items-center px-4 py-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={24} color={NAV_THEME[colorScheme].text} />
        </TouchableOpacity>
        <Text className="text-xl" style={{fontFamily: "Quicksand_700Bold"}}>My Impact</Text>
      </View>
      
      <ScrollView className="flex-1 px-4">
        <Animated.View entering={FadeInUp.duration(600)}>
          {/* Impact Summary Card */}
          <Card className="mb-4 mt-2">
            <CardHeader>
              <CardTitle>Impact Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row flex-wrap gap-4">
                <View className="flex-1 min-w-[45%] mb-2">
                  <Text className="text-3xl text-primary" style={{fontFamily: "Quicksand_700Bold"}}>
                    {claimedTasksCount}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Tasks Claimed
                  </Text>
                </View>

                <View className="flex-1 min-w-[45%] mb-2">
                  <Text className="text-3xl text-amber-500" style={{fontFamily: "Quicksand_700Bold"}}>
                    {familiesSupported}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Families Supported
                  </Text>
                </View>

                <View className="flex-1 min-w-[45%] mb-2">
                  <Text className="text-3xl text-emerald-500" style={{fontFamily: "Quicksand_700Bold"}}>
                    {completedTasksCount}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Tasks Completed
                  </Text>
                </View>
                
                <View className="flex-1 min-w-[45%] mb-2">
                  <Text className="text-3xl text-blue-500" style={{fontFamily: "Quicksand_700Bold"}}>
                    {(firestoreUser as any)?.mealsProvided || 0}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Meals Provided
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Task Distribution */}
          <Card className="mb-4">
            <CardHeader>
              <View className="flex-row justify-between items-center">
                <CardTitle>Task Distribution</CardTitle>
                <View className="flex-row bg-muted rounded-lg">
                  <TouchableOpacity
                    onPress={() => setChartType("pie")}
                    className={cn(
                      "p-2 rounded-lg",
                      chartType === "pie" && "bg-primary"
                    )}
                  >
                    <ChartPie
                      size={20}
                      color={
                        chartType === "pie"
                          ? "white"
                          : NAV_THEME[colorScheme].text
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setChartType("bar")}
                    className={cn(
                      "p-2 rounded-lg",
                      chartType === "bar" && "bg-primary"
                    )}
                  >
                    <ChartColumnBig
                      size={20}
                      color={
                        chartType === "bar"
                          ? "white"
                          : NAV_THEME[colorScheme].text
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </CardHeader>
            <CardContent>
              {chartType === "pie" ? (
                <View className="items-center">
                  {pieChartDataWithFallback.length > 0 ? (
                    <PieChart
                      data={pieChartDataWithFallback}
                      width={screenWidth}
                      height={220}
                      chartConfig={{
                        backgroundColor: NAV_THEME[colorScheme].background,
                        backgroundGradientFrom: NAV_THEME[colorScheme].background,
                        backgroundGradientTo: NAV_THEME[colorScheme].background,
                        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                      }}
                      accessor="count"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                    />
                  ) : (
                    <Text className="text-center text-muted-foreground py-10">
                      No tasks data available
                    </Text>
                  )}
                </View>
              ) : (
                <View className="items-center">
                  <BarChart
                    data={monthlyData}
                    width={screenWidth}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: NAV_THEME[colorScheme].background,
                      backgroundGradientFrom: NAV_THEME[colorScheme].background,
                      backgroundGradientTo: NAV_THEME[colorScheme].background,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                      labelColor: () => NAV_THEME[colorScheme].text,
                      style: {
                        borderRadius: 16,
                      },
                    }}
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                  />
                </View>
              )}
            </CardContent>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600)}>
          {/* Achievements */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row flex-wrap gap-3">
                {achievementBadges.map((badge, index) => (
                  <View 
                    key={index} 
                    className={cn(
                      "rounded-xl p-3 mb-2",
                      badge.unlocked ? "bg-primary/10" : "bg-muted"
                    )}
                    style={{ width: '48%' }}
                  >
                    <View className="flex-row items-center mb-2">
                      <badge.icon 
                        size={18} 
                        color={badge.unlocked ? badge.color : mutedColor}
                      />
                      <Text 
                        className={cn(
                          "ml-2",
                          !badge.unlocked && "text-muted-foreground"
                        )}
                        style={{fontFamily: "Quicksand_700Bold"}}
                      >
                        {badge.name}
                      </Text>
                    </View>
                    <Text 
                      className={cn(
                        "text-xs",
                        !badge.unlocked && "text-muted-foreground"
                      )}
                    >
                      {badge.description}
                    </Text>
                    {badge.unlocked && (
                      <Badge variant="default" className="mt-2">
                        Unlocked
                      </Badge>
                    )}
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>My Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Weekly Progress */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-1">
                  <Text style={{fontFamily: "Quicksand_700Bold"}}>Weekly Goal</Text>
                  <Text>
                    {(firestoreUser as any)?.weeklyProgress?.completed || 0}/
                    {(firestoreUser as any)?.weeklyProgress?.total || 3} tasks
                  </Text>
                </View>
                <View className="h-2 bg-muted rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary"
                    style={{ 
                      width: `${Math.min(
                        (((firestoreUser as any)?.weeklyProgress?.completed || 0) / 
                        ((firestoreUser as any)?.weeklyProgress?.total || 3)) * 100, 
                        100
                      )}%` 
                    }}
                  />
                </View>
              </View>

              {/* Monthly Progress */}
              <View>
                <View className="flex-row justify-between mb-1">
                  <Text style={{fontFamily: "Quicksand_700Bold"}}>Monthly Goal</Text>
                  <Text>
                    {(firestoreUser as any)?.monthlyProgress?.completed || 0}/
                    {(firestoreUser as any)?.monthlyProgress?.total || 10} tasks
                  </Text>
                </View>
                <View className="h-2 bg-muted rounded-full overflow-hidden">
                  <View
                    className="h-full bg-amber-500"
                    style={{ 
                      width: `${Math.min(
                        (((firestoreUser as any)?.monthlyProgress?.completed || 0) / 
                        ((firestoreUser as any)?.monthlyProgress?.total || 10)) * 100,
                        100
                      )}%` 
                    }}
                  />
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Call to action */}
          <Card className="mb-8">
            <CardContent className="p-4">
              <View className="items-center">
                <Heart size={40} color="#FF6B6B" className="mb-2" />
                <Text className="text-lg text-center mb-1" style={{fontFamily: "Quicksand_700Bold"}}>
                  Your Support Makes a Difference
                </Text>
                <Text className="text-center text-muted-foreground">
                  Families appreciate your help. {familiesSupported > 0 
                    ? `You've supported ${familiesSupported} ${familiesSupported === 1 ? 'family' : 'families'} so far!` 
                    : "Start claiming tasks to make an impact."}
                </Text>
              </View>
            </CardContent>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
} 