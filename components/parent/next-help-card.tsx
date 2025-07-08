import React from "react";
import { View } from "react-native";
import { Link } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import AnimatedLottieView from "lottie-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Soup } from "@/lib/icons/Soup";
import { ShoppingCart } from "@/lib/icons/ShoppingCart";
import { Baby } from "@/lib/icons/Baby";
import { HandHelping } from "@/lib/icons/HandHelping";
import { Clock } from "@/lib/icons/Clock";
import { User } from "@/lib/icons/User";
import { ChevronRight } from "@/lib/icons/ChevronRight";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { HelpRequest } from "@/interfaces";
import { formatDistanceToNow } from "date-fns";
import { Info } from "@/lib/icons/Info";

interface NextHelpCardProps {
  requests: HelpRequest[];
}

const NextHelpCard: React.FC<NextHelpCardProps> = ({ requests }) => {
  const { colorScheme } = useColorScheme();

  return (
    <Card>
      <CardContent>
        {(() => {
          // Find the next upcoming claimed task
          const now = new Date();
          const upcomingClaimedTasks = requests
            .filter(
              (req) =>
                req.status === "claimed" && req.startDateTime.toDate() > now
            )
            .sort(
              (a, b) =>
                a.startDateTime.toDate().getTime() -
                b.startDateTime.toDate().getTime()
            );

          const nextTask = upcomingClaimedTasks[0];

          if (nextTask) {
            // Format date nicely
            const startDate = nextTask.startDateTime.toDate();
            const formattedDate = startDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            });
            const formattedTime = startDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });

            // Calculate time remaining
            const timeRemainingText = formatDistanceToNow(startDate, {
              addSuffix: true,
            });

            // Get task type icon
            const getTaskIcon = () => {
              switch (nextTask.type) {
                case "meal":
                  return (
                    <Soup size={18} color={NAV_THEME[colorScheme].primary} />
                  );
                case "groceries":
                  return (
                    <ShoppingCart
                      size={18}
                      color={NAV_THEME[colorScheme].primary}
                    />
                  );
                case "babysitting":
                case "childcare":
                  return (
                    <Baby size={18} color={NAV_THEME[colorScheme].primary} />
                  );
                default:
                  return (
                    <HandHelping
                      size={18}
                      color={NAV_THEME[colorScheme].primary}
                    />
                  );
              }
            };

            return (
              <Animated.View entering={FadeIn.duration(500)} className="py-2">
                <View className="justify-between items-start mb-3">
                  <View className="flex-row items-center">
                    {getTaskIcon()}
                    <Text
                      className="text-xl ml-2"
                      style={{ fontFamily: "Quicksand_700Bold" }}
                    >
                      {nextTask.title}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-1 gap-1">
                    <Clock size={14} color={NAV_THEME[colorScheme].primary} />
                    <View className="bg-primary/10 py-1 px-3 rounded-full flex-row items-center justify-start">
                      <Text
                        className="text-primary"
                        style={{ fontFamily: "Quicksand_700Bold" }}
                      >
                        {timeRemainingText}
                      </Text>
                    </View>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <Info
                          size={16}
                          color={NAV_THEME[colorScheme].text}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <Text className="text-muted-foreground">
                          {formattedDate} at {formattedTime}
                        </Text>
                      </TooltipContent>
                    </Tooltip>
                  </View>
                </View>

                {/* Show supporter info if available (using type assertion for optional properties) */}
                {(() => {
                  // Use type assertion to access potential properties safely
                  const taskWithSupporter = nextTask as any;
                  if (taskWithSupporter.supporterId) {
                    return (
                      <View className="flex-row items-center bg-muted/50 p-2 rounded-md mb-3">
                        <User size={16} color="#71717a" className="mr-2" />
                        <Text className="text-muted-foreground">
                          Claimed by{" "}
                          <Text className="text-foreground" style={{fontFamily: "Quicksand_700Bold"}}>
                            {taskWithSupporter.supporterName || "a supporter"}
                          </Text>
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}

                <View className="border-l-4 border-primary pl-3 py-1 mb-3">
                  <Text className="text-muted-foreground">
                    {nextTask.notes && nextTask.notes.length > 80
                      ? nextTask.notes.substring(0, 80) + "..."
                      : nextTask.notes || "No additional notes"}
                  </Text>
                </View>

                <View className="bg-muted rounded-md p-2 flex-row justify-between items-center">
                  <Text className="text-sm text-muted-foreground">
                    Type:{" "}
                    <Text className="text-foreground capitalize">
                      {nextTask.type}
                    </Text>
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Urgency:{" "}
                    <Text className="text-foreground capitalize">
                      {nextTask.urgency}
                    </Text>
                  </Text>
                </View>

                <Link
                  href={`/parent/requests/${nextTask.id}`}
                  className="mt-3"
                  asChild
                >
                  <Button
                    variant="outline"
                    className="w-full flex-row justify-center items-center"
                  >
                    <Text className="mr-1">View Details</Text>
                    <ChevronRight size={16} color="#71717a" />
                  </Button>
                </Link>
              </Animated.View>
            );
          } else {
            return (
              <>
                <Text className="text-muted-foreground">
                  No support scheduled yet. Request help now!
                </Text>
                <AnimatedLottieView
                  source={require("@/assets/lottie/help.json")}
                  autoPlay
                  loop
                  style={{ width: 100, height: 100, marginHorizontal: "auto" }}
                />
              </>
            );
          }
        })()}
      </CardContent>
      <CardFooter className="w-full">
        <Link href="/parent/(tabs)/requests" asChild>
          <Button size="lg" className="mt-3 w-full">
            <Text className="text-lg">
              {requests.some(
                (req) =>
                  req.status === "claimed" &&
                  req.startDateTime.toDate() > new Date()
              )
                ? "View All Requests"
                : "Request Help"}
            </Text>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default NextHelpCard;
