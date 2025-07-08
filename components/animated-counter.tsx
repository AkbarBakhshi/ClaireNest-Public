import { useEffect, useState } from "react";
import { Animated } from "react-native";
import { withTiming, useSharedValue } from "react-native-reanimated";

// Simplified AnimatedCounter component that uses animated style instead of animatedProps
export default function AnimatedCounter({
  value,
  duration = 2000,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration });
  }, [value]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = Math.floor(progress.value * value);
      if (current !== displayValue) {
        setDisplayValue(current);
      }
      if (progress.value === 1 && displayValue !== value) {
        setDisplayValue(value);
      }
    }, 16); // Update roughly every frame at 60fps

    return () => clearInterval(interval);
  }, [value, displayValue]);

  return (
    <Animated.Text
      style={{ fontFamily: "Quicksand_700Bold" }}
      className="text-primary text-xl"
    >
      {displayValue}
    </Animated.Text>
  );
}
