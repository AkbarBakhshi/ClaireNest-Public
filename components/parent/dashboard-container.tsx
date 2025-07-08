import React, { useEffect, useState } from "react";
import { Dimensions, View } from "react-native";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import EmailVerifiedBanner from "@/components/email-verified-banner";
import JourneyCard from "./journey-card";
import RequestSummaryCard from "./request-summary-card";
import SupporterStatsCard from "./supports-stats-card";
import NextHelpCard from "./next-help-card";
import RecentActivityCard from "./recent-activity-card";
import { HelpRequest, UserData } from "@/interfaces";
import { Button } from "@/components/ui/button";
import { Link } from "expo-router";

interface DashboardContainerProps {
  firestoreUser: UserData;
  requests: HelpRequest[];
  taskStats: {
    total: number;
    completed: number;
    open: number;
    claimed: number;
    expired: number;
  };
  supporterStats: {
    total: number;
    pending: number;
  };
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({
  firestoreUser,
  requests,
  taskStats,
  supporterStats,
}) => {
  const [encouragingMessage, setEncouragingMessage] = useState("");

  // Check if user has any active families
  const hasActiveFamilies = firestoreUser?.families?.some(
    (family) => family.status !== "pending"
  );

  // Prepare chart data for pie chart
  const chartData = [
    {
      name: "Completed",
      count: taskStats.completed,
      color: "#34D399",
      legendFontColor: "#6B7280",
      legendFontSize: 12,
    },
    {
      name: "Open",
      count: taskStats.open,
      color: "#3B82F6",
      legendFontColor: "#6B7280",
      legendFontSize: 12,
    },
    {
      name: "Claimed",
      count: taskStats.claimed,
      color: "#FBBF24",
      legendFontColor: "#6B7280",
      legendFontSize: 12,
    },
    {
      name: "Missed",
      count: taskStats.expired,
      color: "#EF4444",
      legendFontColor: "#6B7280",
      legendFontSize: 12,
    },
  ];

  // Shared values for animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    // Start animations when component mounts
    opacity.value = withTiming(1, { duration: 800 });
    translateY.value = withTiming(0, { duration: 800 });

    // Simulate AI-generated encouragement (Replace with API call later)
    const messages = [
      "You're doing an amazing job! One day at a time. 💛",
      "Parenting is tough, but so are you! Keep going. 🌟",
      "You're not alone—your community is here for you! 🤝",
      "Small wins matter! Celebrate every smile and giggle. 😊",
      "Breathe in, breathe out—you've got this. 🌿",
      "Even the smallest acts of love make a big difference. 🐣",
      "You’re building a beautiful story, one moment at a time. 📖",
      "Let today be soft. You don’t have to do it all. 🌈",
      "Trust yourself—you’re exactly the parent your child needs. 🧸",
      "It’s okay to rest. You’re growing a whole human heart. ❤️",
    ];
    setEncouragingMessage(
      messages[Math.floor(Math.random() * messages.length)]
    );
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <SafeAreaView className="flex-1 px-4 bg-background">
      {!firestoreUser?.emailVerified && (
        <EmailVerifiedBanner email={firestoreUser.email!} />
      )}
      <Animated.ScrollView
        className="flex-1 px-4 pt-6"
        style={[animatedContainerStyle]}
      >
        {/* Welcome Message */}
        <Text className="text-3xl" style={{ fontFamily: "Quicksand_700Bold" }}>
          Welcome,{" "}
          {firestoreUser?.firstName ||
            firestoreUser.displayName?.split(" ")[0] ||
            "there"}
          ! 👋
        </Text>
        <Text className="text-lg text-muted-foreground mt-1">
          Here's an overview of your support plan.
        </Text>
        {/* Parenting Journey Card */}
        <JourneyCard encouragingMessage={encouragingMessage} />

        {!hasActiveFamilies ? (
          <View className="mt-8 p-6 bg-primary/5 rounded-xl">
            <Text
              className="text-xl mb-4"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              Get Started with ClaireNest
            </Text>

            <Text className="mb-6">
              To begin receiving support, you'll need to invite your trusted
              family and friends to join your network.
            </Text>
            <Link href="/parent/(tabs)/supporters" asChild>
              <Button className="w-full">
                <Text
                  className="text-white"
                  style={{ fontFamily: "Quicksand_700Bold" }}
                >
                  Build Your Support Network
                </Text>
              </Button>
            </Link>
          </View>
        ) : (
          <>
            {/* Task Summary Card */}
            <Text
              className="text-2xl mt-6 mb-2"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              Request Summary
            </Text>
            <RequestSummaryCard taskStats={taskStats} chartData={chartData} />

            {/* Supporter Stats Card */}
            <Text
              className="text-2xl mt-6 mb-2"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              Supporter Network
            </Text>
            <SupporterStatsCard
              total={supporterStats.total}
              pending={supporterStats.pending}
            />

            {/* Next Help Card */}
            <Text
              className="text-2xl mt-6 mb-2"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              Next Help Coming Up
            </Text>
            <Animated.View style={animatedContainerStyle}>
              <NextHelpCard requests={requests} />
            </Animated.View>

            {/* Recent Activity Card */}
            <Animated.View style={animatedContainerStyle}>
              <RecentActivityCard />
            </Animated.View>
          </>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default DashboardContainer;
