import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { DashboardTaskCard } from "./dashboard-task-card";
import { HelpRequest } from "@/interfaces";
import { UserData } from "@/interfaces";
import { Button } from "@/components/ui/button";
import Animated, { FadeIn } from "react-native-reanimated";
import { Link } from "expo-router";
import { Badge } from "@/components/ui/badge";
import { Ionicons } from "@expo/vector-icons";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
interface TasksTabViewProps {
  overdueTasks: HelpRequest[];
  claimedTasks: HelpRequest[];
  availableTasks: HelpRequest[];
  isButtonLoading: boolean;
  claimTask: (task: HelpRequest) => void;
  abandonTask: (task: HelpRequest) => void;
  approvedFamilies: UserData[] | null;
  userId: string;
}

type TabType = "all" | "overdue" | "claimed" | "available";

export function TasksTabView({
  overdueTasks,
  claimedTasks,
  availableTasks,
  isButtonLoading,
  claimTask,
  abandonTask,
  approvedFamilies,
  userId,
}: TasksTabViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const { colorScheme } = useColorScheme();
  // Function to get parent name
  const getParentName = (task: HelpRequest) => {
    const parentFamily = approvedFamilies?.find(
      (family) => family.userId === task.parentId
    );
    return parentFamily
      ? parentFamily.firstName ||
          parentFamily.displayName?.split(" ")[0] ||
          "Parent"
      : "Parent";
  };

  // Function to check if a task is overdue
  const isOverdue = (task: HelpRequest) => {
    const now = new Date();
    const startDate = task.startDateTime.toDate();
    return startDate < now && task.status === "open";
  };

  // Get tasks based on active tab
  const getTasksToDisplay = () => {
    switch (activeTab) {
      case "overdue":
        return overdueTasks;
      case "claimed":
        return claimedTasks;
      case "available":
        return availableTasks;
      case "all":
      default:
        // Order: overdue first, then claimed, then available
        return [...overdueTasks, ...claimedTasks, ...availableTasks];
    }
  };

  const tasksToDisplay = getTasksToDisplay();
  const hasMoreTasks = tasksToDisplay.length > 5;

  // Determines viewAll path based on active tab
  const getViewAllPath = () => {
    switch (activeTab) {
      case "overdue":
        return "/supporter/tasks/overdue";
      case "claimed":
        return "/supporter/tasks/claimed";
      case "available":
        return "/supporter/tasks/available";
      case "all":
        return "/supporter/tasks";
      default:
        return "/supporter/tasks";
    }
  };

  return (
    <View className="mb-6">
      <View className="mt-4 mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-full ${
                activeTab === "all" ? "bg-primary" : "bg-muted"
              }`}
            >
              <Text className={`${activeTab === "all" ? "text-white" : ""}`}>
                All (
                {overdueTasks.length +
                  claimedTasks.length +
                  availableTasks.length}
                )
              </Text>
            </TouchableOpacity>

            {overdueTasks.length > 0 && (
              <TouchableOpacity
                onPress={() => setActiveTab("overdue")}
                className={`px-4 py-2 rounded-full ${
                  activeTab === "overdue"
                    ? "bg-destructive"
                    : "bg-destructive/20"
                }`}
              >
                <Text
                  className={`${
                    activeTab === "overdue" ? "text-white" : "text-destructive"
                  }`}
                >
                  Overdue ({overdueTasks.length})
                </Text>
              </TouchableOpacity>
            )}

            {claimedTasks.length > 0 && (
              <TouchableOpacity
                onPress={() => setActiveTab("claimed")}
                className={`px-4 py-2 rounded-full ${
                  activeTab === "claimed" ? "bg-amber-500" : "bg-amber-500/20"
                }`}
              >
                <Text
                  className={`${
                    activeTab === "claimed" ? "text-white" : "text-amber-700"
                  }`}
                >
                  My Tasks ({claimedTasks.length})
                </Text>
              </TouchableOpacity>
            )}

            {availableTasks.length > 0 && (
              <TouchableOpacity
                onPress={() => setActiveTab("available")}
                className={`px-4 py-2 rounded-full ${
                  activeTab === "available" ? "bg-primary" : "bg-primary/20"
                }`}
              >
                <Text
                  className={`${
                    activeTab === "available" ? "text-white" : "text-primary"
                  }`}
                >
                  Available ({availableTasks.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      {activeTab === "overdue" && (
        <View className="bg-muted p-4 rounded-lg items-center mb-2">
          <Text className="text-center text-muted-foreground" style={{ fontFamily: "Quicksand_700Bold" }}>
            The unclaimed tasks in the past 5 days are shown here.
          </Text>
        </View>
      )}

      {tasksToDisplay.length === 0 ? (
        <View className="bg-muted p-8 rounded-lg items-center mb-2">
          <Text
            className="text-center text-muted-foreground"
            style={{ fontFamily: "Quicksand_700Bold" }}
          >
            {activeTab === "all"
              ? "No tasks found"
              : activeTab === "overdue"
              ? "No overdue tasks - great!"
              : activeTab === "claimed"
              ? "You haven't claimed any tasks yet"
              : "No available tasks at the moment"}
          </Text>
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(300)} className="gap-3">
          {tasksToDisplay.slice(0, 5).map((task) => (
            <DashboardTaskCard
              key={task.id}
              task={task}
              parentName={getParentName(task)}
              isOverdue={overdueTasks.includes(task) || isOverdue(task)}
              onClaim={claimTask}
              onAbandon={abandonTask}
              isLoading={isButtonLoading}
            />
          ))}

          {hasMoreTasks && (
            <View className="mt-2">
              <Link href={getViewAllPath() as any} asChild>
                <Button
                  variant="outline"
                  className="w-full flex-row justify-between items-center"
                >
                  <Text>
                    View All{" "}
                    {activeTab === "all"
                      ? "Tasks"
                      : activeTab === "overdue"
                      ? "Overdue Tasks"
                      : activeTab === "claimed"
                      ? "My Tasks"
                      : "Available Tasks"}
                  </Text>
                  <Badge variant="secondary" className="ml-2">
                    <Text>{tasksToDisplay.length}</Text>
                  </Badge>
                </Button>
              </Link>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}
