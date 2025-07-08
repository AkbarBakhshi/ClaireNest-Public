import React, { useEffect, useState } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppSelector } from "@/hooks/useAppReduxHooks";
import { selectMessages } from "@/features/messages/messageSlice";
import { selectRequests } from "@/features/request/requestSlice";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Clock } from "@/lib/icons/Clock";

interface ActivityItem {
  id: string;
  type: "message" | "status_change";
  timestamp: Date;
  title: string;
  description: string;
  requestId: string;
}

const RecentActivityCard: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const messages = useAppSelector(selectMessages);
  const requests = useAppSelector(selectRequests);
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    // Collect recent activities from messages and request status changes
    const newActivities: ActivityItem[] = [];

    // Add recent messages
    messages.forEach((message) => {
      const request = requests.find((req) => req.id === message.requestId);
      if (request) {
        newActivities.push({
          id: `message-${message.id}`,
          type: "message",
          timestamp: message.createdAt.toDate(),
          title: "New Message",
          description: `New message about "${request.title}"`,
          requestId: request.id,
        });
      }
    });

    // Add recent status changes (claimed, completed, etc.)
    requests.forEach((request) => {
      if (request.updatedAt && request.status !== "open") {
        newActivities.push({
          id: `status-${request.id}`,
          type: "status_change",
          timestamp: request.updatedAt.toDate(),
          title: `Request ${request.status}`,
          description: `Your request "${request.title}" was ${request.status}`,
          requestId: request.id,
        });
      }
    });

    // Sort by timestamp (newest first) and take the 5 most recent
    const sortedActivities = newActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);

    setActivities(sortedActivities);
  }, [messages, requests]);

  const navigateToRequest = (requestId: string) => {
    router.push(`/parent/requests/${requestId}`);
  };

  const renderActivityItem = ({
    item,
    index,
  }: {
    item: ActivityItem;
    index: number;
  }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
      <TouchableOpacity
        className="mb-3 pb-3 border-b border-muted last:border-0"
        onPress={() => navigateToRequest(item.requestId)}
      >
        <View className="flex-row items-center mb-1">
          <View
            className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
              item.type === "message"
                ? "bg-purple-100 dark:bg-purple-900"
                : "bg-amber-100 dark:bg-amber-900"
            }`}
          >
            <Ionicons
              name={
                item.type === "message"
                  ? "chatbubble-ellipses"
                  : "notifications"
              }
              size={16}
              color={item.type === "message" ? "#8b5cf6" : "#f59e0b"}
            />
          </View>
          <View className="flex-1">
            <Text
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              {item.title}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {item.description}
            </Text>
            <View className="flex-row items-center gap-1 mt-1">
              <Clock size={16} className="text-primary" />
              <Text className="text-xs text-muted-foreground">
                {format(item.timestamp, "MMM d, h:mm a")}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()}>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <FlatList
              data={activities}
              renderItem={renderActivityItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View className="py-2">
              <Text className="text-muted-foreground">
                No updates yet. Invite supporters to join!
              </Text>
            </View>
          )}
        </CardContent>
      </Card>
    </Animated.View>
  );
};

export default RecentActivityCard;
