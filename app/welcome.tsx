import { View, Dimensions } from "react-native";
import Swiper from "react-native-swiper";
import LottieView from "lottie-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { setIsFirstVisit } from "@/features/user/userSlice";
import { router } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/lib/constants";
import * as Haptics from "expo-haptics";
import { useAppDispatch } from "@/hooks/useAppReduxHooks";

const { width, height } = Dimensions.get("window");

export default function Onboarding() {
  const { colorScheme } = useColorScheme();
  const dispatch = useAppDispatch();
  const [index, setIndex] = useState(0);
  const swiperRef = useRef<Swiper>(null);

  const handleSlideChange = (index: number) => {
    setIndex(index);
  };

  const handleNext = () => {
    Haptics.selectionAsync();
    swiperRef.current?.scrollBy(1);
  };

  const handleSkip = () => {
    swiperRef.current?.scrollBy(2 - index);
  };

  const handleStart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch(setIsFirstVisit(false));
    router.push("/auth");
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        backgroundColor: NAV_THEME[colorScheme].background,
      }}
    >
      <Swiper
        ref={swiperRef}
        dot={
          <View
            style={{
              backgroundColor: NAV_THEME[colorScheme].text,
              width: 8,
              height: 8,
              borderRadius: 4,
              marginLeft: 3,
              marginRight: 3,
              marginTop: 3,
              marginBottom: 3,
            }}
          />
        }
        activeDot={
          <View
            style={{
              backgroundColor: NAV_THEME[colorScheme].primary,
              width: 28,
              height: 8,
              borderRadius: 4,
              marginLeft: 3,
              marginRight: 3,
              marginTop: 3,
              marginBottom: 3,
            }}
          />
        }
        loop={false}
        onIndexChanged={handleSlideChange}
      >
        {/* Slide 1 - Welcome to ClaireNest */}
        <View className="flex-1 justify-center items-center p-6 h-full">
          <LottieView
            source={require("@/assets/lottie/nest.json")}
            autoPlay
            loop
            style={{ width: width * 0.7, height: height * 0.4 }}
          />
          <Text className="text-2xl text-center mt-4" style={{fontFamily: "Quicksand_700Bold"}}>
            Your Village, Organized
          </Text>
          <Text className="text-lg text-center mt-2">
            Let loved ones help you focus on what matters most.
          </Text>
        </View>

        {/* Slide 2 - How It Works */}
        <View className="flex-1 justify-center items-center p-6  h-full">
          <LottieView
            source={require("@/assets/lottie/task-coordination.json")}
            autoPlay
            loop
            style={{ width: width * 0.7, height: height * 0.4 }}
          />
          <Text className="text-2xl text-center mt-4" style={{fontFamily: "Quicksand_700Bold"}}>
            Coordinate Help, Stress-Free
          </Text>
          <Text className="text-lg text-center mt-2 ">
            Schedule meals, errands, and support with just a few taps.
          </Text>
        </View>

        {/* Slide 3 - For Helpers */}
        <View className="flex-1 justify-center items-center p-6 h-full">
          <LottieView
            source={require("@/assets/lottie/hearts.json")}
            autoPlay
            loop
            style={{ width: width * 0.7, height: height * 0.4 }}
          />
          <Text className="text-2xl text-center mt-4" style={{fontFamily: "Quicksand_700Bold"}}>
            Be Their Superhero
          </Text>
          <Text className="text-lg text-center mt-2 ">
            Join their circle and make a real difference.
          </Text>
        </View>
      </Swiper>

      {/* Navigation Buttons */}
      {index < 2 ? (
        <View className="flex-row w-full justify-between px-5 my-5">
          <Button variant="outline" onPress={handleSkip}>
            <Text>SKIP</Text>
          </Button>
          <Button onPress={handleNext}>
            <Text>NEXT</Text>
          </Button>
        </View>
      ) : (
        <View className="flex-row w-full justify-end  px-5 my-5">
          <Button onPress={handleStart}>
            <Text>GET STARTED</Text>
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
