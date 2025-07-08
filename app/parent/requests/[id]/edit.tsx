import {
  View,
  Pressable,
  Modal,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { updateRequest, selectRequests } from "@/features/request/requestSlice";
import { selectUserData } from "@/features/user/userSlice";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import { SafeAreaView } from "react-native-safe-area-context";
import { HelpRequest, TaskType } from "@/interfaces";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInRight,
} from "react-native-reanimated";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, parseISO } from "date-fns";
import { Timestamp } from "firebase/firestore";
import * as Haptics from "expo-haptics";
import { NAV_THEME, TASK_TYPES } from "@/lib/constants";
import { Ionicons } from "@expo/vector-icons";
import { CalendarDays } from "@/lib/icons/CalendarDays";
import { useColorScheme } from "@/lib/useColorScheme";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "@/lib/icons/AlertTriangle";

export default function EditRequest() {
  const { id } = useLocalSearchParams();
  const firestoreUser = useAppSelector(selectUserData);
  const requests = useAppSelector(selectRequests);
  const request = requests.find((request) => request.id === id);

  const [isLoading, setIsLoading] = useState(false);
  const [endTimeError, setEndTimeError] = useState(false);
  const [taskType, setTaskType] = useState<TaskType>(request!.type);
  const [mode, setMode] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const dispatch = useAppDispatch();
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const { colorScheme } = useColorScheme();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<HelpRequest>({
    defaultValues: {
      title: request?.title,
      type: taskType,
      notes: request?.notes,
      status: request?.status,
      urgency: request?.urgency,
      startDateTime: new Date(request?.startDateTime.toDate()!).toISOString(),
      endDateTime: request?.endDateTime
        ? new Date(request?.endDateTime?.toDate()!).toISOString()
        : "",
      createdAt: request?.createdAt,
      parentId: request?.parentId,
    },
  });

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [errors]);

  const onSubmit = async (data: HelpRequest) => {
    setIsLoading(true);

    try {
      // Convert dates to timestamps
      const startTimestamp = Timestamp.fromDate(
        new Date(data.startDateTime.toString())
      );

      let endTimestamp = null;
      if (data.endDateTime) {
        const endDate = new Date(data.endDateTime.toString());
        const startDate = new Date(data.startDateTime.toString());

        // Only set endDateTime if it's after startDateTime
        if (endDate > startDate) {
          endTimestamp = Timestamp.fromDate(endDate);
        } else {
          setEndTimeError(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
      }

      const transformedData: HelpRequest = {
        ...data,
        type: taskType,
        startDateTime: startTimestamp,
        endDateTime: endTimestamp,
      };

      const result = await dispatch(
        updateRequest({
          id: request!.id,
          updatedFields: transformedData,
          currentUserId: firestoreUser!.userId,
          updateType: "edited",
        })
      );
      if (updateRequest.rejected.match(result)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: "Error updating request",
          text2: "Please try again",
          visibilityTime: 5000,
          position: "top",
        });
        throw new Error(
          (result.payload as string) || "Failed to update request"
        );
      }
      router.back(); // Navigate back
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Request updated successfully",
        text2: "Your request has been updated!",
        visibilityTime: 5000,
        position: "top",
      });
    } catch (error) {
      console.error("Error updating request:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Error updating request",
        text2: "Please try again",
        visibilityTime: 5000,
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 my-4 bg-background">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          className="px-4 flex-row justify-between items-center mb-4 border-b border-muted pb-2"
          entering={FadeIn.delay(200).duration(300)}
        >
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
            disabled={isLoading}
            className="flex-row items-center gap-1 px-0"
          >
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={NAV_THEME[colorScheme].primary}
            />
          </Button>
          <Text
            className="text-2xl"
            style={{ fontFamily: "Quicksand_700Bold" }}
          >
            Edit Request
          </Text>
        </Animated.View>
        {/* Title Input */}
        <Animated.View
          className="px-4"
          entering={FadeInUp.delay(100).duration(300)}
        >
          <Label
            className="mb-2"
            nativeID="Title"
            style={{ fontFamily: "Quicksand_700Bold", fontSize: 18 }}
          >
            Title* (max 40 characters)
          </Label>
          <Controller
            control={control}
            name="title"
            rules={{
              required: "Title is required",
              maxLength: {
                value: 40,
                message: "Title must be under 40 characters",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <Input
                  placeholder="Enter a title for your task"
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    if (text.length <= 40) {
                      onChange(text);
                    }
                  }}
                  value={value}
                  className="text-foreground"
                  maxLength={40}
                />
                <View
                  className={cn(
                    "flex-row items-center justify-end mb-2",
                    errors.title && "justify-between"
                  )}
                >
                  {errors.title && (
                    <Text
                      className="text-destructive"
                      style={{ fontFamily: "Quicksand_700Bold" }}
                    >
                      {errors.title.message}
                    </Text>
                  )}
                  <Text className="text-xs text-muted-foreground text-right">
                    {value ? value.length : 0}/40 characters
                  </Text>
                </View>
              </>
            )}
          />
        </Animated.View>

        {/* Notes Input */}
        <Animated.View className="mb-4 px-4" entering={FadeInUp.duration(300)}>
          <Label
            className="mb-2"
            nativeID="notes"
            style={{ fontFamily: "Quicksand_700Bold", fontSize: 18 }}
          >
            Notes (Optional)
          </Label>
          <Controller
            control={control}
            name="notes"
            rules={{
              maxLength: 1000,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Textarea
                placeholder="Describe what you need help with"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                numberOfLines={4}
              />
            )}
          />
        </Animated.View>

        <Animated.Text
          entering={FadeInUp.delay(100).duration(400)}
          className="mb-2 text-foreground px-4"
          style={{ fontFamily: "Quicksand_700Bold", fontSize: 18 }}
        >
          Task Type
        </Animated.Text>

        <Animated.View
          entering={FadeInUp.duration(400)}
          className="flex-row gap-2 flex-wrap mb-4 px-4"
        >
          {TASK_TYPES.map((type, index) => (
            <Animated.View
              key={type.value}
              entering={FadeInRight.delay(800 + index * 100).duration(400)}
            >
              <TouchableOpacity
                className={cn(
                  "p-2 rounded-lg bg-secondary flex-row items-center",
                  taskType === type.value && "bg-primary"
                )}
                onPress={() => setTaskType(type.value)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={
                    taskType === type.value
                      ? NAV_THEME[colorScheme].background
                      : NAV_THEME[colorScheme].primary
                  }
                />
                <Text
                  className={cn(
                    "text-sm ml-2",
                    taskType === type.value && "text-background"
                  )}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Urgency Level */}
        <Animated.View
          className="px-4"
          entering={FadeInUp.delay(500).duration(300)}
        >
          <Label
            className="mb-2"
            nativeID="Urgency"
            style={{ fontFamily: "Quicksand_700Bold", fontSize: 18 }}
          >
            Urgency*
          </Label>
          <Controller
            control={control}
            rules={{ required: "Urgency is required" }}
            name="urgency"
            render={({ field: { onChange, value } }) => (
              <RadioGroup
                value={value}
                onValueChange={onChange}
                className="flex-row items-center gap-6 flex-wrap mb-4"
              >
                <RadioGroupItemWithLabel value="low" />
                <RadioGroupItemWithLabel value="medium" />
                <RadioGroupItemWithLabel value="high" />
              </RadioGroup>
            )}
          />
          {errors.urgency && (
            <Text
              className="text-destructive mb-2"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              {errors.urgency.message}
            </Text>
          )}
        </Animated.View>

        {/* Start DateTime Picker */}
        <Animated.View
          className="mb-4 px-4"
          entering={FadeInUp.delay(300).duration(300)}
        >
          <Label
            className="mb-2"
            nativeID="startDateTime"
            style={{ fontFamily: "Quicksand_700Bold", fontSize: 18 }}
          >
            Start Date*
          </Label>
          <Controller
            control={control}
            name="startDateTime"
            rules={{ required: "Date is required" }}
            render={({ field: { onChange, value } }) => (
              <>
                <Pressable
                  onPress={() => setShowStartDatePicker(true)}
                  className="p-4 bg-secondary rounded-lg flex-row items-center gap-2"
                >
                  <CalendarDays
                    size={20}
                    color={NAV_THEME[colorScheme].primary}
                  />
                  <Text>
                    {value
                      ? format(
                          parseISO(new Date(value.toString()).toISOString()),
                          "EEE MMM d, yyyy h:mma"
                        )
                      : "Select Date"}
                  </Text>
                </Pressable>

                {Platform.OS === "ios" ? (
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showStartDatePicker}
                    onRequestClose={() => setShowStartDatePicker(false)}
                  >
                    <View className="flex-1 justify-end bg-black/50">
                      <View className="bg-background h-[500px] p-4">
                        <View className="flex-row justify-end mb-2">
                          <Pressable
                            onPress={() => setShowStartDatePicker(false)}
                          >
                            <Text
                              className="text-primary text-2xl"
                              style={{ fontFamily: "Quicksand_700Bold" }}
                            >
                              Done
                            </Text>
                          </Pressable>
                        </View>
                        <DateTimePicker
                          value={
                            value ? new Date(value.toString()) : new Date()
                          }
                          mode="datetime"
                          display="inline"
                          onChange={(event, selectedDate) => {
                            if (selectedDate) {
                              onChange(selectedDate.toISOString());
                            }
                          }}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  showStartDatePicker && (
                    <DateTimePicker
                      value={
                        tempDate ||
                        (value ? new Date(value.toString()) : new Date())
                      }
                      mode={mode}
                      display="default"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          if (mode === "date") {
                            setTempDate(selectedDate);
                            setMode("time");
                          } else {
                            // Combine the temp date with the selected time
                            const finalDate = new Date(tempDate!);
                            finalDate.setHours(selectedDate.getHours());
                            finalDate.setMinutes(selectedDate.getMinutes());
                            onChange(finalDate.toISOString());
                            setTempDate(null);
                            setMode("date");
                            setShowStartDatePicker(false);
                          }
                        } else {
                          setShowStartDatePicker(false);
                          setMode("date");
                          setTempDate(null);
                        }
                      }}
                    />
                  )
                )}
              </>
            )}
          />
          {errors.startDateTime && (
            <Text className="text-destructive mb-2">
              {errors.startDateTime.message}
            </Text>
          )}
        </Animated.View>

        {/* End DateTime Picker */}
        <Animated.View
          className="mb-4 px-4"
          entering={FadeInUp.delay(300).duration(300)}
        >
          <Label
            className="mb-2"
            nativeID="endDateTime"
            style={{ fontFamily: "Quicksand_700Bold", fontSize: 18 }}
          >
            End Date (Optional)
          </Label>
          <Controller
            control={control}
            name="endDateTime"
            render={({ field: { onChange, value } }) => (
              <>
                <Pressable
                  onPress={() => setShowEndDatePicker(true)}
                  className="p-4 bg-secondary rounded-lg flex-row items-center gap-2"
                >
                  <CalendarDays
                    size={20}
                    color={NAV_THEME[colorScheme].primary}
                  />
                  <Text>
                    {value
                      ? format(
                          parseISO(new Date(value.toString()).toISOString()),
                          "EEE MMM d, yyyy h:mma"
                        )
                      : "Select Date"}
                  </Text>
                </Pressable>

                {Platform.OS === "ios" ? (
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showEndDatePicker}
                    onRequestClose={() => setShowEndDatePicker(false)}
                  >
                    <View className="flex-1 justify-end bg-black/50">
                      <View className="bg-background h-[500px] p-4">
                        <View className="flex-row justify-end mb-2">
                          <Pressable
                            onPress={() => setShowEndDatePicker(false)}
                          >
                            <Text
                              className="text-primary text-2xl"
                              style={{ fontFamily: "Quicksand_700Bold" }}
                            >
                              Done
                            </Text>
                          </Pressable>
                        </View>
                        <DateTimePicker
                          minimumDate={
                            new Date(
                              new Date(
                                control._getWatch("startDateTime")
                              ).getTime() +
                                1 * 60 * 1000
                            )
                          }
                          value={
                            value ? new Date(value.toString()) : new Date()
                          }
                          mode="datetime"
                          display="inline"
                          onChange={(event, selectedDate) => {
                            if (selectedDate) {
                              onChange(selectedDate.toISOString());
                            }
                          }}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  showEndDatePicker && (
                    <DateTimePicker
                      minimumDate={
                        new Date(
                          new Date(
                            control._getWatch("startDateTime")
                          ).getTime() +
                            1 * 60 * 1000
                        )
                      }
                      value={
                        tempDate ||
                        (value ? new Date(value.toString()) : new Date())
                      }
                      mode={mode}
                      display="default"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          if (mode === "date") {
                            setTempDate(selectedDate);
                            setMode("time");
                          } else {
                            // Combine the temp date with the selected time
                            const finalDate = new Date(tempDate!);
                            finalDate.setHours(selectedDate.getHours());
                            finalDate.setMinutes(selectedDate.getMinutes());
                            onChange(finalDate.toISOString());
                            setTempDate(null);
                            setMode("date");
                            setShowEndDatePicker(false);
                          }
                        } else {
                          setShowEndDatePicker(false);
                          setMode("date");
                          setTempDate(null);
                        }
                      }}
                    />
                  )
                )}
              </>
            )}
          />
          {errors.endDateTime && (
            <Text
              className="text-destructive mb-2"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              {errors.endDateTime.message}
            </Text>
          )}
          {endTimeError && (
            <Text
              className="text-destructive mt-2"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              End time must be after start time
            </Text>
          )}
        </Animated.View>

        {(Object.keys(errors).length > 0 || endTimeError) && (
          <Animated.View className="px-4" entering={FadeInRight.duration(300)}>
            <Alert
              icon={AlertTriangle}
              variant="destructive"
              className="max-w-xl mb-2"
            >
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>Please fix the errors above.</AlertDescription>
            </Alert>
          </Animated.View>
        )}

        {/* Submit Button */}
        <Animated.View
          className="mb-4 px-4"
          entering={FadeIn.delay(200).duration(300)}
        >
          <Button
            size="lg"
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator className="w-4 h-4 mr-2" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Text>Update Request</Text>
                <Ionicons name="send-outline" size={24} color="white" />
              </View>
            )}
          </Button>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function RadioGroupItemWithLabel({ value }: { value: string }) {
  return (
    <View className={"flex-row gap-2 items-center"}>
      <RadioGroupItem aria-labelledby={`label-for-${value}`} value={value} />
      <Label nativeID={`label-for-${value}`}>{value}</Label>
    </View>
  );
}
