import { View, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle } from "@/lib/icons/CheckCircle";
import { ChevronRight } from "@/lib/icons/ChevronRight";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import Animated, { FadeInUp, FadeOut } from "react-native-reanimated";
import { FamilyConnection } from "@/interfaces";

interface FamilyCardProps {
  family: any; // Replace with proper type
  connection: FamilyConnection;
  overdueCount: number;
  availableCount: number;
  claimedCount: number;
}

export function FamilyCard({
  family,
  connection,
  overdueCount,
  availableCount,
  claimedCount,
}: FamilyCardProps) {
  const { colorScheme } = useColorScheme();

  if (!family) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      exiting={FadeOut.duration(300)}
      className="mb-4"
    >
      <Card>
        <CardContent className="p-0">
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <View className="flex-row items-center flex-1">
              <Avatar
                alt={`${family.displayName}'s Avatar`}
                className="w-14 h-14 bg-primary/20"
              >
                <AvatarImage source={{ uri: family.photoUrl || "" }} />
                <AvatarFallback>
                  <Text className="text-xl">
                    {family.displayName
                      ? family.displayName.charAt(0)
                      : family.firstName && family.lastName
                      ? family.firstName.charAt(0) + family.lastName.charAt(0)
                      : family.firstName
                      ? family.firstName.charAt(0)
                      : family.lastName
                      ? family.lastName.charAt(0)
                      : ""}
                  </Text>
                </AvatarFallback>
              </Avatar>
              <View className="ml-3 flex-1">
                <Text
                  className="text-lg"
                  style={{ fontFamily: "Quicksand_700Bold" }}
                >
                  {family.displayName
                    ? family.displayName
                    : family.firstName && family.lastName
                    ? family.firstName + " " + family.lastName
                    : family.firstName
                    ? family.firstName
                    : family.lastName
                    ? family.lastName
                    : ""}
                </Text>
              </View>
              <CheckCircle size={20} color="green" />
            </View>
          </View>

          <View className="py-3 px-4">
            <Text className="text-sm text-muted-foreground mb-2">
              Task Summary:
            </Text>
            <View className="flex-row justify-between">
              {overdueCount > 0 ? (
                <Text className="text-xs text-white bg-destructive rounded-md px-2 py-1">
                  Overdue: {overdueCount}
                </Text>
              ) : (
                <Text className="text-xs">No Overdue Tasks</Text>
              )}

              {availableCount > 0 ? (
                <Text className="text-xs bg-primary rounded-md px-2 py-1">
                  Available: {availableCount}
                </Text>
              ) : null}

              {claimedCount > 0 ? (
                <Text className="text-xs bg-primary rounded-md px-2 py-1">
                  Your Tasks: {claimedCount}
                </Text>
              ) : null}
            </View>
          </View>
        </CardContent>
      </Card>
    </Animated.View>
  );
}
