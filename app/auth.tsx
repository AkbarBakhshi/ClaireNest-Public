import { Dimensions, View } from "react-native";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import FullLogo from "@/assets/images/logo.svg";
import { useColorScheme } from "@/lib/useColorScheme";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export default function AuthScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const { height } = Dimensions.get("window");

  const logoHeight = 200; // Define your logo size
  const topOffset = 0; // Adjust this to control where it stops at the top

  // Start in the vertical center
  const translateY = useSharedValue(height / 2 - logoHeight / 2 - 50);

  useEffect(() => {
    translateY.value = withTiming(topOffset, { duration: 1000 });
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <SafeAreaView className="flex-1 px-4 py-8 bg-background justify-between flex-col">
      <View className="flex-col items-center">
        <Animated.View style={logoAnimatedStyle}>
          <FullLogo
            width={200}
            height={200}
            fill={isDarkColorScheme ? "#fff" : "#231f20"}
          />
        </Animated.View>
        <Animated.Text
          className="text-4xl text-foreground"
          entering={FadeInUp.delay(1000).duration(500)}
          style={{ fontFamily: "Quicksand_700Bold" }}
        >
          ClaireNest
        </Animated.Text>
        <Animated.Text
          className="text-foreground"
          entering={FadeInUp.delay(1000).duration(500)}
          style={{ fontFamily: "Quicksand_500Medium" }}
        >
          Where Help Finds Its Way Home
        </Animated.Text>
      </View>
      <Animated.View entering={FadeInDown.delay(1000).duration(500)}>
        <View className="w-full my-5">
          <Button
            size="lg"
            className="mb-4 w-full"
            onPress={() => {
              router.push("/sign-up");
            }}
          >
            <Text style={{ fontFamily: "Quicksand_700Bold" }}>
              Create account
            </Text>
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onPress={() => {
              router.push("/sign-in");
            }}
          >
            <Text>Sign in</Text>
          </Button>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
