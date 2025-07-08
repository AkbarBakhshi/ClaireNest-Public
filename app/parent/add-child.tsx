import React, { useState } from "react";
import { View, TouchableOpacity, Platform } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit } from "@/lib/icons/Edit";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Haptics from "expo-haptics";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import { selectUserData } from "@/features/user/userSlice";
import { updateUserData } from "@/features/user/userSlice";
import { router, useLocalSearchParams } from "expo-router";
import { ChildProfile } from "@/interfaces";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, formatISO, parse, parseISO } from "date-fns";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/lib/constants";
import { CalendarDays } from "@/lib/icons/CalendarDays";

type FormData = {
  name: string;
  birthdate: string;
};

export default function AddChild() {
  const { colorScheme } = useColorScheme();
  const dispatch = useAppDispatch();
  const firestoreUser = useAppSelector(selectUserData);
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const existingChild = childId
    ? firestoreUser?.children?.find((child) => child.id === childId)
    : null;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: existingChild?.name || "",
      birthdate: existingChild?.birthdate
        ? formatISO(
            parse(existingChild?.birthdate, "EEE MMM dd, yyyy", new Date())
          )
        : "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (!firestoreUser) return;

      const newChild: ChildProfile = {
        id: childId || Date.now().toString(),
        name: data.name,
        birthdate: format(
          parseISO(new Date(data.birthdate).toISOString()),
          "EEE MMM d, yyyy"
        ),
        height: existingChild?.height || "",
        weight: existingChild?.weight || "",
        milestones: existingChild?.milestones || [],
      };

      const updatedChildren = existingChild
        ? firestoreUser.children?.map((child) =>
            child.id === childId ? newChild : child
          ) || []
        : [...(firestoreUser.children || []), newChild];

      await dispatch(
        updateUserData({
          userId: firestoreUser.userId,
          updatedData: { children: updatedChildren },
        })
      ).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Child profile saved successfully!",
        visibilityTime: 5000,
        position: "top",
      });
      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Failed to save child profile.",
        visibilityTime: 5000,
        position: "top",
      });
    }
  };

  return (
    <View className="flex-1 p-4">
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
      >
        <View className="absolute bottom-0 right-0 bg-primary p-1 rounded-full">
          <Edit size={16} color="white" />
        </View>

        {/* Form */}
        <View className="mt-6">
          <Label
            nativeID="name"
            className="text-lg"
            style={{ fontFamily: "Quicksand_700Bold" }}
          >
            Child's Name
          </Label>
          <Controller
            control={control}
            name="name"
            rules={{ required: "Name is required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                className="mt-2"
                placeholder="Child's Name"
              />
            )}
          />
          {errors.name && (
            <Text className="text-red-500">{errors.name.message}</Text>
          )}

          <Label
            nativeID="birthdate"
            className="text-lg"
            style={{ fontFamily: "Quicksand_700Bold" }}
          >
            Birthdate
          </Label>
          <Controller
            control={control}
            name="birthdate"
            rules={{ required: "Birthdate is required" }}
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="mt-2"
                  activeOpacity={0.7}
                >
                  <View className="border border-input rounded-md p-3 bg-background flex-row items-center gap-2">
                    <CalendarDays
                      size={20}
                      color={NAV_THEME[colorScheme].primary}
                    />
                    {value ? (
                      <Text>
                        {format(
                          parseISO(new Date(value.toString()).toISOString()),
                          "EEE MMM d, yyyy"
                        )}
                      </Text>
                    ) : (
                      <Text className="text-muted-foreground">Select Date</Text>
                    )}
                  </View>
                </TouchableOpacity>
                {showDatePicker &&
                  (Platform.OS === "ios" ? (
                    <DateTimePicker
                      value={value ? new Date(value.toString()) : new Date()}
                      mode="date"
                      display="inline"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          onChange(selectedDate.toISOString());
                        }
                      }}
                      maximumDate={new Date()}
                    />
                  ) : (
                    <DateTimePicker
                      value={value ? new Date(value.toString()) : new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          onChange(selectedDate.toISOString());
                        }
                      }}
                      maximumDate={new Date()}
                    />
                  ))}
              </>
            )}
          />
          {errors.birthdate && (
            <Text className="text-red-500">{errors.birthdate.message}</Text>
          )}
        </View>

        {/* Save Button */}
        <Button className="mt-6" onPress={handleSubmit(onSubmit)}>
          <Text
            className="text-white"
            style={{ fontFamily: "Quicksand_700Bold" }}
          >
            {existingChild ? "Update Profile" : "Add Child"}
          </Text>
        </Button>
      </KeyboardAwareScrollView>
    </View>
  );
}
