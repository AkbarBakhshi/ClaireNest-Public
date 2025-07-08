import { View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { FadeInUp } from "react-native-reanimated";
import { FamilyConnection } from "@/interfaces";

interface PendingInvitationsProps {
  pendingInvitations: FamilyConnection[];
}

export function PendingInvitations({
  pendingInvitations,
}: PendingInvitationsProps) {
  if (!pendingInvitations || pendingInvitations.length === 0) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(100).duration(600)}
      className="mb-4 bg-secondary border-l-4 border-l-primary p-4 rounded-lg"
    >
      <Text className="text-lg" style={{ fontFamily: "Quicksand_700Bold" }}>
        Pending Invitations ({pendingInvitations.length})
      </Text>
      <Text className="text-muted-foreground mt-1">
        You have pending connection requests. Once approved, you'll see the
        families here.
      </Text>
      <Text className="text-muted-foreground mt-1">
        For privacy reasons, we don’t show family names or details until they
        approve your request.
      </Text>
    </Animated.View>
  );
}
