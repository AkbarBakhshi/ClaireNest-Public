import { TouchableOpacity, View } from "react-native";
import { Moon } from "@/lib/icons/MoonStar";
import { SunDim } from "@/lib/icons/Sun";
import { setAndroidNavigationBar } from "@/lib/android-navigation-bar";
import { useColorScheme } from "@/lib/useColorScheme";
import { setItem } from "@/lib/storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { NAV_THEME } from "@/lib/constants";

export function ThemeToggle() {
  const { isDarkColorScheme, setColorScheme, colorScheme } = useColorScheme();
  const isDarkMode = useSharedValue(isDarkColorScheme);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(!isDarkMode.value ? 40 : 4) }],
  }));

  return (
    <TouchableOpacity
      onPress={() => {
        const newTheme = isDarkColorScheme ? "light" : "dark";
        setColorScheme(newTheme);
        setAndroidNavigationBar(newTheme);
        setItem("theme", newTheme);
        isDarkMode.value = !isDarkMode.value;
      }}
      activeOpacity={0.8}
      style={{
        width: 84,
        height: 46,
        borderRadius: 12,
        backgroundColor: NAV_THEME[colorScheme].border,
        flexDirection: "row",
        alignItems: "center",
        padding: 4,
        position: "relative",
      }}
    >
      {/* Animated Background */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 40,
            height: 38,
            borderRadius: 12,
            backgroundColor: NAV_THEME[colorScheme].primary, // Purple color like in the screenshot
            zIndex: -1,
          },
          animatedStyle,
        ]}
      />

      {/* Moon Icon */}
      <View style={{ flex: 1, alignItems: "center" }}>
        <Moon
          size={27}
          color={
            isDarkMode.value
              ? NAV_THEME[colorScheme].background
              : NAV_THEME[colorScheme].text
          }
        />
      </View>

      {/* Sun Icon */}
      <View style={{ flex: 1, alignItems: "center" }}>
        <SunDim size={30} color={!isDarkMode.value ? "#fff" : "#888"} />
      </View>
    </TouchableOpacity>
  );
}
