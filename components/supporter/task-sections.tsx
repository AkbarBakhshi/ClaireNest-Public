import React from "react";
import { View, ActivityIndicator } from "react-native";
import { TaskSection } from "./task-section";
import { DashboardTaskCard } from "./dashboard-task-card";
import { HelpRequest } from "@/interfaces";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { UserData } from "@/interfaces";

interface TaskSectionsProps {
  loading: boolean;
  filteredOverdueTasks: HelpRequest[];
  filteredClaimedTasks: HelpRequest[];
  filteredUpcomingTasks: HelpRequest[];
  overdueClaimedTasksCount: number;
  isButtonLoading: boolean;
  claimTask: (task: HelpRequest) => void;
  abandonTask: (task: HelpRequest) => void;
  approvedFamilies: UserData[] | null;
  userId: string;
}

export function TaskSections({
  loading,
  filteredOverdueTasks,
  filteredClaimedTasks,
  filteredUpcomingTasks,
  overdueClaimedTasksCount,
  isButtonLoading,
  claimTask,
  abandonTask,
  approvedFamilies,
  userId,
}: TaskSectionsProps) {
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <ActivityIndicator
          size="large"
          color={NAV_THEME[colorScheme].primary}
        />
      </View>
    );
  }

  return (
    <View className="mt-4">
      {/* Overdue Tasks Section */}
      {filteredOverdueTasks.length > 0 && (
        <TaskSection
          title="Overdue Tasks"
          tasks={filteredOverdueTasks}
          variant="overdue"
          alertMessage="These tasks require immediate attention"
          renderTaskCard={(task) => (
            <DashboardTaskCard
              key={task.id}
              task={task}
              parentName={getParentName(task)}
              isOverdue={true}
              onClaim={claimTask}
              onAbandon={abandonTask}
              isLoading={isButtonLoading}
            />
          )}
          viewAllLink="/supporter/tasks/overdue"
          delay={0}
        />
      )}

      {/* My Tasks Section */}
      {filteredClaimedTasks.length > 0 && (
        <TaskSection
          title="My Tasks"
          tasks={filteredClaimedTasks}
          variant="claimed"
          alertMessage={
            overdueClaimedTasksCount > 0
              ? `You have ${overdueClaimedTasksCount} overdue task${
                  overdueClaimedTasksCount > 1 ? "s" : ""
                } that you've claimed`
              : undefined
          }
          renderTaskCard={(task) => (
            <DashboardTaskCard
              key={task.id}
              task={task}
              parentName={getParentName(task)}
              isOverdue={isOverdue(task)}
              onAbandon={abandonTask}
              isLoading={isButtonLoading}
            />
          )}
          viewAllLink="/supporter/tasks/claimed"
          delay={200}
        />
      )}

      {/* Available Tasks Section */}
      <TaskSection
        title="Available Tasks"
        tasks={filteredUpcomingTasks}
        variant="available"
        renderTaskCard={(task) => (
          <DashboardTaskCard
            key={task.id}
            task={task}
            parentName={getParentName(task)}
            isOverdue={false}
            onClaim={claimTask}
            isLoading={isButtonLoading}
          />
        )}
        viewAllLink="/supporter/tasks/available"
        emptyMessage="No available tasks to display"
        delay={300}
      />
    </View>
  );
} 