import { Link } from "expo-router";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";

export default function NotFoundScreen() {
  const { colorScheme } = useColorScheme();
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: NAV_THEME[colorScheme].background,
      }}
    >
      <Text className="text-lg mb-4 text-foreground">
        This screen doesn't exist.
      </Text>

      <Link href="/" asChild>
        <Button
          variant="outline"
          style={({ pressed }) =>
            pressed ? { opacity: 0.75 } : { elevation: 2 }
          }
        >
          <Text className="text-lg">Go to home screen</Text>
        </Button>
      </Link>
    </SafeAreaView>
  );
}
