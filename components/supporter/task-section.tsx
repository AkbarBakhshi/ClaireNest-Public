import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { H2 } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Info } from "@/lib/icons/Info";
import { AppLink } from "@/components/supporter/app-link";
import Animated, { FadeInDown } from "react-native-reanimated";
import { HelpRequest } from "@/interfaces";

// Import types from expo-router for proper typing
import type { LinkProps } from "expo-router";

interface TaskSectionProps {
  title: string;
  tasks: HelpRequest[];
  variant?: "overdue" | "claimed" | "available";
  alertMessage?: string;
  alertColor?: string;
  renderTaskCard: (task: HelpRequest) => React.ReactNode;
  viewAllLink?: string;
  emptyMessage?: string;
  delay?: number;
}

export function TaskSection({
  title,
  tasks,
  variant = "available",
  alertMessage,
  alertColor,
  renderTaskCard,
  viewAllLink,
  emptyMessage = "No tasks to display",
  delay = 0,
}: TaskSectionProps) {
  const getBadgeVariant = () => {
    switch (variant) {
      case "overdue":
        return "destructive";
      case "claimed":
        return "default";
      case "available":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getAlertBackgroundColor = () => {
    if (alertColor) return alertColor;

    switch (variant) {
      case "overdue":
        return "bg-destructive/10";
      case "claimed":
        return "bg-amber-500/10";
      default:
        return "bg-muted";
    }
  };

  const getAlertTextColor = () => {
    if (alertColor) return alertColor;

    switch (variant) {
      case "overdue":
        return "text-destructive";
      case "claimed":
        return "text-amber-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getInfoIconColor = () => {
    switch (variant) {
      case "overdue":
        return "#ef4444";
      case "claimed":
        return "#f59e0b";
      default:
        return "#71717a";
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600).springify()}>
      <View className="flex-row justify-between items-center mb-2">
        <H2
          className="text-xl"
          style={{ fontFamily: "Quicksand_700Bold" }}
        >
          {title}
        </H2>
        <Badge variant={getBadgeVariant()}>
          <Text className={variant !== "available" ? "text-white" : ""}>
            {tasks.length}
          </Text>
        </Badge>
      </View>

      {alertMessage && (
        <View className={`${getAlertBackgroundColor()} p-3 rounded-lg mb-3`}>
          <View className="flex-row items-center">
            <Info size={16} color={getInfoIconColor()} className="mr-2" />
            <Text className={`text-sm ${getAlertTextColor()}`}>
              {alertMessage}
            </Text>
          </View>
        </View>
      )}

      {tasks.length > 0 ? (
        <>
          {tasks.slice(0, 3).map((task) => renderTaskCard(task))}

          {tasks.length > 3 && viewAllLink && (
            <AppLink 
              href={viewAllLink} 
              variant="ghost" 
              className="mt-1 mb-4"
              fallbackComponent={
                <Button variant="ghost" className="mt-1 mb-4">
                  <Text>
                    View All {title} ({tasks.length})
                  </Text>
                </Button>
              }
            >
              <Text>
                View All {title} ({tasks.length})
              </Text>
            </AppLink>
          )}
        </>
      ) : (
        <View className="bg-muted p-8 rounded-lg items-center mb-2">
          <Text
            className="text-center text-muted-foreground"
            style={{ fontFamily: "Quicksand_700Bold" }}
          >
            {emptyMessage}
          </Text>
        </View>
      )}

      <Separator className="mb-6 mt-2" />
    </Animated.View>
  );
}
