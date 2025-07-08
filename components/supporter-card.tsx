import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import Animated, {
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "@/lib/icons/Trash2";
import { Supporter, FamilyConnection } from "@/interfaces";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "@/lib/icons/CheckCircle";
import { Utensils } from "@/lib/icons/Utensils";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
// import { Clock } from "@/lib/icons/Clock";
// import { Calendar } from "@/lib/icons/Calendar";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import {
  updateUserData,
  selectUserData,
  fetchSupporters,
} from "@/features/user/userSlice";
import { updateSupporter } from "@/features/user/userAPI";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

export default function SupporterCard({
  item,
  index,
}: {
  item: Supporter;
  index: number;
}) {
  const dispatch = useAppDispatch();
  const firestoreUser = useAppSelector(selectUserData);
  const isNotAccepted =
    firestoreUser?.families &&
    firestoreUser?.families.findIndex(
      (f) => f.id === item.userId && f.status !== "approved"
    ) !== -1;

  const [isLoading, setIsLoading] = useState(false);
  // const [selectedSupporter, setSelectedSupporter] = useState<Supporter | null>(
  //   null
  // );
  // const [showThankYouModal, setShowThankYouModal] = useState(false);
  // const [customMessage, setCustomMessage] = useState("");
  const scaleAnim = useSharedValue(1);
  const cardElevation = useSharedValue(2);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Animated styles for card interactions
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnim.value }],
      elevation: cardElevation.value,
      style: {
        shadowOpacity: 0.1 + cardElevation.value * 0.03,
        shadowRadius: cardElevation.value,
        shadowOffset: { width: 0, height: cardElevation.value / 2 },
      }
    };
  });

  // Helper to get badge background based on type
  const getBadgeBackground = (badgeType: string) => {
    if (isDark) {
      switch (badgeType) {
        case "Active Helper":
          return "rgba(74, 222, 128, 0.2)";
        case "Meal Master":
          return "rgba(250, 204, 21, 0.2)";
        default:
          return "rgba(99, 102, 241, 0.2)";
      }
    } else {
      switch (badgeType) {
        case "Active Helper":
          return "rgba(74, 222, 128, 0.12)";
        case "Meal Master":
          return "rgba(250, 204, 21, 0.12)";
        default:
          return "rgba(99, 102, 241, 0.12)";
      }
    }
  };

  // Helper to get badge text color based on type
  const getBadgeTextColor = (badgeType: string) => {
    switch (badgeType) {
      case "Active Helper":
        return "#10b981";
      case "Meal Master":
        return "#f59e0b";
      default:
        return NAV_THEME[colorScheme].primary;
    }
  };

  const getBadges = (supporter: Supporter) => {
    const badges = [];

    if (supporter.tasksCompleted >= 5)
      badges.push({
        name: "Active Helper",
        icon: <CheckCircle size={14} color="#10b981" />,
      });

    if (supporter.mealsProvided >= 3)
      badges.push({
        name: "Meal Master",
        icon: <Utensils size={14} color="#f59e0b" />,
      });

    return badges;
  };

  const approveSupporter = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const existingFamilies = firestoreUser!.families ?? [];

    const updatedFamilies: FamilyConnection[] = existingFamilies.map((family) =>
      family.id === item.userId ? { ...family, status: "approved" } : family
    );

    try {
      const updatedUser = await dispatch(
        updateUserData({
          userId: firestoreUser!.userId,
          updatedData: {
            families: updatedFamilies,
          },
        })
      );
      if (updatedUser.type === "users/updateUserData/fulfilled") {
        const result = await updateSupporter(
          item.userId,
          firestoreUser!.userId,
          "approved",
          firestoreUser!.displayName ||
            firestoreUser!.firstName ||
            firestoreUser!.lastName ||
            "A parent"
        );

        if (!result || result.error) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

          // Revert the status to pending
          const updatedFamilies: FamilyConnection[] = existingFamilies.map(
            (family) =>
              family.id === item.userId
                ? { ...family, status: "pending" }
                : family
          );

          await dispatch(
            updateUserData({
              userId: firestoreUser!.userId,
              updatedData: {
                families: updatedFamilies,
              },
            })
          );

          Alert.alert(
            "Something went wrong",
            "While approving the family connection, we encountered an error. Please try again."
          );
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Toast.show({
            type: "success",
            text1: "Family connection approved successfully",
            text2: "They can now see your requests",
            visibilityTime: 5000,
            position: "top",
          });
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          "Something went wrong",
          "While approving the family connection, we encountered an error. Please try again."
        );
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error approving supporter:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Something went wrong",
        "While approving the family connection, we encountered an error. Please try again."
      );
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSupporter = () => {
    Alert.alert(
      "Remove Supporter",
      `Are you sure you want to remove ${item.displayName} from your support network?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);

            const existingFamilies = firestoreUser!.families ?? [];
            const updatedFamilies: FamilyConnection[] = existingFamilies.filter(
              (family) => family.id !== item.userId
            );

            try {
              const updatedUser = await dispatch(
                updateUserData({
                  userId: firestoreUser!.userId,
                  updatedData: {
                    families: updatedFamilies,
                  },
                })
              );

              if (updatedUser.type === "users/updateUserData/fulfilled") {
                const result = await updateSupporter(
                  item.userId,
                  firestoreUser!.userId,
                  "rejected",
                  firestoreUser!.displayName ||
                    firestoreUser!.firstName ||
                    firestoreUser!.lastName ||
                    "A parent"
                );

                if (!result || result.error) {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Error
                  );

                  // Revert the status to pending
                  const updatedFamilies: FamilyConnection[] =
                    existingFamilies.map((family) =>
                      family.id === item.userId
                        ? { ...family, status: "approved" }
                        : family
                    );

                  await dispatch(
                    updateUserData({
                      userId: firestoreUser!.userId,
                      updatedData: {
                        families: updatedFamilies,
                      },
                    })
                  );

                  Alert.alert(
                    "Something went wrong",
                    "While approving the family connection, we encountered an error. Please try again."
                  );
                } else {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                  // Refresh the supporters list after successful deletion
                  await dispatch(fetchSupporters(updatedFamilies));
                  Toast.show({
                    type: "success",
                    text1: "Family connection removed successfully",
                    text2: "They will no longer be able to see your requests",
                    visibilityTime: 5000,
                    position: "top",
                  });
                }
              } else {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error
                );
                Alert.alert(
                  "Something went wrong",
                  "While approving the family connection, we encountered an error. Please try again."
                );
              }
            } catch (error) {
              console.error("Error deleting supporter:", error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                "Something went wrong",
                "While deleting the family connection, we encountered an error. Please try again."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 80).duration(400)}
      style={cardAnimatedStyle}
      className="my-4"
    >
      <Card className="overflow-hidden border-0 rounded-2xl shadow-sm">
        <View className="p-4">
          {/* Header Section */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Avatar
                alt={`${item.displayName || "Supporter"}`}
                className="h-12 w-12 rounded-full border-2 border-primary/20"
              >
                <AvatarImage source={{ uri: item.photoUrl || undefined }} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80">
                  <Text
                    className="text-lg"
                    style={{ fontFamily: "Quicksand_700Bold" }}
                  >
                    {item.displayName?.charAt(0).toUpperCase()}
                  </Text>
                </AvatarFallback>
              </Avatar>
              <View className="ml-3">
                <Text
                  className="text-lg"
                  style={{ fontFamily: "Quicksand_700Bold" }}
                >
                  {item.displayName}
                </Text>
                {!isNotAccepted && (
                  <View className="flex-row items-center mt-1">
                    <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
                    <Text className="text-xs text-muted-foreground">
                      Active
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {!isNotAccepted && !isLoading && (
              <TouchableOpacity
                onPress={deleteSupporter}
                className="p-2 rounded-full bg-red-50"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Stats Section */}
          {/* {!isNotAccepted && (
            <View className="flex-row justify-between mb-4">
              <View className="flex-1 bg-primary/5 rounded-xl p-3 mr-2">
                <View className="flex-row items-center">
                  <CheckCircle
                    size={14}
                    color={NAV_THEME[colorScheme].primary}
                    className="mr-2"
                  />
                  <Text className="text-sm" style={{fontFamily: "Quicksand_700Bold"}}>Tasks Completed</Text>
                </View>
                <Text className="text-2xl mt-1" style={{fontFamily: "Quicksand_700Bold"}}>
                  {item.tasksCompleted || 0}
                </Text>
              </View>
              <View className="flex-1 bg-primary/5 rounded-xl p-3">
                <View className="flex-row items-center">
                  <Calendar
                    size={14}
                    color={NAV_THEME[colorScheme].primary}
                    className="mr-2"
                  />
                  <Text className="text-sm" style={{fontFamily: "Quicksand_700Bold"}}>Last Active</Text>
                </View>
                <Text className="text-2xl mt-1" style={{fontFamily: "Quicksand_700Bold"}}>
                  {item.lastActive || "Recent"}
                </Text>
              </View>
            </View>
          )} */}

          {/* Badges Section */}
          {!isNotAccepted && getBadges(item).length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {getBadges(item).map((badge, idx) => (
                <Badge
                  key={idx}
                  style={{
                    backgroundColor: getBadgeBackground(badge.name),
                  }}
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border-0"
                >
                  {badge.icon}
                  <Text
                    className="text-xs"
                    style={{
                      color: getBadgeTextColor(badge.name),
                      fontFamily: "Quicksand_700Bold",
                    }}
                  >
                    {badge.name}
                  </Text>
                </Badge>
              ))}
            </View>
          )}

          {/* Action Button */}
          {isNotAccepted ? (
            <Button
              onPress={approveSupporter}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <View className="flex-row items-center">
                  <CheckCircle size={16} color="white" className="mr-2" />
                  <Text>Approve Supporter</Text>
                </View>
              )}
            </Button>
          ) : null}
        </View>
      </Card>
    </Animated.View>
  );
}

const ProgressBar = ({
  label,
  completed,
  total,
}: {
  label: string;
  completed: number;
  total: number;
}) => (
  <View className="mt-2">
    <Text
      className="text-xs text-muted-foreground"
      style={{ fontFamily: "Quicksand_700Bold" }}
    >
      {label}: {completed}/{total}
    </Text>
    <Progress value={(completed / total) * 100} className="h-2 mt-1" />
  </View>
);
