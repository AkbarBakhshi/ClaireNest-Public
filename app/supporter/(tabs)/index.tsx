import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";

// UI Components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "@/lib/icons/AlertTriangle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { Info } from "@/lib/icons/Info";

// Icons
import { Ionicons } from "@expo/vector-icons";
import { Clock } from "@/lib/icons/Clock";
import { Calendar } from "@/lib/icons/Calendar";
import { ChevronRight } from "@/lib/icons/ChevronRight";

// Custom components
import EmailVerifiedBanner from "@/components/email-verified-banner";
import { TaskSummary } from "@/components/supporter/task-summary";
import { WelcomeHeader } from "@/components/supporter/welcome-header";

// Redux
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import {
  fetchApprovedFamilies,
  selectUserData,
  selectApprovedFamilies,
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
import { Link, Redirect, router } from "expo-router";
import Toast from "react-native-toast-message";
import { scheduleTaskReminderNotification } from "@/lib/local-notifications";
import { sendClaimedTaskPushNotification } from "@/features/request/requestAPI";

export default function SupporterDashboard() {
  const { colorScheme } = useColorScheme();
  const dispatch = useAppDispatch();

  // User data
  const firestoreUser = useAppSelector(selectUserData);

  // IMPORTANT: Move this hook call to the top level
  const approvedFamiliesData = useAppSelector(selectApprovedFamilies);

  // Requests data
  const requests = useAppSelector(selectRequests);
  const error = useAppSelector(selectRequestError);
  const fetchedDates = useAppSelector(selectFetchedDates);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has any pending families
  const hasPendingFamilies = firestoreUser?.families?.some(
    (family) => family.status === "pending"
  );

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
  const { overdueTasksCount, upcomingTasksCount, claimedTasksCount } =
    useMemo(() => {
      // Filtered task lists with active filters
      const filteredOverdueTasks = sortedRequests.filter((task) => {
        return isOverdue(task);
      });

      const filteredUpcomingTasks = sortedRequests.filter((task) => {
        return task.status === "open" && !isOverdue(task);
      });

      const filteredClaimedTasks = sortedRequests.filter((task) => {
        return (
          task.status === "claimed" && task.claimedBy === firestoreUser?.userId
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
    }, [sortedRequests, isOverdue, firestoreUser?.userId]);

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
  const getRequests = async (date: string) => {
    try {
      if (
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
          await dispatch(
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

  // Get the next upcoming task (soonest in the future)
  const nextUpcomingTask = useMemo(() => {
    const now = new Date();
    const upcomingTasks = sortedRequests.filter(
      (task) => task.status === "open" && !isOverdue(task)
    );

    // Sort upcoming tasks by start time (earliest first)
    return upcomingTasks.length > 0
      ? upcomingTasks.sort(
          (a, b) =>
            a.startDateTime.toDate().getTime() -
            b.startDateTime.toDate().getTime()
        )[0]
      : null;
  }, [sortedRequests, isOverdue]);

  // Get the next claimed task that is coming up
  const nextClaimedTask = useMemo(() => {
    const now = new Date();
    const claimedTasks = sortedRequests.filter(
      (task) =>
        task.status === "claimed" &&
        task.claimedBy === firestoreUser?.userId &&
        task.startDateTime.toDate() > now
    );

    // Sort claimed tasks by start time (earliest first)
    return claimedTasks.length > 0
      ? claimedTasks.sort(
          (a, b) =>
            a.startDateTime.toDate().getTime() -
            b.startDateTime.toDate().getTime()
        )[0]
      : null;
  }, [sortedRequests, firestoreUser?.userId]);

  // Get most recent families
  const recentFamilies = useMemo(() => {
    const approvedFamilies =
      firestoreUser?.families?.filter(
        (family) => family.status === "approved"
      ) || [];

    // Get the 2 most recent families
    return approvedFamilies.slice(0, 2);
  }, [firestoreUser?.families]);

  // Pre-process parent data for families to avoid hook inside render
  const familyDataMap = useMemo(() => {
    if (!recentFamilies.length || !approvedFamiliesData) return {};

    const dataMap: Record<
      string,
      {
        firstLetter: string;
        familyName: string;
        taskCount: number;
      }
    > = {};

    recentFamilies.forEach((family) => {
      const parentData = approvedFamiliesData.find(
        (p) => p.userId === family.id
      );
      dataMap[family.id] = {
        firstLetter:
          parentData?.firstName?.charAt(0) ||
          parentData?.displayName?.charAt(0) ||
          "F",
        familyName:
          parentData?.firstName ||
          parentData?.displayName?.split(" ")[0] ||
          "Family",
        taskCount: sortedRequests.filter((req) => req.parentId === family.id)
          .length,
      };
    });

    return dataMap;
  }, [recentFamilies, approvedFamiliesData, sortedRequests]);

  // Helper to format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Helper to get parent name
  const getParentName = (parentId: string) => {
    const parent = approvedFamiliesData?.find(
      (family) => family.userId === parentId
    );
    return parent
      ? parent.firstName || parent.displayName?.split(" ")[0] || "Parent"
      : "Parent";
  };

  // Navigate to specific task
  const navigateToTask = (taskId: string) => {
    router.push(`/supporter/requests/${taskId}`);
  };

  // Function to claim task quickly from dashboard
  const quickClaimTask = async (task: HelpRequest) => {
    setIsLoading(true);
    try {
      const { notificationIds } = await scheduleTaskReminderNotification(
        task,
        new Date(task.startDateTime!.toDate())
      );
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
      await sendClaimedTaskPushNotification(
        task,
        firestoreUser!.displayName || "A supporter"
      );
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
      console.error("Error claiming task:", error);
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

  // Redirect if no user data
  if (!firestoreUser) {
    return <Redirect href="/" />;
  }

  // Get username for welcome message
  const userName =
    firestoreUser?.firstName ||
    firestoreUser.displayName?.split(" ")[0] ||
    "there";

  // Type-safe route paths - use strings for now
  const myFamiliesHref = "/supporter/my-families" as any;
  const tasksHref = "/supporter/tasks" as any;
  const overdueTasksHref = "/supporter/tasks/overdue" as any;

  // For Card TouchableOpacity handlers
  const handleClaimedTaskPress = nextClaimedTask
    ? () => navigateToTask(nextClaimedTask.id)
    : undefined;
  const handleUpcomingTaskPress = nextUpcomingTask
    ? () => navigateToTask(nextUpcomingTask.id)
    : undefined;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Email verification banner if email is not verified */}
      {!firestoreUser?.emailVerified && (
        <EmailVerifiedBanner email={firestoreUser.email!} />
      )}

      <View className="flex-1">
        <ScrollView
          className="flex-1 px-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[NAV_THEME[colorScheme].primary]}
              tintColor={NAV_THEME[colorScheme].primary}
            />
          }
        >
          <WelcomeHeader name={userName} />
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

          {firestoreUser?.families && firestoreUser?.families.length > 0 ? (
            <>
              {/* Task summary */}
              <View className="mt-4">
                <TaskSummary
                  overdueTasksCount={overdueTasksCount}
                  upcomingTasksCount={upcomingTasksCount}
                  claimedTasksCount={claimedTasksCount}
                />
              </View>

              {/* Quick Actions */}
              <View className="mt-6">
                <Text
                  className="text-xl mb-4"
                  style={{ fontFamily: "Quicksand_700Bold" }}
                >
                  Quick Actions
                </Text>

                <View className="flex-row justify-between gap-2">
                  <Link href={tasksHref} asChild>
                    <TouchableOpacity className="flex-1 bg-primary/10 p-4 rounded-xl items-center">
                      <Calendar
                        size={24}
                        color={NAV_THEME[colorScheme].primary}
                      />
                      <Text className="text-sm mt-2 text-center">
                        View All Tasks
                      </Text>
                    </TouchableOpacity>
                  </Link>

                  <Link href={myFamiliesHref} asChild>
                    <TouchableOpacity className="flex-1 bg-primary/10 p-4 rounded-xl items-center">
                      <Ionicons
                        name="people"
                        size={24}
                        color={NAV_THEME[colorScheme].primary}
                      />
                      <Text className="text-sm mt-2 text-center">
                        My Families
                      </Text>
                    </TouchableOpacity>
                  </Link>

                  {/* <Link href={impactHref} asChild>
                <TouchableOpacity className="flex-1 bg-primary/10 p-4 rounded-xl items-center">
                  <Ionicons
                    name="heart-outline"
                    size={24}
                    color={NAV_THEME[colorScheme].primary}
                  />
                  <Text className="text-sm mt-2 text-center">My Impact</Text>
                </TouchableOpacity>
              </Link> */}
                </View>
              </View>

              {hasPendingFamilies && (
                <View className="mt-8">
                  <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="p-6">
                      <View className="flex-row items-start mb-4 p-2">
                        <View className="bg-primary/20 p-2 rounded-lg mr-2">
                          <Ionicons
                            name="people-outline"
                            size={24}
                            color={NAV_THEME[colorScheme].primary}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-lg mb-1"
                            style={{ fontFamily: "Quicksand_700Bold" }}
                          >
                            Pending Family Connections
                          </Text>
                          <Text className="text-muted-foreground mb-2">
                            You're waiting on approval from families you've
                            requested to support.
                          </Text>
                          <View className="flex-row items-center">
                            <Ionicons
                              name="chatbubble-ellipses-outline"
                              size={16}
                              color={NAV_THEME[colorScheme].text}
                              style={{ marginRight: 4, opacity: 0.6 }}
                            />
                            <Text className="text-sm text-muted-foreground">
                              Consider sending them a quick reminder to accept
                              your invitation.
                            </Text>
                          </View>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                </View>
              )}

              {/* Next up - prioritize upcoming tasks */}
              <View className="mt-6">
                <Text
                  className="text-xl mb-4"
                  style={{ fontFamily: "Quicksand_700Bold" }}
                >
                  Coming Up Next
                </Text>

                {nextClaimedTask ? (
                  <TouchableOpacity onPress={handleClaimedTaskPress}>
                    <Card className="mb-4 border-l-4 border-l-amber-500">
                      <CardContent className="p-4">
                        <View className="flex-row justify-between items-start">
                          <View className="flex-1">
                            <View className="flex-row gap-2 items-center mb-2">
                              <Badge variant="default">
                                <Text className="text-xs text-white">
                                  You're Helping
                                </Text>
                              </Badge>
                              <Text className="text-sm text-muted-foreground">
                                {getParentName(nextClaimedTask.parentId)}
                              </Text>
                            </View>

                            <Text
                              className="text-base mb-1"
                              style={{ fontFamily: "Quicksand_700Bold" }}
                            >
                              {nextClaimedTask.title}
                            </Text>

                            <View className="flex-row items-center mt-2">
                              <Clock
                                size={14}
                                color="#71717a"
                                className="mr-1"
                              />
                              <Text className="text-sm text-muted-foreground">
                                {formatDate(
                                  nextClaimedTask.startDateTime.toDate()
                                )}
                              </Text>
                            </View>
                          </View>

                          <ChevronRight size={18} color="#71717a" />
                        </View>
                      </CardContent>
                    </Card>
                  </TouchableOpacity>
                ) : nextUpcomingTask ? (
                  <TouchableOpacity onPress={handleUpcomingTaskPress}>
                    <Card className="mb-4 border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <View className="flex-row justify-between items-start">
                          <View className="flex-1">
                            <View className="flex-row gap-2 items-center mb-2">
                              <Badge variant="secondary">
                                <Text className="text-xs">Available</Text>
                              </Badge>
                              <Text className="text-sm text-muted-foreground">
                                {getParentName(nextUpcomingTask.parentId)}
                              </Text>
                            </View>

                            <Text
                              className="text-base mb-1"
                              style={{ fontFamily: "Quicksand_700Bold" }}
                            >
                              {nextUpcomingTask.title}
                            </Text>

                            <View className="flex-row items-center mt-2">
                              <Clock
                                size={14}
                                color="#71717a"
                                className="mr-1"
                              />
                              <Text className="text-sm text-muted-foreground">
                                {formatDate(
                                  nextUpcomingTask.startDateTime.toDate()
                                )}
                              </Text>
                            </View>
                          </View>

                          <Button
                            variant="default"
                            size="sm"
                            disabled={isLoading}
                            onPress={() => quickClaimTask(nextUpcomingTask)}
                          >
                            {isLoading ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text className="text-white">Claim</Text>
                            )}
                          </Button>
                        </View>
                      </CardContent>
                    </Card>
                  </TouchableOpacity>
                ) : (
                  <View className="bg-muted p-6 rounded-lg items-center mb-4">
                    <Text className="text-center text-muted-foreground">
                      No upcoming tasks scheduled
                    </Text>
                  </View>
                )}
              </View>
              {/* Alerts - if any overdue tasks */}
              {overdueTasksCount > 0 && (
                <View className="mt-6">
                  <Link href={overdueTasksHref} asChild>
                    <TouchableOpacity>
                      <Card className="mb-4 bg-destructive/10 border-destructive">
                        <CardContent className="p-4">
                          <View className="flex-row items-center">
                            <AlertTriangle
                              size={20}
                              color="#ef4444"
                              className="mr-2"
                            />
                            <View className="flex-1">
                              <Text
                                className="text-destructive"
                                style={{ fontFamily: "Quicksand_700Bold" }}
                              >
                                Attention Required
                              </Text>
                              <Text className="text-sm">
                                Your family has {overdueTasksCount} overdue{" "}
                                {overdueTasksCount === 1 ? "task" : "tasks"}{" "}
                                that need immediate attention
                              </Text>
                            </View>
                            <ChevronRight size={18} color="#71717a" />
                          </View>
                        </CardContent>
                      </Card>
                    </TouchableOpacity>
                  </Link>
                </View>
              )}

              {/* Recent families */}
              {recentFamilies.length > 0 && (
                <View className="mt-4 mb-8">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text
                      className="text-xl"
                      style={{ fontFamily: "Quicksand_700Bold" }}
                    >
                      Recent Families Joined
                    </Text>
                    <Link href={myFamiliesHref} asChild>
                      <Button variant="ghost" size="sm">
                        <Text>View All</Text>
                      </Button>
                    </Link>
                  </View>

                  {/* Family cards */}
                  {recentFamilies.map((family) => {
                    const familyData = familyDataMap[family.id] || {
                      firstLetter: "F",
                      familyName: "Family",
                      taskCount: 0,
                    };

                    return (
                      <Card key={family.id} className="mb-2">
                        <CardContent className="p-4 flex-row items-center">
                          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                            <Text
                              className="text-lg text-primary"
                              style={{ fontFamily: "Quicksand_700Bold" }}
                            >
                              {familyData.firstLetter}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text style={{ fontFamily: "Quicksand_700Bold" }}>
                              {familyData.familyName}
                            </Text>
                            <Text className="text-sm text-muted-foreground">
                              {familyData.taskCount} tasks available
                            </Text>
                          </View>
                        </CardContent>
                      </Card>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <Card className="mt-4 bg-primary/5 border-primary/10">
              <CardContent className="p-6">
                <View className="flex-row items-center gap-3 mb-4">
                  <View className="bg-primary/10 p-2 rounded-lg">
                    <Info size={24} className="text-primary" />
                  </View>
                  <Text className="text-xl text-primary" style={{ fontFamily: "Quicksand_700Bold" }}>
                    Getting Started
                  </Text>
                </View>
                <View className="gap-3">
                  <View className="flex-row items-start gap-3">
                    <Text className="text-2xl">🫶</Text>
                    <Text className="flex-1 text-base">
                      To start supporting a family, they need to invite you.
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-3">
                    <Text className="text-2xl">💌</Text>
                    <Text className="flex-1 text-base">
                      Ask the family you want to help to send you their invite link.
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-3">
                    <Text className="text-2xl">📲</Text>
                    <Text className="flex-1 text-base">
                      If you already have a link, just tap on it and you will be redirected to the app! This will automatically add you to their support circle.
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-3">
                    <Text className="text-2xl">🚨</Text>
                    <Text className="flex-1 text-base">
                      For security reasons, the family will be notified and must approve your request to join their support circle before you can access and claim their tasks.
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
// add more to this
// fetch requests in my-families in case of universal links or sth
