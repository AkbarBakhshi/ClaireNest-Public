import { View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { ChevronRight } from "@/lib/icons/ChevronRight";
import { LucideIcon } from "lucide-react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/lib/constants";

const SettingsLink = ({
  text,
  Icon,
  onPress,
}: {
  text: string;
  Icon: LucideIcon;
  onPress: () => void;
}) => {
  const { colorScheme } = useColorScheme();
  const scale = useSharedValue(1);

  // Define animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Pressable
      onPressIn={() => (scale.value = withSpring(0.95))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={onPress}
    >
      <Animated.View
        style={animatedStyle} // Apply animated style here
        className="flex-row items-center py-3 my-2"
      >
        <Icon size={25} color={NAV_THEME[colorScheme].text} />
        <Text className="text-lg text-foreground ml-4 flex-1">{text}</Text>
        <ChevronRight size={20} color={NAV_THEME[colorScheme].text} />
      </Animated.View>
    </Pressable>
  );
};

export default SettingsLink;
