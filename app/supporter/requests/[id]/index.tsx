import React, { useEffect, useState, useRef } from "react";
import { View, TouchableOpacity, ScrollView, Platform } from "react-native";
import { Button } from "@/components/ui/button";
import { useLocalSearchParams, router } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import {
  selectRequests,
  updateRequest,
} from "@/features/request/requestSlice";
import { 
  selectUserData, 
  selectApprovedFamilies, 
  fetchApprovedFamilies 
} from "@/features/user/userSlice";
import { HelpRequest, UserData } from "@/interfaces";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/lib/constants";
import SupporterHelpTimeline from "@/components/supporter/help-timeline";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  ZoomIn,
} from "react-native-reanimated";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Toast from "react-native-toast-message";
import { scheduleTaskReminderNotification, cancelTaskReminderNotification } from "@/lib/local-notifications";
import { sendClaimedTaskPushNotification } from "@/features/request/requestAPI";

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const dispatch = useAppDispatch();
  const requests = useAppSelector(selectRequests);
  const request = requests.find((request) => request.id === id);
  const userData = useAppSelector(selectUserData);
  const approvedFamilies = useAppSelector(selectApprovedFamilies);
  const [activeTab, setActiveTab] = useState<"details" | "timeline">("details");
  const isMounted = useRef(true);
  const [isLoading, setIsLoading] = useState(false);

  // Check if this support has claimed the request
  const isClaimedByCurrentUser = request?.claimedBy === userData?.userId;

  // Find the parent who created this request
  const requestParent = request?.parentId && approvedFamilies 
    ? approvedFamilies.find((parent: UserData) => parent.userId === request.parentId) 
    : null;

  // Get formatted parent name
  const parentName = requestParent 
    ? requestParent.firstName
      ? `${requestParent.firstName}${requestParent.lastName ? ` ${requestParent.lastName.charAt(0).toUpperCase()}` : ''}`
      : "Parent"
    : "Parent";

  // Determine if request is expired (missed)
  const now = new Date();
  const isExpired = request
    ? request.startDateTime?.toDate() < now && request.status === "open"
    : false;

  // Fetch families data if needed
  useEffect(() => {
    if (request?.parentId && userData && (!approvedFamilies || approvedFamilies.length === 0)) {
      const families = userData.families || [];
      if (families.length > 0) {
        dispatch(fetchApprovedFamilies(families));
      }
    }
  }, [request, userData, approvedFamilies, dispatch]);

  // Set up mounting cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Status message for the request
  const getStatusMessage = () => {
    if (!request) return "";

    if (request.status === "claimed") {
      return isClaimedByCurrentUser 
        ? "You have offered to help with this request. We will send you 2 reminders 24 hours and 1 hour before the task starts (if applicable)." 
        : "This request has been claimed by another supporter";
    } else if (request.status === "completed") {
      return "This request has been completed";
    } else if (isExpired) {
      return "This request has passed without being claimed";
    }
    return "";
  };

  if (!request) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Animated.View
          entering={ZoomIn.duration(400).springify()}
          className="flex-1 justify-center items-center p-4"
        >
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text
            className="text-2xl text-destructive mt-4 mb-2 text-center"
            style={{ fontFamily: "Quicksand_700Bold" }}
          >
            Request Not Found
          </Text>
          <Text className="text-muted-foreground text-center mb-6">
            The request you're looking for may have been deleted or doesn't
            exist
          </Text>
          <Button onPress={() => router.replace("/")} className="mt-4">
            <Text>Go Back to Home</Text>
          </Button>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const claimTask = async (task: HelpRequest) => {
    setIsLoading(true);
    try {
      const { notificationIds } = await scheduleTaskReminderNotification(task, new Date(task.startDateTime!.toDate()));
      const result = await dispatch(
        updateRequest({
          id: task.id,
          updatedFields: {
            status: "claimed",
            claimedBy: userData!.userId,
            notificationIds: notificationIds,
          },
          currentUserId: userData!.userId,  
          updateType: "claimed",
        })
      );
      if (updateRequest.rejected.match(result)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: "Error claiming request",
          text2: "Please try again",
          visibilityTime: 5000,
          position: "top",
        });
        throw new Error(
          (result.payload as string) || "Failed to claim request"
        );
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await sendClaimedTaskPushNotification(task, userData!.displayName || "A supporter");
      Toast.show({
        type: "success",
        text1: "Request claimed successfully",
        text2: "You have claimed this request!",
        visibilityTime: 5000,
        position: "top",
      });
    } catch (error) {
      console.error("Error claiming request:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Error claiming request",
        text2: "Please try again",
        visibilityTime: 5000,
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const abandonTask = async (task: HelpRequest) => {
    setIsLoading(true);
    try {
      await cancelTaskReminderNotification(task.notificationIds || []);
      const result = await dispatch(
        updateRequest({
          id: task.id,
          updatedFields: {
            status: "open",
            claimedBy: null,
            notificationIds: [],
          },
          currentUserId: userData!.userId,
          updateType: "abandoned",
        })
      );
      if (updateRequest.rejected.match(result)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: "Error abandoning request",
          text2: "Please try again",
          visibilityTime: 5000,
          position: "top",
        });
        throw new Error(
          (result.payload as string) || "Failed to abandon request"
        );
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Request abandoned successfully",
        text2: "You have abandoned this request!",
        visibilityTime: 5000,
        position: "top",
      });
    } catch (error) {
      console.error("Error abandoning request:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Error abandoning request",
        text2: "Please try again",
        visibilityTime: 5000,
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        {/* Tab navigation */}
        <View className="flex-row border-b border-muted mb-4">
          <TouchableOpacity
            onPress={() => setActiveTab("details")}
            className={`flex-1 py-3 px-4 ${
              activeTab === "details" ? "border-b-2 border-primary" : ""
            }`}
          >
            <Text
              className={`text-center text-xl ${
                activeTab === "details"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              style={{
                fontFamily:
                  activeTab === "details"
                    ? "Quicksand_700Bold"
                    : "Quicksand_400Regular",
              }}
            >
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("timeline")}
            className={`flex-1 py-3 px-4 ${
              activeTab === "timeline" ? "border-b-2 border-primary" : ""
            }`}
          >
            <Text
              className={`text-center text-xl ${
                activeTab === "timeline"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              style={{
                fontFamily:
                  activeTab === "timeline"
                    ? "Quicksand_700Bold"
                    : "Quicksand_400Regular",
              }}
            >
              Timeline
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "details" ? (
          <>
            <ScrollView className="flex-1">
              {/* Title */}
              <View className="px-4 mb-4">
                <Text
                  className="text-2xl mb-2"
                  style={{ fontFamily: "Quicksand_700Bold" }}
                >
                  {request.title}
                </Text>

                {getStatusMessage() ? (
                  <View
                    className={`p-3 rounded-lg mb-4 ${
                      request.status === "claimed" && isClaimedByCurrentUser
                        ? "bg-amber-500/10"
                        : request.status === "claimed" && !isClaimedByCurrentUser
                        ? "bg-blue-500/10"
                        : request.status === "completed"
                        ? "bg-emerald-500/10"
                        : isExpired
                        ? "bg-destructive/10"
                        : "bg-muted"
                    }`}
                  >
                    <Text
                      className={`${
                        request.status === "claimed" && isClaimedByCurrentUser
                          ? "text-amber-600"
                          : request.status === "claimed" && !isClaimedByCurrentUser
                          ? "text-blue-600"
                          : request.status === "completed"
                          ? "text-emerald-600"
                          : isExpired
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {getStatusMessage()}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Parent info card */}
              <Animated.View
                entering={FadeInDown.delay(200).duration(800).springify()}
                className="bg-card p-4 rounded-lg mb-4 mx-4"
              >
                <Animated.Text
                  entering={FadeIn.delay(300).duration(400)}
                  className="mb-3 text-lg text-foreground"
                  style={{ fontFamily: "Quicksand_700Bold" }}
                >
                  Parent Information
                </Animated.Text>
                
                <View className="bg-muted/30 p-3 rounded-lg">
                  <View className="flex-row items-center mb-2 gap-2">
                    <Avatar alt={parentName}>
                      <AvatarImage
                        source={{
                          uri: requestParent?.photoUrl || "",
                        }}
                      />
                      <AvatarFallback>
                        <Text className="text-muted-foreground">
                          {parentName?.charAt(0)}
                        </Text>
                      </AvatarFallback>
                    </Avatar>
                    <Text
                      style={{ fontFamily: "Quicksand_600SemiBold" }}
                      className="text-base"
                    >
                      {parentName}
                    </Text>
                  </View>
                  
                  {request.status === "claimed" && isClaimedByCurrentUser && (
                    <Button
                      variant="outline"
                      className="w-full flex-row items-center justify-center bg-primary/5 mt-2"
                      onPress={() => setActiveTab("timeline")}
                    >
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={16}
                        color={NAV_THEME[colorScheme].primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text className="text-primary">
                        View Communication Timeline
                      </Text>
                    </Button>
                  )}
                </View>
              </Animated.View>

              {/* Details card */}
              <Animated.View
                entering={FadeInDown.duration(600).springify()}
                className="bg-card p-4 rounded-lg mb-4 mx-4"
              >
                <Animated.View
                  entering={FadeInLeft.delay(200).duration(400)}
                  className="flex-row justify-between mb-2"
                >
                  <Text
                    className="text-lg"
                    style={{ fontFamily: "Quicksand_700Bold" }}
                  >
                    Status
                  </Text>
                  <View
                    className={`px-2 py-1 rounded-full ${
                      isExpired ? "bg-destructive/10" : ""
                    }`}
                  >
                    <Text
                      className={`capitalize ${
                        isExpired ? "text-destructive" : ""
                      }`}
                    >
                      {isExpired ? "Missed" : request.status}
                    </Text>
                  </View>
                </Animated.View>

                <Animated.View
                  entering={FadeInLeft.delay(300).duration(400)}
                  className="flex-row justify-between mb-2"
                >
                  <Text
                    className="text-lg"
                    style={{ fontFamily: "Quicksand_700Bold" }}
                  >
                    Type
                  </Text>
                  <Text className="capitalize">{request.type}</Text>
                </Animated.View>

                <Animated.View
                  entering={FadeInLeft.delay(400).duration(400)}
                  className="flex-row justify-between mb-2"
                >
                  <Text
                    className="text-lg"
                    style={{ fontFamily: "Quicksand_700Bold" }}
                  >
                    Urgency
                  </Text>
                  <Text className="capitalize">{request.urgency}</Text>
                </Animated.View>

                <Animated.View
                  entering={FadeInLeft.delay(500).duration(400)}
                  className="flex-row justify-between mb-2"
                >
                  <Text
                    className="text-lg"
                    style={{ fontFamily: "Quicksand_700Bold" }}
                  >
                    Start Date & Time
                  </Text>
                  <Text>
                    {request && request.startDateTime
                      ? format(
                          parseISO(
                            request.startDateTime.toDate().toISOString()
                          ),
                          "EEE MMM d, yyyy h:mma"
                        )
                      : "Not specified"}
                  </Text>
                </Animated.View>

                <Animated.View
                  entering={FadeInLeft.delay(600).duration(400)}
                  className="flex-row justify-between mb-2"
                >
                  <Text
                    className="text-lg"
                    style={{ fontFamily: "Quicksand_700Bold" }}
                  >
                    End Date & Time
                  </Text>
                  <Text>
                    {request && request.endDateTime
                      ? format(
                          parseISO(
                            request.endDateTime.toDate().toISOString()
                          ),
                          "EEE MMM d, yyyy h:mma"
                        )
                      : "N/A"}
                  </Text>
                </Animated.View>
              </Animated.View>

              {/* Notes card */}
              <Animated.View
                entering={FadeInDown.delay(400).duration(800).springify()}
                className="bg-card p-4 rounded-lg mx-4 mb-4"
              >
                <Animated.Text
                  entering={FadeIn.delay(500).duration(400)}
                  className="mb-2 text-lg text-foreground"
                  style={{ fontFamily: "Quicksand_700Bold" }}
                >
                  Notes
                </Animated.Text>
                <Animated.Text
                  entering={FadeIn.delay(600).duration(500)}
                  className="text-foreground"
                >
                  {request.notes || "No additional notes provided."}
                </Animated.Text>
              </Animated.View>

              {/* Action Buttons - Only show claim button if not claimed */}
              {request.status === "open" && (
                <View className="px-4 mb-4">
                  <Button
                    disabled={isLoading}
                    variant="default"
                    className="w-full flex-row items-center justify-center bg-primary"
                    onPress={() => claimTask(request)}
                  >
                    <Ionicons
                      name="hand-left-outline"
                      size={16}
                      color="white"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-white">Offer to Help</Text>
                  </Button>
                </View>
              )}

              {/* Withdraw help button - only if claimed by this supporter */}
              {request.status === "claimed" && isClaimedByCurrentUser && (
                <View className="px-4 mb-4">
                  <Button
                    variant="destructive"
                    className="w-full flex-row items-center justify-center"
                    onPress={() => abandonTask(request)}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={16}
                      color="white"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-white">Withdraw Help</Text>
                  </Button>
                </View>
              )}

              {Platform.OS === "android" && (
                <View className="px-4 mb-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onPress={() => router.back()}
                  >
                    <Text>Go Back</Text>
                  </Button>
                </View>
              )}
              

            </ScrollView>
          </>
        ) : (
          /* Timeline tab content */
          <View className="flex-1">
            <SupporterHelpTimeline request={request} parentUser={requestParent} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
