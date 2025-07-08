import { useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  FadeOutUp,
  FadeInUp,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Utensils } from "@/lib/icons/Utensils";
import { ShoppingCart } from "@/lib/icons/ShoppingCart";
import { Wand } from "@/lib/icons/Wand";
import { Baby } from "@/lib/icons/Baby";
import { Card } from "@/components/ui/card";
import { HelpRequest } from "@/interfaces";
import { Text } from "@/components/ui/text";
import { AlertTriangle } from "@/lib/icons/AlertTriangle";
import { OctagonAlert } from "@/lib/icons/OctagonAlert";
import { CircleAlert } from "@/lib/icons/CircleAlert";
import { Button } from "@/components/ui/button";
import { Link } from "expo-router";
import { format } from "date-fns";

export default function TaskCard({
  task,
  onClaim,
  isLoading,
  onAbandon,
  showOverdueBadge,
}: {
  task: HelpRequest;
  onClaim?: (task: HelpRequest) => void;
  isLoading: boolean;
  onAbandon?: (task: HelpRequest) => void;
  showOverdueBadge?: boolean;
}) {
  const [claimed, setClaimed] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleClaim = () => {
    scale.value = withTiming(0.95, { duration: 200 });
    setTimeout(() => {
      setClaimed(true);
      onClaim?.(task);
    }, 250);
  };

  const handleAbandon = () => {
    Alert.alert("Are you sure you want to withdraw from this task?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Withdraw", style: "destructive", onPress: () => {
        scale.value = withTiming(0.95, { duration: 200 });
        setTimeout(() => {
          setClaimed(false);
          onAbandon?.(task);
        }, 250);
      } },
    ]);
  };
  const getTaskType = () => {
    switch (task.type) {
      case "meal":
        return {
          icon: <Utensils size={18} color="#FFB703" />,
          label: "Meal Delivery",
        };
      case "groceries":
        return {
          icon: <ShoppingCart size={18} color="#219EBC" />,
          label: "Groceries",
        };
      case "babysitting":
        return {
          icon: <Baby size={18} color="#FB8500" />,
          label: "Babysitting",
        };
      case "childcare":
        return {
          icon: <Baby size={18} color="#FB8500" />,
          label: "Childcare",
        };
      case "other":
        return {
          icon: <Wand size={18} color="#8E44AD" />,
          label: "Other",
        };
      default:
        return { icon: null, label: "" };
    }
  };

  const getUrgency = () => {
    switch (task.urgency) {
      case "high":
        return {
          icon: <OctagonAlert size={18} color="#EF4444" />,
          label: "High Urgency",
        };
      case "medium":
        return {
          icon: <AlertTriangle size={18} color="#F59E0B" />,
          label: "Medium Urgency",
        };
      case "low":
        return {
          icon: <CircleAlert size={18} color="#10B981" />,
          label: "Low Urgency",
        };
      default:
        return { icon: null, label: "" };
    }
  };

  const { icon: urgencyIcon, label: urgencyLabel } = getUrgency();
  const { icon: typeIcon, label: typeLabel } = getTaskType();

  const startDate = task.startDateTime.toDate();
  const endDate =
    task.endDateTime?.toDate() ||
    new Date(startDate.getTime() + 1 * 60 * 60 * 1000);
  const isSameDay = startDate.toDateString() === endDate.toDateString();

  // Check if the task is overdue (start time is in the past)
  const isTaskOverdue = showOverdueBadge && startDate < new Date();

  return (
    !claimed && (
      <Animated.View entering={FadeInUp} exiting={FadeOutUp} className="mt-2">
        <Animated.View style={animatedStyle}>
          <Card className="p-4 flex-col">
            {/* Urgency & Type Row */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-1">
                {urgencyIcon}
                <Text className="text-sm" style={{fontFamily: "Quicksand_500Medium"}}>{urgencyLabel}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                {typeIcon}
                <Text className="text-sm" style={{fontFamily: "Quicksand_500Medium"}}>{typeLabel}</Text>
              </View>
            </View>

            {/* Task Details */}
            <View className="mb-2">
              <View className="flex-row items-center">
                <Text style={{ fontFamily: "Quicksand_700Bold" }} className="text-lg">{task.title}</Text>
                {isTaskOverdue && (
                  <View className="ml-2 bg-destructive rounded-lg px-2 py-0.5">
                    <Text className="text-xs text-white" style={{fontFamily: "Quicksand_700Bold"}}>OVERDUE</Text>
                  </View>
                )}
              </View>
              <Text className="text-sm text-muted-foreground">
                {isSameDay
                  ? format(startDate, "MMM dd, yyyy")
                  : `${format(startDate, "MMM dd")} - ${format(
                      endDate,
                      "MMM dd, yyyy"
                    )}`}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {`${format(startDate, "h:mm a")} - ${format(
                  endDate,
                  "h:mm a"
                )} ${!task.endDateTime ? "(Approx)" : ""}`}
              </Text>
            </View>

            {/* Claim Button */}
            {onClaim ? (
              <Button onPress={handleClaim} className="self-end">
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text>Claim</Text>
                )}
              </Button>
            ) : (
              <View className="flex-row items-center justify-between gap-2">
                <Button variant="destructive" onPress={handleAbandon} className="self-end flex-1">
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white">Withdraw</Text>
                )}
              </Button>
              <Link href={`/supporter/requests/${task.id}`} asChild className="flex-1">
                <Button className="self-end">
                  <Text>Send Message</Text>
                </Button>
              </Link>
              </View>
            )}
          </Card>
        </Animated.View>
      </Animated.View>
    )
  );
}
