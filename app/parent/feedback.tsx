import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import Animated, {
  FadeInUp,
  FadeOut,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { addFeedbackToFirebase } from "@/features/feedback/feedbackAPI";
import { router } from "expo-router";
import { getAuth } from "@react-native-firebase/auth";
import Toast from 'react-native-toast-message';
import * as Haptics from "expo-haptics";

const emojiOptions = [
  { id: "very_bad", icon: "😢", label: "Very Bad" },
  { id: "bad", icon: "😔", label: "Bad" },
  { id: "medium", icon: "😐", label: "Medium" },
  { id: "good", icon: "🙂", label: "Good" },
  { id: "very_good", icon: "😁", label: "Very Good" },
];

export default function FeedbackScreen() {
  const [selectedEmoji, setSelectedEmoji] = useState<string>("very_good");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scale = useSharedValue(1);
  const auth = getAuth();
  const user = auth.currentUser;
  const handleEmojiSelect = (id: string) => {
    setSelectedEmoji(id);
    scale.value = withSpring(1.2, { damping: 5 }, () => {
      scale.value = withSpring(1);
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await addFeedbackToFirebase({
        userId: user!.uid,
        comment: comment,
        rating: selectedEmoji,
      });
      router.back();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Feedback submitted successfully',
        text2: 'Thank you for your feedback!',
        visibilityTime: 5000,
        position: 'top',
      });
    } catch (error) {
      console.error("Error adding feedback to Firebase:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Error submitting feedback',
        text2: 'Please try again',
        visibilityTime: 5000,
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="flex-1 justify-center items-center p-6">
        <Card className="w-full max-w-md shadow-lg rounded-2xl">
          {/* Header */}
          <CardHeader>
            <CardTitle>Rate your experience with us</CardTitle>
            <CardDescription>
              Your input is valuable in helping us better understand your needs
              and tailor our service accordingly.
            </CardDescription>
          </CardHeader>

          {/* Emoji Selector */}
          <CardContent>
            <View className="flex-row justify-center mt-6 gap-2">
              {emojiOptions.map((emoji) => (
                <TouchableOpacity
                  key={emoji.id}
                  onPress={() => handleEmojiSelect(emoji.id)}
                  className={`p-3 rounded-full ${
                    selectedEmoji === emoji.id
                      ? "bg-green-500/20"
                      : "bg-gray-200"
                  }`}
                >
                  <Animated.Text
                    className="text-3xl"
                    style={{
                      transform: [
                        { scale: selectedEmoji === emoji.id ? scale : 1 },
                      ],
                    }}
                  >
                    {emoji.icon}
                  </Animated.Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selected Emoji Label */}
            {selectedEmoji && (
              <Animated.View
                entering={FadeInUp.duration(400)}
                exiting={FadeOut.duration(200)}
              >
                <View className="mt-4 items-center">
                  <Text className="text-lg" style={{fontFamily: "Quicksand_700Bold"}}>
                    {emojiOptions.find((e) => e.id === selectedEmoji)?.label}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Comment Box */}
            <Textarea
              className="mt-4 border border-gray-300 rounded-lg p-3 text-base"
              placeholder="What can we do better?"
              multiline
              value={comment}
              onChangeText={setComment}
            />
          </CardContent>

          <CardFooter>
            {/* Submit Button */}
            <Button
              className="w-full"
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text className="text-white text-lg" style={{fontFamily: "Quicksand_700Bold"}}>
                {isSubmitting ? "Submitting..." : "Submit Now"}
              </Text>
            </Button>
          </CardFooter>
        </Card>
      </View>
    </KeyboardAwareScrollView>
  );
}
