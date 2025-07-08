import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  TouchableOpacity,
  Animated as RNAnimated,
  Keyboard,
  Easing,
  Platform,
} from "react-native";
import Timeline from "react-native-timeline-flatlist";
import { HelpRequest, Message } from "@/interfaces";
import { HeartHandshake } from "@/lib/icons/HeartHandshake";
import { Utensils } from "@/lib/icons/Utensils";
import { Baby } from "@/lib/icons/Baby";
import { ShoppingCart } from "@/lib/icons/ShoppingCart";
import { Send } from "@/lib/icons/Send";
import { CirclePlus } from "@/lib/icons/CirclePlus";
import { Check } from "@/lib/icons/Check";
import { AlertTriangle } from "@/lib/icons/AlertTriangle";
import { Edit } from "@/lib/icons/Edit";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/lib/constants";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppReduxHooks";
import {
  selectUserData,
  selectSupporters,
  fetchSupporters,
} from "@/features/user/userSlice";
import * as Haptics from "expo-haptics";
import {
  selectMessagesByRequestId,
  selectMessagesLoading,
  selectHasMessagesForRequest,
  selectHasCheckedRequest,
  fetchMessages,
  sendMessage,
} from "@/features/messages/messageSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";

interface TimelineEvent {
  time: string;
  title: string;
  description?: string;
  type:
    | "created"
    | "claimed"
    | "completed"
    | "canceled"
    | "abandoned"
    | "edited"
    | "message";
  id: string;
  data?: any; // Additional data for the event
  icon?: React.ReactNode;
}

interface HelpTimelineProps {
  request: HelpRequest;
  onChatSend?: (message: string) => void;
  supporterName?: string;
}

