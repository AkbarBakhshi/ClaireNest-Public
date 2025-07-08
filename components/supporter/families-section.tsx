import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { FamilyCard } from "./family-card";
import { HelpRequest } from "@/interfaces";
import { UserData } from "@/interfaces";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";

// Define the UserFamily type inline since we don't have the userTypes file
interface UserFamily {
  id: string;
  status: "pending" | "approved" | "rejected";
  role?: string;
}

interface FamiliesSectionProps {
  loading: boolean;
  approvedFamilies: UserData[] | null;
  familyConnections: UserFamily[] | undefined;
  userId: string | undefined;
  requests: HelpRequest[];
  isOverdueFunc: (task: HelpRequest) => boolean;
}

export function FamiliesSection({
  loading,
  approvedFamilies,
  familyConnections,
  userId,
  requests,
  isOverdueFunc,
}: FamiliesSectionProps) {
  const { colorScheme } = useColorScheme();

  const content = (
    <View className="mt-4 mb-8">
      {loading ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator
            size="large"
            color={NAV_THEME[colorScheme].primary}
          />
        </View>
      ) : approvedFamilies && approvedFamilies.length > 0 ? (
        familyConnections
          ?.filter((family) => family.status === "approved")
          .map((connection) => {
            const family = approvedFamilies.find(
              (f) => f.userId === connection.id
            );
            if (!family) return null;

            // Count family-specific tasks
            const familyTasks = requests.filter(
              (req) => req.parentId === family.userId
            );
            const overdueCount = familyTasks.filter((task) =>
              isOverdueFunc(task)
            ).length;
            const availableCount = familyTasks.filter(
              (task) => task.status === "open" && !isOverdueFunc(task)
            ).length;
            const claimedCount = familyTasks.filter(
              (task) => task.status === "claimed" && task.claimedBy === userId
            ).length;

            return (
              <FamilyCard
                key={connection.id}
                family={family}
                connection={connection}
                overdueCount={overdueCount}
                availableCount={availableCount}
                claimedCount={claimedCount}
              />
            );
          })
      ) : (
        <View className="bg-muted p-8 rounded-lg items-center mb-6">
          <Text
            className="text-center mb-4 text-lg"
            style={{ fontFamily: "Quicksand_700Bold" }}
          >
            You’re not connected to any families yet.
          </Text>
          <Text
            className="text-center mb-4"
            style={{ fontFamily: "Quicksand_400Regular" }}
          >
            Ask your family to share their invite link with you. When you tap
            the link, you’ll be redirected back to the app and automatically
            connected to their support circle.
          </Text>
          <Text
            className="text-center"
            style={{ fontFamily: "Quicksand_700Bold" }}
          >
            The family will be notified and must approve your request to join
            their support circle before you can access and claim their tasks.
          </Text>
        </View>
      )}
    </View>
  );

  return content;
}
