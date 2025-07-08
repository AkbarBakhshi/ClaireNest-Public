import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useColorScheme } from "@/lib/useColorScheme";
import { cn } from "@/lib/utils";

interface TaskSummaryProps {
  overdueTasksCount: number;
  upcomingTasksCount: number;
  claimedTasksCount: number;
}

export function TaskSummary({
  overdueTasksCount,
  upcomingTasksCount,
  claimedTasksCount,
}: TaskSummaryProps) {

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle>Task Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <View className="flex-row justify-between mb-4 py-2">
          <View className="items-center px-2">
            <View
              className={cn(
                "w-10 h-10 rounded-full items-center justify-center mb-1",
                overdueTasksCount > 0 ? "bg-destructive" : "bg-muted"
              )}
            >
              <Text
                className={
                  overdueTasksCount > 0 ? "text-white" : "text-muted-foreground"
                }
              >
                {overdueTasksCount}
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground text-center">
              Overdue
            </Text>
          </View>

          <View className="items-center px-2">
            <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center mb-1">
              <Text>{upcomingTasksCount}</Text>
            </View>
            <Text className="text-sm text-muted-foreground text-center">
              Available
            </Text>
          </View>

          <View className="items-center px-2">
            <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mb-1">
              <Text className="text-white">{claimedTasksCount}</Text>
            </View>
            <Text className="text-sm text-muted-foreground text-center">
              My Tasks
            </Text>
          </View>
        </View>
        
      </CardContent>
    </Card>
  );
} 