import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "@/lib/icons/Clock";
import { Link } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { HelpRequest } from "@/interfaces";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";

interface DashboardTaskCardProps {
  task: HelpRequest;
  parentName: string;
  isOverdue: boolean;
  onClaim?: (task: HelpRequest) => void;
  onAbandon?: (task: HelpRequest) => void;
  isLoading: boolean;
}

export function DashboardTaskCard({
  task,
  parentName,
  isOverdue,
  onClaim,
  onAbandon,
  isLoading,
}: DashboardTaskCardProps) {
  const { colorScheme } = useColorScheme();
  const startDate = task.startDateTime.toDate();
  const isClaimed = task.status === "claimed";
  
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Animated.View
      entering={FadeInUp.duration(300).delay(100)}
      className="mb-3"
    >
      <Card>
        <CardContent className="p-0">
          <View className="p-3 flex-row justify-between items-center border-b border-border">
            <View className="flex-row items-center gap-2">
              <Badge
                variant={
                  isOverdue
                    ? "destructive"
                    : isClaimed
                    ? "default"
                    : "secondary"
                }
              >
                <Text className={isOverdue || isClaimed ? "text-white" : ""}>
                  {isOverdue ? "Overdue" : isClaimed ? "Claimed" : "Available"}
                </Text>
              </Badge>
              <Badge variant="outline">
                <Text className="capitalize">{task.urgency}</Text>
              </Badge>
            </View>
            <View className="flex-row items-center">
              <Clock size={14} color="#71717a" className="mr-1" />
              <Text className="text-muted-foreground text-sm">
                {formattedDate} at {formattedTime}
              </Text>
            </View>
          </View>

          <View className="p-3">
            <Text
              className="text-lg mb-1"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              {task.title}
            </Text>
            <Text className="text-muted-foreground mb-2">
              For {parentName}
            </Text>
            {task.notes ? (
              <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                {task.notes}
              </Text>
            ) : null}
          </View>

          <View className="flex-row justify-between items-center p-3 border-t border-border">
            <Link href={`/supporter/requests/${task.id}`} asChild>
              <Button variant="ghost" size="sm">
                <Text>View Details</Text>
              </Button>
            </Link>
            {isClaimed ? (
              <Button
                variant="destructive"
                size="sm"
                onPress={() => onAbandon && onAbandon(task)}
                disabled={isLoading}
              >
                <Text className="text-white">Abandon</Text>
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onPress={() => onClaim && onClaim(task)}
                disabled={isLoading}
              >
                <Text className="text-white">Claim</Text>
              </Button>
            )}
          </View>
        </CardContent>
      </Card>
    </Animated.View>
  );
} 