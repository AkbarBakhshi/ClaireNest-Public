import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

// UI Components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "@/lib/icons/AlertTriangle";
import { Button } from "@/components/ui/button";
import { Filter } from "@/lib/icons/Filter";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
// Custom components
import EmailVerifiedBanner from "@/components/email-verified-banner";
import { TaskFilters } from "@/components/supporter/task-filters";
import { NoFamiliesConnected } from "@/components/supporter/no-families-connected";
import { TasksTabView } from "@/components/supporter/tasks-tab-view";

// Redux
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import {
  fetchApprovedFamilies,
  selectApprovedFamilies,
  selectUserData,
} from "@/features/user/userSlice";
import {
  fetchRequests,
  selectRequests,
  selectRequestError,
  selectFetchedDates,
  updateRequest,
} from "@/features/request/requestSlice";

// Utils and constants
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { isDateInRange } from "@/lib/utils";
import { HelpRequest } from "@/interfaces";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Link, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { scheduleTaskReminderNotification, cancelTaskReminderNotification } from "@/lib/local-notifications";
import { sendClaimedTaskPushNotification } from "@/features/request/requestAPI";

export default function SupporterDashboard() {
  const { colorScheme } = useColorScheme();
  const dispatch = useAppDispatch();

  // User data
  const firestoreUser = useAppSelector(selectUserData);
  const approvedFamilies = useAppSelector(selectApprovedFamilies);

  // Requests data
  const requests = useAppSelector(selectRequests);
  const error = useAppSelector(selectRequestError);
  const fetchedDates = useAppSelector(selectFetchedDates);

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [parentFilter, setParentFilter] = useState<string[]>([]);

  // Bottom sheet refs and settings
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "85%"], []);

  // Format requests
  const sortedRequests = useMemo(() => {
    return [...requests].sort(
      (a, b) =>
        new Date(a.startDateTime.toDate()).getTime() -
        new Date(b.startDateTime.toDate()).getTime()
    );
  }, [requests]);

  // Check if a task is overdue (start time is in the past)
  const isOverdue = useCallback((task: HelpRequest) => {
    const now = new Date();
    const startDate = task.startDateTime.toDate();
    return startDate < now && task.status === "open";
  }, []);

  // Calculate filtered tasks
  const {
    filteredOverdueTasks,
    filteredUpcomingTasks,
    filteredClaimedTasks,
  } = useMemo(() => {
    // Filtered task lists with active filters
    const filteredOverdueTasks = sortedRequests.filter((task) => {
      return (
        isOverdue(task) &&
        (urgencyFilter.length === 0 || urgencyFilter.includes(task.urgency)) &&
        (typeFilter.length === 0 || typeFilter.includes(task.type)) &&
        (parentFilter.length === 0 || parentFilter.includes(task.parentId))
      );
    });

    const filteredUpcomingTasks = sortedRequests.filter((task) => {
      return (
        task.status === "open" &&
        !isOverdue(task) &&
        (urgencyFilter.length === 0 || urgencyFilter.includes(task.urgency)) &&
        (typeFilter.length === 0 || typeFilter.includes(task.type)) &&
        (parentFilter.length === 0 || parentFilter.includes(task.parentId))
      );
    });

    const filteredClaimedTasks = sortedRequests.filter((task) => {
      return (
        task.status === "claimed" &&
        task.claimedBy === firestoreUser?.userId &&
        (urgencyFilter.length === 0 || urgencyFilter.includes(task.urgency)) &&
        (typeFilter.length === 0 || typeFilter.includes(task.type)) &&
        (parentFilter.length === 0 || parentFilter.includes(task.parentId))
      );
    });

    // Count for overdue claimed tasks
    const overdueClaimedTasksCount = filteredClaimedTasks.filter((task) => {
      const startDate = task.startDateTime.toDate();
      const now = new Date();
      return startDate < now;
    }).length;

    // Counts for summary statistics
    const overdueTasksCount = sortedRequests.filter((task) =>
      isOverdue(task)
    ).length;
    const upcomingTasksCount = sortedRequests.filter(
      (task) => task.status === "open" && !isOverdue(task)
    ).length;
    const claimedTasksCount = sortedRequests.filter(
      (task) =>
        task.status === "claimed" && task.claimedBy === firestoreUser?.userId
    ).length;

    return {
      overdueTasksCount,
      upcomingTasksCount,
      claimedTasksCount,
      overdueClaimedTasksCount,
      filteredOverdueTasks,
      filteredUpcomingTasks,
      filteredClaimedTasks,
    };
  }, [
    sortedRequests,
    urgencyFilter,
    typeFilter,
    parentFilter,
    isOverdue,
    firestoreUser?.userId,
  ]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const now = new Date();
      await getRequests(now.toISOString());

      const approvedFamilies = firestoreUser?.families?.filter(
        (family) => family.status === "approved"
      );
      if (approvedFamilies && approvedFamilies.length > 0) {
        await dispatch(fetchApprovedFamilies(approvedFamilies));
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [firestoreUser]);

  // Filter handlers
  const openFilters = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const applyFilters = () => bottomSheetModalRef.current?.close();

  const toggleFilter = (
    filter: string,
    setFilter: (value: string[]) => void,
    currentFilters: string[]
  ) => {
    setFilter(
      currentFilters.includes(filter)
        ? currentFilters.filter((f) => f !== filter)
        : [...currentFilters, filter]
    );
  };

  const clearFilters = () => {
    setUrgencyFilter([]);
    setTypeFilter([]);
    setParentFilter([]);
    bottomSheetModalRef.current?.close();
  };

  // Fetch approved families
  useEffect(() => {
    const fetchInviteParentsList = async () => {
      const approvedFamilies = firestoreUser?.families?.filter(
        (family) => family.status === "approved"
      );
      if (approvedFamilies && approvedFamilies.length > 0) {
        await dispatch(fetchApprovedFamilies(approvedFamilies));
      }
    };

    fetchInviteParentsList();
  }, [firestoreUser]);

  // Fetch requests
  const getRequests = async (date: string, forceRefresh: boolean = false) => {
    try {
      if (
        !forceRefresh &&
        fetchedDates &&
        isDateInRange(date.split("T")[0], fetchedDates.start, fetchedDates.end)
      ) {
        console.log("Requests already fetched for this date range");
        return;
      }
      // Use a 30-day window for upcoming tasks
      const offset = 30;
      const dateObj = new Date(date);
      const fromDate = new Date(dateObj);
      fromDate.setDate(dateObj.getDate());
      const toDate = new Date(dateObj);
      toDate.setDate(dateObj.getDate() + offset - 1);

      if (firestoreUser?.families && firestoreUser.families.length > 0) {
        for (const family of firestoreUser.families.filter(
          (f) => f.status === "approved"
        )) {
          dispatch(
            fetchRequests({
              parentId: family.id,
              from: fromDate.toISOString(),
              to: toDate.toISOString(),
            })
          );
        }
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  useEffect(() => {
    if (firestoreUser?.families && firestoreUser.families.length > 0) {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      getRequests(fiveDaysAgo.toISOString());
    }
  }, [firestoreUser]);

  // Task management functions
  const claimTask = async (task: HelpRequest) => {
    setIsLoading(true);
    try {
      const { notificationIds } = await scheduleTaskReminderNotification(task, new Date(task.startDateTime!.toDate()));
      const result = await dispatch(
        updateRequest({
          id: task.id,
          updatedFields: {
            status: "claimed",
            claimedBy: firestoreUser!.userId,
            notificationIds: notificationIds,
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
      // if (!notificationResult || notificationResult.error) {
      //   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      //   console.error("Error sending push notification:", notificationResult.error);
      // }
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
          currentUserId: firestoreUser!.userId,
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

  // Type assertion to avoid type errors with expo-router Link
  const myFamiliesHref = "/supporter/my-families" as any;

  // Redirect if no user data
  if (!firestoreUser) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Email verification banner if email is not verified */}
      {!firestoreUser?.emailVerified && (
        <EmailVerifiedBanner email={firestoreUser.email!} />
      )}

      <View className="flex-1">
        <View className="flex-row justify-between items-center px-4 py-2">
          <View className="flex-row items-center gap-1">
            <Text
              className="text-2xl"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              Tasks
            </Text>
            <View>
              <Button variant="ghost" size="icon" onPress={openFilters}>
                <Filter size={20} color={NAV_THEME[colorScheme].primary} />
              </Button>
              {(urgencyFilter.length > 0 ||
                typeFilter.length > 0 ||
                parentFilter.length > 0) && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 items-center justify-center"
                >
                  <Text className="text-xs">
                    {urgencyFilter.length +
                      typeFilter.length +
                      parentFilter.length}
                  </Text>
                </Badge>
              )}
            </View>
          </View>
          <Link href={myFamiliesHref} asChild>
            <Button variant="ghost" size="icon">
              <Ionicons
                name="people-circle-outline"
                size={38}
                color={NAV_THEME[colorScheme].text}
              />
            </Button>
          </Link>
        </View>

        <ScrollView
          className="flex-1 px-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
                getRequests(fiveDaysAgo.toISOString(), true);
              }}
              colors={[NAV_THEME[colorScheme].primary]}
              tintColor={NAV_THEME[colorScheme].primary}
            />
          }
        >
          {/* Error alert */}
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

          {/* No families connected state */}
          {firestoreUser!.families!.length === 0 ? (
            <NoFamiliesConnected />
          ) : (
            <>
              {/* Tasks Tab View - Unified task display */}
              <TasksTabView
                overdueTasks={filteredOverdueTasks}
                claimedTasks={filteredClaimedTasks}
                availableTasks={filteredUpcomingTasks}
                isButtonLoading={isLoading}
                claimTask={claimTask}
                abandonTask={abandonTask}
                approvedFamilies={approvedFamilies}
                userId={firestoreUser?.userId || ""}
              />
            </>
          )}
        </ScrollView>
      </View>

      {/* Filter Bottom Sheet */}
      <TaskFilters
        ref={bottomSheetModalRef}
        urgencyFilter={urgencyFilter}
        typeFilter={typeFilter}
        parentFilter={parentFilter}
        onToggleFilter={toggleFilter}
        setUrgencyFilter={setUrgencyFilter}
        setTypeFilter={setTypeFilter}
        setParentFilter={setParentFilter}
        onClearFilters={clearFilters}
        onApplyFilters={applyFilters}
        approvedFamilies={approvedFamilies || []}
        snapPoints={snapPoints}
      />
    </SafeAreaView>
  );
}
