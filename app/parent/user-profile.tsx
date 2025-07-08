import { View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit } from "@/lib/icons/Edit";

import { selectUserData, updateUserData } from "@/features/user/userSlice";
import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppReduxHooks";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Haptics from "expo-haptics";
import { getAuth, updateProfile } from "@react-native-firebase/auth";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "@react-native-firebase/storage";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";
import { AlertTriangle } from "@/lib/icons/AlertTriangle";
import {
  AlertTitle,
  AlertDescription,
  Alert as RNRAlert,
} from "@/components/ui/alert";
import UpdateEmailDialog from "@/components/update-email-dialog";

type FormData = {
  firstName: string;
  lastName: string;
};

export default function UserProfile() {
  const firestoreUser = useAppSelector(selectUserData);
  const { colorScheme } = useColorScheme();
  const auth = getAuth();
  const user = auth.currentUser;
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const [photoUrl, setPhotoUrl] = useState(firestoreUser?.photoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      firstName: firestoreUser?.firstName
        ? firestoreUser?.firstName
        : firestoreUser?.displayName?.split(" ")[0] || "",
      lastName: firestoreUser?.lastName
        ? firestoreUser?.lastName
        : firestoreUser?.displayName?.split(" ")[1] || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await updateProfile(user!, {
        displayName: data.firstName + " " + data.lastName,
      });
      await dispatch(
        updateUserData({
          userId: firestoreUser!.userId,
          updatedData: {
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: data.firstName + " " + data.lastName,
          },
        })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async () => {
    setUploading(true);
    setUploadingProgress(0);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }
      if (
        result.assets?.[0]?.fileSize &&
        result.assets?.[0]?.fileSize > 1024 * 1024 * 2
      ) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", "File size must be less than 2MB");
        return;
      }
      const storage = getStorage();
      const storageRef = ref(storage, `profileImages/${user?.uid}/profile.jpg`);

      // Convert URI to blob before uploading
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();

      const uploadTask = uploadBytesResumable(storageRef, blob);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadingProgress(progress > 60 ? 60 : progress);
        },
        (error) => {
          // A full list of error codes is available at
          // https://firebase.google.com/docs/storage/web/handle-errors
          // switch (error.code) {
          //   case "storage/unauthorized":
          //     // User doesn't have permission to access the object
          //     break;
          //   case "storage/canceled":
          //     // User canceled the upload
          //     break;

          //   // ...

          //   case "storage/unknown":
          //     // Unknown error occurred, inspect error.serverResponse
          //     break;
          // }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("Error", "Error uploading image");
          setUploading(false);
          setPhotoUrl(user?.photoURL || "");
        },
        () => {
          // Handle successful uploads on complete
          // For instance, get the download URL: https://firebasestorage.googleapis.com/...
          getDownloadURL(uploadTask.snapshot!.ref).then(async (downloadURL) => {
            if (downloadURL) {
              setPhotoUrl(downloadURL);
              await updateProfile(user!, {
                photoURL: downloadURL,
              });
              setUploadingProgress(70);
              await dispatch(
                updateUserData({
                  userId: firestoreUser!.userId,
                  updatedData: { photoUrl: downloadURL },
                })
              );
              setUploadingProgress(85);
              await user?.reload();
              setUploadingProgress(100);
              setUploading(false);
              setPhotoUrl(result.assets[0].uri);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("Success", "Profile image updated successfully!");
            }
          });
        }
      );
    } catch (error) {
      setUploading(false);
      console.error("Error uploading image:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPhotoUrl(user?.photoURL || "");
      Alert.alert("Error", "Error uploading image");
    }
  };

  return (
    <View className="flex-1 p-4">
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
      >
        {uploading ? (
          <View className="self-center">
            <AnimatedCircularProgress
              size={80}
              width={5}
              fill={uploadingProgress}
              tintColor={NAV_THEME[colorScheme].primary}
              backgroundColor={NAV_THEME[colorScheme].background}
            />
          </View>
        ) : (
          <View className="self-center">
            <TouchableOpacity
              onPress={handleImageUpload}
              className="self-center"
            >
              <Avatar className="w-24 h-24" alt="User Profile Picture">
                <AvatarImage source={{ uri: photoUrl || "" }} />
                <AvatarFallback>
                  <Text className="text-xl">
                    {firestoreUser?.firstName?.charAt(0)}{" "}
                    {firestoreUser?.lastName?.charAt(0)}
                  </Text>
                </AvatarFallback>
              </Avatar>
              <View className="absolute bottom-0 right-0 bg-primary p-1 rounded-full">
                <Edit size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-sm text-muted-foreground mt-2">
              Max file size is 2MB
            </Text>
          </View>
        )}
        {/* Form */}
        <View className="mt-6">
          <Label nativeID="firstName" className="text-lg" style={{fontFamily: "Quicksand_700Bold"}}>
            First Name
          </Label>
          <Controller
            control={control}
            name="firstName"
            rules={{ required: "First name is required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                className="mt-2"
                placeholder="First Name"
              />
            )}
          />
          {errors.firstName && (
            <Text className="text-red-500">{errors.firstName.message}</Text>
          )}

          <Label nativeID="lastName" className="text-lg" style={{fontFamily: "Quicksand_700Bold"}}>
            Last Name
          </Label>
          <Controller
            control={control}
            name="lastName"
            rules={{ required: "Last name is required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                className="mt-2"
                placeholder="Last Name"
              />
            )}
          />
          {errors.lastName && (
            <Text className="text-red-500">{errors.lastName.message}</Text>
          )}
        </View>

        {/* Save Button */}
        <Button
          className="mt-6"
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text
              className="text-white"
              style={{ fontFamily: "Quicksand_700Bold" }}
            >
              Save Changes
            </Text>
          )}
        </Button>

        {auth.currentUser?.providerData[0].providerId === "password" ? (
          <UpdateEmailDialog
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        ) : (
          <RNRAlert
            icon={AlertTriangle}
            variant="default"
            className="max-w-xl mt-2"
          >
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              {auth.currentUser?.providerData[0].providerId === "google.com"
                ? "Your email cannot be updated since you are logged in with Google."
                : "Your email cannot be updated since you are logged in with Apple."}
            </AlertDescription>
          </RNRAlert>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
