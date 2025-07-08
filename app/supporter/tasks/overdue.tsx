import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "@/lib/icons/AlertTriangle";
import TaskList from "@/components/supporter/task-list";
import { Link, Stack, router } from "expo-router";
import { ChevronLeft } from "@/lib/icons/ChevronLeft";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppReduxHooks";
import {
  selectRequests,
  selectRequestLoading,
  selectRequestError,
  updateRequest,
} from "@/features/request/requestSlice";
import { selectUserData } from "@/features/user/userSlice";
import { HelpRequest } from "@/interfaces";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { sendClaimedTaskPushNotification } from "@/features/request/requestAPI";

export default function OverdueTasksScreen() {
  const { colorScheme } = useColorScheme();
  const dispatch = useAppDispatch();
  const firestoreUser = useAppSelector(selectUserData);
  const requests = useAppSelector(selectRequests);
  const loading = useAppSelector(selectRequestLoading);
  const error = useAppSelector(selectRequestError);
  const [isLoading, setIsLoading] = useState(false);

  // Check if a task is overdue (start time is in the past)
  const isOverdue = (task: HelpRequest) => {
    const now = new Date();
    const startDate = task.startDateTime.toDate();
    return startDate < now && task.status === "open";
  };

  // Get all overdue tasks
  const overdueTasks = requests
    .filter((task) => isOverdue(task))
    .sort(
      (a, b) =>
        new Date(a.startDateTime.toDate()).getTime() -
        new Date(b.startDateTime.toDate()).getTime()
    );

  const claimTask = async (task: HelpRequest) => {
    setIsLoading(true);
    try {
      const result = await dispatch(
        updateRequest({
          id: task.id,
          updatedFields: {
            status: "claimed",
            claimedBy: firestoreUser!.userId,
          },
          currentUserId: firestoreUser!.userId,
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
      await sendClaimedTaskPushNotification(task, firestoreUser!.displayName || "A supporter");
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-4">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center mt-4 mb-6">
        <Button
          variant="ghost"
          className="p-0 mr-2"
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={NAV_THEME[colorScheme].primary} />
        </Button>

        <Text
          className="text-2xl"
          style={{ fontFamily: "Quicksand_700Bold" }}
        >
          Overdue Tasks
        </Text>
      </View>

      {error && (
        <View className="my-4">
          <Alert icon={AlertTriangle} variant="destructive">
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>
              Something went wrong. Please try again later!
            </AlertDescription>
          </Alert>
        </View>
      )}

      <Animated.View className="flex-1" entering={FadeInUp.duration(300)}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={NAV_THEME[colorScheme].primary}
          />
        ) : overdueTasks.length > 0 ? (
          <View>
            <View className="my-4 bg-destructive/10 p-3 rounded-lg">
              <Text className="text-destructive text-center">
                These tasks require immediate attention
              </Text>
            </View>
            <TaskList
              tasks={overdueTasks}
              onClaim={claimTask}
              isLoading={isLoading}
            />
          </View>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text
              className="text-center text-xl"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              No overdue tasks to display
            </Text>
            <Link href="/" asChild>
              <Button variant="outline" className="mt-4">
                <Text>Return to Home</Text>
              </Button>
            </Link>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