export default function HelpTimeline({ request }: HelpTimelineProps) {
  const insets = useSafeAreaInsets();
  const [newMessage, setNewMessage] = useState("");
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const { colorScheme } = useColorScheme();
  const userData = useAppSelector(selectUserData);
  const supporters = useAppSelector(selectSupporters);
  const messages = useAppSelector((state) =>
    selectMessagesByRequestId(state, request.id)
  );
  const messagesLoading = useAppSelector(selectMessagesLoading);
  const hasMessages = useAppSelector((state) =>
    selectHasMessagesForRequest(state, request.id)
  );
  const hasCheckedRequest = useAppSelector((state) =>
    selectHasCheckedRequest(state, request.id)
  );
  const dispatch = useAppDispatch();
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  const translateYRef = useRef(new RNAnimated.Value(0)).current;
  const scrollButtonOpacity = useSharedValue(0);

  // Find the supporter who claimed this request
  const claimingSupporter = useMemo(() => {
    if (!request?.claimedBy || !supporters) return null;
    return supporters.find(
      (supporter) => supporter.userId === request.claimedBy
    );
  }, [request, supporters]);

  // Get supporter display name
  const getSupporterName = (supporterId: string) => {
    if (!supporters) return "Supporter";
    const supporter = supporters.find((s) => s.userId === supporterId);
    if (!supporter) return "Supporter";
    return supporter.firstName
      ? `${supporter.firstName}${
          supporter.lastName
            ? ` ${
                supporter.lastName.charAt(0).toUpperCase() +
                supporter.lastName.slice(1)
              }`
            : ""
        }`
      : "Supporter";
  };

  // Animated style for the scroll to bottom button
  const scrollToBottomStyle = useAnimatedStyle(() => {
    return {
      opacity: scrollButtonOpacity.value,
      transform: [{ scale: 0.9 + scrollButtonOpacity.value * 0.1 }],
    };
  });

  // Handle scrolling to the bottom of the timeline
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Handle scroll events to show/hide the scroll to bottom button
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

    // Show button if not near the bottom and content is scrollable
    const shouldShow =
      offsetY < contentHeight - scrollViewHeight - 100 &&
      contentHeight > scrollViewHeight + 100;

    if (shouldShow && !showScrollToBottom) {
      setShowScrollToBottom(true);
      scrollButtonOpacity.value = withTiming(1, { duration: 300 });
    } else if (!shouldShow && showScrollToBottom) {
      setShowScrollToBottom(false);
      scrollButtonOpacity.value = withTiming(0, { duration: 300 });
    }
  };

  useEffect(() => {
    // Fetch supporters data if not already loaded
    if (userData && (!supporters || supporters.length === 0)) {
      const families = userData.families || [];
      if (families.length > 0) {
        dispatch(fetchSupporters(families));
      }
    }
  }, [userData, supporters, dispatch]);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      "keyboardWillShow",
      (event) => {
        const { height: newKeyboardHeight } = event.endCoordinates;
        RNAnimated.timing(translateYRef, {
          toValue: insets.bottom - newKeyboardHeight, // negative value of translateY means move up
          duration: event.duration,
          easing: Easing.bezier(0.33, 0.66, 0.66, 1),
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      "keyboardWillHide",
      (event) => {
        RNAnimated.timing(translateYRef, {
          toValue: 0,
          duration: event.duration,
          easing: Easing.bezier(0.33, 0.66, 0.66, 1),
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Generate timeline events from request data and messages
  const generateTimelineEvents = useCallback(() => {
    const events: TimelineEvent[] = [];

    // Created event
    events.push({
      id: `created-${request.id}`,
      type: "created",
      time: request.createdAt.toDate().toISOString(),
      title: "Request Created",
      description: `${request.title} request was created`,
      icon: renderIcon("created", "#4ade80"),
    });

    // Process update history
    if (request.updateHistory) {
      request.updateHistory.forEach((update) => {
        const timestamp = update.timestamp.toDate().toISOString();
        let title = "";
        let description = "";
        let iconColor = "#3b82f6"; // Default blue color

        switch (update.type) {
          case "claimed":
            const supporterName = claimingSupporter
              ? `${claimingSupporter.firstName || ""} ${
                  claimingSupporter.lastName
                    ? claimingSupporter.lastName.charAt(0).toUpperCase() +
                      claimingSupporter.lastName.slice(1)
                    : ""
                }`
              : "A supporter";
            title = "Request Claimed";
            description = `${supporterName.trim()} has offered to help with this request`;
            iconColor = "#f59e0b"; // Amber color
            break;
          case "abandoned":
            title = "Request Abandoned";
            description = "The supporter has abandoned this request";
            iconColor = "#ef4444"; // Red color
            break;
          case "completed":
            title = "Request Completed";
            description = "This request has been fulfilled";
            iconColor = "#10b981"; // Green color
            break;
          case "canceled":
            title = "Request Canceled";
            description = "This request was canceled";
            iconColor = "#ef4444"; // Red color
            break;
          case "edited":
            title = "Request Updated";
            description =
              update.changes
                ?.map((change) => {
                  switch (change.field) {
                    case "title":
                      return "Title was updated";
                    case "notes":
                      return "Notes were updated";
                    case "startDateTime":
                      return "Start time was updated";
                    case "endDateTime":
                      return "End time was updated";
                    case "urgency":
                      return "Urgency level was updated";
                    case "type":
                      return "Task type was updated";
                    default:
                      return `${change.field} was updated`;
                  }
                })
                .join(", ") || "Request details were updated";
            iconColor = "#8b5cf6"; // Purple color
            break;
        }

        events.push({
          id: `${update.type}-${request.id}-${update.timestamp.toMillis()}`,
          type: update.type,
          time: timestamp,
          title,
          description,
          data: update,
          icon: renderIcon(update.type, iconColor),
        });
      });
    }

    // Find the most recent message from the current user
    const userMessages = messages.filter(
      (msg) => msg.senderId === userData?.userId
    );
    const latestUserMessageId =
      userMessages.length > 0
        ? userMessages.sort(
            (a, b) =>
              b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
          )[0].id
        : null;

    // Add messages to timeline
    messages.forEach((message: Message) => {
      const isLatestUserMessage = message.id === latestUserMessageId;
      const isSentByUser = message.senderId === userData?.userId;
      const displayName = isSentByUser
        ? "You"
        : getSupporterName(message.senderId);

      events.push({
        id: `message-${message.id}`,
        type: "message",
        time: message.createdAt.toDate().toISOString(),
        title: displayName,
        description: message.text,
        data: {
          message,
          isLatestUserMessage,
        },
        icon: renderIcon("message", "#8b5cf6"),
      });
    });

    // Sort events by time
    return events.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [request, messages, userData?.userId, claimingSupporter]);

  // Update timeline data when dependencies change
  useEffect(() => {
    if (!messagesLoading) {
      const events = generateTimelineEvents();
      setTimelineData(events);
    }
  }, [messagesLoading]);

  // Fetch messages when component mounts or request changes
  useEffect(() => {
    const fetchMessagesForRequest = async () => {
      // Skip fetching if we already have messages for this request or if we've already checked it
      if (hasMessages || hasCheckedRequest || !request.claimedBy) {
        return;
      }

      try {
        await dispatch(
          fetchMessages({
            requestId: request.id,
            parentId: request.parentId,
            claimerId: request.claimedBy!,
          })
        );
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessagesForRequest();
  }, [
    request.id,
    request.parentId,
    request.claimedBy,
    dispatch,
    hasMessages,
    hasCheckedRequest,
  ]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userData) return;

    try {
      await dispatch(
        sendMessage({
          requestId: request.id,
          parentId: request.parentId,
          claimerId: request.claimedBy!,
          text: newMessage,
          senderId: userData.userId,
          senderName:
            userData.displayName ||
            userData.firstName ||
            userData.lastName ||
            "a parent",
        })
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewMessage("");
      // Close keyboard
      Keyboard.dismiss();

      // Scroll to bottom after sending a message
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    } catch (error) {
      console.error("Error sending message:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        text1: "Error sending message",
        text2: "Please try again",
        type: "error",
        visibilityTime: 3000,
        position: "top",
      });
    }
  };

  const renderDetail = (rowData: TimelineEvent) => {
    const date = new Date(rowData.time);
    const isSentByUser = rowData.type === "message" && rowData.title === "You";

    return (
      <View className="bg-card p-2 rounded-lg ml-1">
        <View className="gap-2 mb-2">
          <Text
            className="text-primary"
            style={{ fontFamily: "Quicksand_700Bold" }}
          >
            {rowData.title}
          </Text>
          <Text className="text-muted-foreground text-sm">
            {format(date, "MMM d, yyyy 'at' h:mm a")}
          </Text>
        </View>

        {rowData.type === "message" ? (
          <View
            className={cn(
              "p-3 rounded-lg mt-1 relative",
              isSentByUser
                ? "bg-blue-50 border border-blue-100 dark:bg-blue-900 dark:border-blue-800"
                : "bg-gray-50 border border-gray-100 dark:bg-gray-900 dark:border-gray-800"
            )}
          >
            <View
              className={cn(
                "absolute top-0 w-2 h-2 rounded-full",
                isSentByUser ? "bg-blue-400 -left-1" : "bg-gray-400 -right-1"
              )}
            />
            <Text
              style={{
                fontFamily: "Quicksand_500Medium",
              }}
            >
              {rowData.description}
            </Text>

            {/* Message read status - only show for the latest message from the current user */}
            {rowData.data?.isLatestUserMessage && (
              <View className="flex-row items-center justify-end mt-1">
                <View className="flex-row items-center">
                  <Text className="text-xs text-muted-foreground mr-1">
                    {rowData.data.message.read ? "Read" : "Delivered"}
                  </Text>
                  <Ionicons
                    name={
                      rowData.data.message.read ? "checkmark-done" : "checkmark"
                    }
                    size={12}
                    color={rowData.data.message.read ? "#4ade80" : "#94a3b8"}
                  />
                </View>
              </View>
            )}
          </View>
        ) : (
          <Text>{rowData.description}</Text>
        )}

        {/* Show request details for created event */}
        {rowData.type === "created" && (
          <View className="mt-3 bg-background p-3 rounded-lg">
            <View className="flex-row items-center mb-1">
              <Badge variant="outline" className="mr-2">
                <Text className="text-xs capitalize">{request.type}</Text>
              </Badge>
              <Badge
                variant={
                  request.urgency === "high"
                    ? "destructive"
                    : request.urgency === "medium"
                    ? "default"
                    : "secondary"
                }
              >
                <Text
                  className={cn(
                    "text-xs capitalize",
                    request.urgency === "low" ? "text-foreground" : "text-white"
                  )}
                >
                  {request.urgency}
                </Text>
              </Badge>
            </View>
            <Text className="text-sm text-muted-foreground">
              Scheduled for{" "}
              {format(request.startDateTime.toDate(), "EEE, MMM d 'at' h:mm a")}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderTime = (rowData: TimelineEvent) => {
    const date = new Date(rowData.time);
    return (
      <View className="items-end pr-2">
        <Text className="text-muted-foreground text-sm">
          {format(date, "MMM")}
        </Text>
        <Text
          className="text-foreground text-xl"
          style={{ fontFamily: "Quicksand_700Bold" }}
        >
          {date.getDate()}
        </Text>
      </View>
    );
  };

  const renderIcon = (eventType: string, color: string) => {
    let icon;

    switch (eventType) {
      case "created":
        icon = <CirclePlus size={16} color="white" />;
        break;
      case "claimed":
        icon = <HeartHandshake size={16} color="white" />;
        break;
      case "completed":
        icon = <Check size={16} color="white" />;
        break;
      case "canceled":
      case "abandoned":
        icon = <AlertTriangle size={16} color="white" />;
        break;
      case "edited":
        icon = <Edit size={16} color="white" />;
        break;
      case "message":
        icon = <Ionicons name="chatbubble-ellipses" size={16} color="white" />;
        break;
      default:
        // Default to task type based icon
        switch (request.type) {
          case "meal":
            icon = <Utensils size={16} color="white" />;
            break;
          case "babysitting":
          case "childcare":
            icon = <Baby size={16} color="white" />;
            break;
          case "groceries":
            icon = <ShoppingCart size={16} color="white" />;
            break;
          default:
            icon = <HeartHandshake size={16} color="white" />;
        }
    }

    return (
      <View className="p-2 rounded-full" style={{ backgroundColor: color }}>
        {icon}
      </View>
    );
  };

  const getStatusColor = () => {
    switch (request.status) {
      case "open":
        return "bg-primary/10 text-primary";
      case "claimed":
        return "bg-amber-500/10 text-amber-600";
      case "completed":
        return "bg-emerald-500/10 text-emerald-600";
      case "canceled":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Only allow chat if request is claimed but not completed or canceled
  const isChatEnabled = request.status === "claimed" && request.claimedBy;

  return (
    <View className="flex-1">
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Status card with title */}
        <Card className="mx-4 mb-4">
          <CardContent className="p-4">
            <Text
              className="text-xl mb-2"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              Request Timeline
            </Text>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-muted-foreground">Current Status</Text>
              <View className={`px-3 py-1 rounded-full ${getStatusColor()}`}>
                <Text
                  className="capitalize"
                  style={{ fontFamily: "Quicksand_500Medium" }}
                >
                  {request.status}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Main timeline */}
        <View className="flex-1 mx-4">
          {isGeneratingTimeline ? (
            <View className="flex-1 items-center justify-center py-8">
              <Text className="text-muted-foreground">Loading timeline...</Text>
            </View>
          ) : (
            <Timeline
              data={timelineData}
              renderDetail={renderDetail}
              renderTime={renderTime}
              circleSize={32}
              lineWidth={2}
              lineColor={NAV_THEME[colorScheme].primary}
              showTime={false}
              style={{ flex: 1 }}
              listViewContainerStyle={{ paddingLeft: 10 }}
              innerCircle={"icon"}
              isUsingFlatlist={false}
            />
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* Floating scroll to bottom button */}
      <Animated.View
        className="absolute bottom-32 right-4 z-10"
        style={{ opacity: showScrollToBottom ? 1 : 0 }}
      >
        <Animated.View style={scrollToBottomStyle}>
          <TouchableOpacity
            onPress={scrollToBottom}
            className="w-12 h-12 rounded-full bg-primary items-center justify-center shadow-md pointer-events-auto"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Ionicons name="arrow-down" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Chat input - only shown if claimed and not completed */}
      {isChatEnabled && (
        <RNAnimated.View
          style={{
            transform: [
              {
                translateY: Platform.OS === "ios" ? translateYRef : 0,
              },
            ],
          }}
          className="px-4 pb-4 pt-2 border-t border-muted bg-card flex-row items-center"
        >
          <Textarea
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Send a message to coordinate..."
            className="flex-1 mr-2 bg-background"
            multiline
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full ${
              !newMessage.trim() ? "bg-muted" : "bg-primary"
            }`}
          >
            <Send size={20} color={!newMessage.trim() ? "#71717a" : "#fff"} />
          </TouchableOpacity>
        </RNAnimated.View>
      )}
    </View>
  );
}
