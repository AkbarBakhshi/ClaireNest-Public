import { useLocalSearchParams, router, Link } from "expo-router";
import {
  View,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppReduxHooks";
import {
  selectRequests,
  deleteRequest,
  updateRequest,
} from "@/features/request/requestSlice";
import {
  selectUserData,
  selectSupporters,
  fetchSupporters,
} from "@/features/user/userSlice";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { parseISO } from "date-fns";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import HelpTimeline from "@/components/parent/help-timeline";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompletingRequest, setIsCompletingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "timeline">("details");
  const isMounted = useRef(true);
  const dispatch = useAppDispatch();
  const { colorScheme } = useColorScheme();

  const requests = useAppSelector(selectRequests);
  const request = requests.find((request) => request.id === id);
  const userData = useAppSelector(selectUserData);
  const supporters = useAppSelector(selectSupporters);

  // Determine if current user is the request owner
  const isRequestOwner = userData?.userId === request?.parentId;

  // Find the supporter who claimed this request
  const claimingSupporter = useMemo(() => {
    if (!request?.claimedBy || !supporters) return null;
    return supporters.find(
      (supporter) => supporter.userId === request.claimedBy
    );
  }, [request, supporters]);

  // Get formatted supporter name or default to "A supporter" if not found
  const claimingSupporterName = useMemo(() => {
    if (!claimingSupporter) return request?.claimedBy ? "A supporter" : null;

    return claimingSupporter.firstName
      ? `${claimingSupporter.firstName}${
          claimingSupporter.lastName
            ? ` ${
                claimingSupporter.lastName.charAt(0).toUpperCase() +
                claimingSupporter.lastName.slice(1)
              }`
            : ""
        }`
      : "A supporter";
  }, [claimingSupporter, request?.claimedBy]);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonsScale = useSharedValue(0.8);
  const deleteButtonScale = useSharedValue(1);
  const editButtonScale = useSharedValue(1);
  const completeButtonScale = useSharedValue(1);
  const statusHighlight = useSharedValue(0);

  // Determine if request is expired (missed)
  const now = new Date();
  const isExpired = request
    ? request.startDateTime?.toDate() < now && request.status === "open"
    : false;

  useEffect(() => {
    // Only run animations if request exists
    if (!request) return;

    // Sequence the animations for a nice entrance effect
    setTimeout(() => {
      headerOpacity.value = withTiming(1, { duration: 500 });
    }, 100);

    setTimeout(() => {
      buttonsScale.value = withSpring(1, { damping: 12 });
    }, 300);

    setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration: 700 });
    }, 500);

    // Highlight status if expired
    if (isExpired) {
      setTimeout(() => {
        statusHighlight.value = withTiming(1, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        });
      }, 800);
    }
  }, [request]);

  const buttonsContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonsScale.value }],
    };
  });

  const editButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: editButtonScale.value }],
    };
  });

  const deleteButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: deleteButtonScale.value }],
    };
  });

  const completeButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: completeButtonScale.value }],
    };
  });

  const statusStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      statusHighlight.value,
      [0, 1, 0],
      [
        "transparent",
        isExpired ? "rgba(239, 68, 68, 0.1)" : "rgba(52, 211, 153, 0.1)",
        "transparent",
      ]
    );

    return {
      backgroundColor,
    };
  });

  // Fetch supporters if needed
  useEffect(() => {
    if (
      request?.claimedBy &&
      userData &&
      (!supporters || supporters.length === 0)
    ) {
      const families = userData.families || [];
      if (families.length > 0) {
        dispatch(fetchSupporters(families));
      }
    }
  }, [request, userData, supporters, dispatch]);

  // Set up mounting cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleDeleteRequest = async () => {
    // Don't attempt to delete if request doesn't exist
    if (!request || !id) {
      Toast.show({
        type: "error",
        text1: "Request not found",
        text2: "Cannot delete a request that doesn't exist",
        visibilityTime: 3000,
        position: "top",
      });

      // Navigate back to the requests list
      setTimeout(() => {
        if (isMounted.current) {
          router.replace("/parent/(tabs)/requests");
        }
      }, 300);

      return;
    }

    try {
      setIsDeleting(true);

      const result = await dispatch(deleteRequest(id as string));

      if (deleteRequest.rejected.match(result)) {
        Toast.show({
          type: "error",
          text1: "Error deleting request",
          text2: "Please try again",
          visibilityTime: 3000,
          position: "top",
        });
        throw new Error(
          (result.payload as string) || "Failed to delete request"
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.back();
      Toast.show({
        type: "success",
        text1: "Request deleted successfully",
        text2: "Your request has been removed",
        visibilityTime: 5000,
        position: "top",
      });
    } catch (error) {
      console.error("Error deleting request:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Error deleting request",
        text2: "Please try again",
        visibilityTime: 5000,
        position: "top",
      });
      setIsDeleting(false);
    }
  };

  const handleCompleteRequest = async () => {
    if (!request || !id) {
      Toast.show({
        type: "error",
        text1: "Request not found",
        text2: "Cannot complete a request that doesn't exist",
        visibilityTime: 3000,
        position: "top",
      });
      return;
    }

    try {
      setIsCompletingRequest(true);

      const result = await dispatch(
        updateRequest({
          id: request.id,
          updatedFields: {
            status: "completed",
          },
          currentUserId: userData!.userId,
          updateType: "completed",
        })
      );

      if (updateRequest.rejected.match(result)) {
        Toast.show({
          type: "error",
          text1: "Error completing request",
          text2: "Please try again",
          visibilityTime: 3000,
          position: "top",
        });
        throw new Error(
          (result.payload as string) || "Failed to complete request"
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Toast.show({
        type: "success",
        text1: "Request completed",
        text2: "Your request has been marked as completed",
        visibilityTime: 5000,
        position: "top",
      });

      // Switch to timeline tab to show the completion
      setActiveTab("timeline");
    } catch (error) {
      console.error("Error completing request:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Error completing request",
        text2: "Please try again",
        visibilityTime: 3000,
        position: "top",
      });
    } finally {
      setIsCompletingRequest(false);
    }
  };

  const onPressInEdit = () => {
    editButtonScale.value = withTiming(0.95, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onPressOutEdit = () => {
    editButtonScale.value = withTiming(1, { duration: 100 });
  };

  const onPressInDelete = () => {
    deleteButtonScale.value = withTiming(0.95, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const onPressOutDelete = () => {
    deleteButtonScale.value = withTiming(1, { duration: 100 });
  };

  const onPressInComplete = () => {
    completeButtonScale.value = withTiming(0.95, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onPressOutComplete = () => {
    completeButtonScale.value = withTiming(1, { duration: 100 });
  };

  // Status message for the claimed request
  const getStatusMessage = () => {
    if (!request) return "";

    if (request.status === "claimed" && claimingSupporterName) {
      return `${claimingSupporterName} has offered to help with this request`;
    } else if (request.status === "completed") {
      return "This request has been completed";
    } else if (isExpired) {
      return "This request has passed without being claimed";
    }
    return "";
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        {request ? (
          <>
            {/* <Animated.View
              className="px-4 flex-row justify-between items-center border-b border-muted pb-2 elevation-2xl"
              entering={FadeIn.delay(200).duration(300)}
            >
              <Button
                variant="ghost"
                size="sm"
                onPress={() => {
                  try {
                    router.back();
                  } catch (navError) {
                    console.error("Navigation error on back button:", navError);
                    router.replace("/parent/(tabs)/requests");
                  }
                }}
                disabled={isDeleting}
                className="flex-row items-center gap-1 px-0"
              >
                <Ionicons
                  name="arrow-back-outline"
                  size={24}
                  color={NAV_THEME[colorScheme].primary}
                />
              </Button>
              <Text
                className="text-xl"
                style={{ fontFamily: "Quicksand_700Bold" }}
              >
                Request Details
              </Text>
              <View style={{ width: 24 }} />
            </Animated.View> */}

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
                          request.status === "claimed"
                            ? "bg-amber-500/10"
                            : request.status === "completed"
                            ? "bg-emerald-500/10"
                            : isExpired
                            ? "bg-destructive/10"
                            : "bg-muted"
                        }`}
                      >
                        <Text
                          className={`${
                            request.status === "claimed"
                              ? "text-amber-600"
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

                  {/* Details card */}
                  <Animated.View
                    entering={FadeInDown.duration(800).springify()}
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
                      <Animated.View
                        style={[isExpired ? statusStyle : {}]}
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
                      </Animated.View>
                    </Animated.View>

                    {/* Add supporter details if request is claimed */}
                    {request.status === "claimed" && request.claimedBy && (
                      <Animated.View
                        entering={FadeInLeft.delay(250).duration(400)}
                        className="flex-row justify-between mb-2"
                      >
                        <Text
                          className="text-lg"
                          style={{ fontFamily: "Quicksand_700Bold" }}
                        >
                          Claimed By
                        </Text>
                        <View className="flex-row items-center">
                          <Text>{claimingSupporterName}</Text>
                        </View>
                      </Animated.View>
                    )}

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
                      entering={FadeIn.delay(800).duration(400)}
                      className="mb-2 text-lg text-foreground"
                      style={{ fontFamily: "Quicksand_700Bold" }}
                    >
                      Notes
                    </Animated.Text>
                    <Animated.Text
                      entering={FadeIn.delay(1000).duration(500)}
                      className="text-foreground"
                    >
                      {request.notes || "No additional notes provided."}
                    </Animated.Text>
                  </Animated.View>

                  {/* Supporter details card - shown only for claimed requests */}
                  {request.status === "claimed" && request.claimedBy && (
                    <Animated.View
                      entering={FadeInDown.delay(600).duration(800).springify()}
                      className="bg-card p-4 rounded-lg mx-4 mb-4"
                    >
                      <Animated.Text
                        entering={FadeIn.delay(800).duration(400)}
                        className="mb-3 text-lg text-foreground"
                        style={{ fontFamily: "Quicksand_700Bold" }}
                      >
                        Supporter Information
                      </Animated.Text>

                      <View className="bg-muted/30 p-3 rounded-lg mb-3">
                        <View className="flex-row items-center mb-2 gap-2">
                          <Avatar alt={claimingSupporterName || "Supporter"}>
                            <AvatarImage
                              source={{
                                uri: claimingSupporter?.photoUrl || "",
                              }}
                            />
                            <AvatarFallback>
                              <Text className="text-muted-foreground">
                                {claimingSupporterName?.charAt(0)}
                              </Text>
                            </AvatarFallback>
                          </Avatar>
                          <Text
                            style={{ fontFamily: "Quicksand_600SemiBold" }}
                            className="text-base"
                          >
                            {claimingSupporterName}
                          </Text>
                        </View>

                        {claimingSupporter && (
                          <Button
                            variant="outline"
                            className="w-full flex-row items-center justify-center bg-primary/5"
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
                  )}
                </ScrollView>
              </>
            ) : (
              /* Timeline tab content */
              <View className="flex-1">
                {request && (
                  <HelpTimeline
                    request={request}
                    supporterName={claimingSupporterName || undefined}
                  />
                )}
              </View>
            )}

            {/* Action Buttons - show only in details tab */}
            {activeTab === "details" && (
              <Animated.View
                style={buttonsContainerStyle}
                className="flex-row w-full items-center gap-2 mt-2 px-4 mb-4 flex-wrap"
              >
                {/* Complete Button - Only shown to request owner and for requests that are not completed/canceled */}
                {isRequestOwner &&
                  request.status !== "completed" &&
                  request.status !== "canceled" && (
                    <Animated.View
                      style={completeButtonStyle}
                      className="flex-1 min-w-[45%]"
                    >
                      <Button
                        variant="default"
                        className="w-full flex-row items-center justify-center bg-emerald-500"
                        disabled={isCompletingRequest || isDeleting}
                        onPressIn={onPressInComplete}
                        onPressOut={onPressOutComplete}
                        onPress={() => {
                          Alert.alert(
                            "Complete Request",
                            "Are you sure you want to mark this request as completed? You will not be able to edit or reopen this request after completion.",
                            [
                              {
                                text: "Cancel",
                                style: "cancel",
                              },
                              {
                                text: "Complete",
                                onPress: handleCompleteRequest,
                              },
                            ],
                            { cancelable: true }
                          );
                        }}
                      >
                        {isCompletingRequest ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={16}
                              color="white"
                              style={{ marginRight: 6 }}
                            />
                            <Text className="text-white">
                              Mark as Completed
                            </Text>
                          </>
                        )}
                      </Button>
                    </Animated.View>
                  )}

                {request.status !== "completed" && (
                  <Animated.View
                    style={editButtonStyle}
                    className="flex-1 min-w-[45%]"
                  >
                    <Link href={`/parent/requests/${id}/edit`} asChild>
                      <Button
                        variant="outline"
                        className="w-full flex-row items-center justify-center"
                        disabled={isDeleting || !request}
                        onPressIn={onPressInEdit}
                        onPressOut={onPressOutEdit}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={16}
                          color={NAV_THEME[colorScheme].text}
                          style={{ marginRight: 6 }}
                        />
                        <Text>Edit</Text>
                      </Button>
                    </Link>
                  </Animated.View>
                )}

                <Animated.View
                  style={deleteButtonStyle}
                  className="flex-row w-full items-center gap-2 mt-2 mb-4 flex-wrap"
                >
                  {Platform.OS === "android" && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onPress={() => router.back()}
                    >
                      <Text>Go Back</Text>
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="w-full flex-row items-center justify-center"
                    disabled={isDeleting || !request}
                    onPressIn={onPressInDelete}
                    onPressOut={onPressOutDelete}
                    onPress={() => {
                      if (!request) return;

                      Alert.alert(
                        "Delete Request",
                        "Are you sure you want to delete this request?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel",
                          },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => {
                              // Extra check to verify component is still mounted
                              if (isMounted.current) {
                                handleDeleteRequest();
                              }
                            },
                          },
                        ],
                        { cancelable: true }
                      );
                    }}
                  >
                    {isDeleting ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="white"
                          style={{ marginRight: 6 }}
                        />
                        <Text className="text-white">Delete</Text>
                      </>
                    )}
                  </Button>
                </Animated.View>
              </Animated.View>
            )}
          </>
        ) : (
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
        )}
      </View>
    </SafeAreaView>
  );
}
