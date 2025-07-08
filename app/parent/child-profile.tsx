import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/lib/icons/Calendar";
import { Plus } from "@/lib/icons/Plus";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/lib/constants";
import { ChildProfile } from "@/interfaces";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { FullWindowOverlay } from "react-native-screens";
import { PortalHost } from "@rn-primitives/portal";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import { selectUserData, updateUserData } from "@/features/user/userSlice";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Baby } from "@/lib/icons/Baby";

/// for alert-dialog to work on a modal screen
const CUSTOM_PORTAL_HOST_NAME = "child-profile-screen";
const WindowOverlay =
  Platform.OS === "ios" ? FullWindowOverlay : React.Fragment;

const generateRandomColor = (index: number) => {
  const colors = ["#FF0000", "#00FF00", "#FFA500", "#808000", "#FF00FF", "#00FFFF", "#0000FF", "#800080", "#008000", "#000080", "#800000", "#808000", "#008080", "#C0C0C0"];
  if(index > colors.length) {
    return colors[0];
  }
  return colors[index];
};

// Memoized child item component to prevent unnecessary re-renders
const ChildItem = React.memo(
  ({
    child,
    index,
    isSelected,
    onSelect,
  }: {
    child: ChildProfile;
    index: number;
    isSelected: boolean;
    onSelect: (id: string) => void;
  }) => (
    <TouchableOpacity
      onPress={() => onSelect(child.id)}
      className={`flex flex-row items-center p-2 mx-2 gap-2 rounded-full h-full ${
        isSelected ? "border-2 border-primary" : ""
      }`}
    >
      <Baby size={24} color={generateRandomColor(index)} />
      <Text className="text-center text-xl">{child.name}</Text>
    </TouchableOpacity>
  )
);

// Memoized child details component
const ChildDetails = React.memo(
  ({
    child,
    colorScheme,
    onRemove,
  }: {
    child: ChildProfile;
    colorScheme: "light" | "dark";
    onRemove: (id: string) => void;
  }) => (
    <>
      {/* Profile Section */}
      <Animated.View entering={FadeInUp.duration(500)}>
        <Card className="items-center p-6">
          <Text className="text-xl mt-3" style={{fontFamily: "Quicksand_700Bold"}}>{child.name}</Text>
          <View className="flex-row items-center mt-1">
            <Calendar size={18} color={NAV_THEME[colorScheme].text} />
            <Text className="ml-2">{child.birthdate}</Text>
          </View>
        </Card>
      </Animated.View>

      {/* Growth Stats */}
      {/* <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <Card className="mt-4 p-4">
          <Text className="text-lg" style={{fontFamily: "Quicksand_700Bold"}}>Growth Progress</Text>
          <View className="flex-row justify-between mt-2">
            <View className="items-center">
              <Ruler size={22} color={NAV_THEME[colorScheme].text} />
              <Text className="mt-1">{child.height || "Not set"}</Text>
            </View>
            <View className="items-center">
              <Heart size={22} color={NAV_THEME[colorScheme].text} />
              <Text className="mt-1">{child.weight || "Not set"}</Text>
            </View>
          </View>
        </Card>
      </Animated.View> */}

      {/* Milestones Section */}
      {/* <Animated.View entering={FadeInUp.delay(200).duration(500)}>
        <Card className="mt-4 p-4">
          <Text className="text-lg" style={{fontFamily: "Quicksand_700Bold"}}>Milestones</Text>
          <View className="flex-row flex-wrap mt-2 gap-2">
            {child.milestones?.map((milestone, index) => (
              <Badge key={index} variant="secondary" className="px-3 py-1">
                {milestone.icon}
                <Text className="ml-2 text-sm">{milestone.name}</Text>
              </Badge>
            ))}
          </View>
        </Card>
      </Animated.View> */}

      {/* Actions */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(500)}
        className="mt-6 flex-row items-center justify-between"
      >
        <Button
          variant="outline"
          onPress={() => router.push(`/parent/add-child?childId=${child.id}`)}
        >
          <Text style={{fontFamily: "Quicksand_700Bold"}}>Update Child Profile</Text>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Text className="text-white" style={{fontFamily: "Quicksand_700Bold"}}>
                Delete Child Profile
              </Text>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent portalHost={CUSTOM_PORTAL_HOST_NAME}>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                child profile and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                <Text>Cancel</Text>
              </AlertDialogCancel>
              <AlertDialogAction onPress={() => onRemove(child.id)}>
                <Text>Continue</Text>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Animated.View>
    </>
  )
);

const EmptyState = React.memo(
  ({ colorScheme }: { colorScheme: "light" | "dark" }) => (
    <View className="flex-1 items-center justify-center p-6">
      <View className="items-center mb-8">
        <Baby size={64} color={NAV_THEME[colorScheme].text} className="mb-4" />
        <Text className="text-2xl text-center mb-2" style={{fontFamily: "Quicksand_700Bold"}}>No Children Added Yet</Text>
        <Text className="text-base text-muted-foreground text-center">
          Start by adding your first child.
        </Text>
      </View>
      <Button
        onPress={() => router.push("/parent/add-child")}
        className="flex-row items-center px-6 py-3"
      >
        <Plus size={20} className="mr-2" color="white" />
        <Text style={{fontFamily: "Quicksand_700Bold"}}>Add Your First Child</Text>
      </Button>
    </View>
  )
);

export default function ChildProfileScreen() {
  const { colorScheme } = useColorScheme();
  const dispatch = useAppDispatch();
  const firestoreUser = useAppSelector(selectUserData);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const children = useMemo(
    () => firestoreUser?.children || [],
    [firestoreUser?.children]
  );
  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId),
    [children, selectedChildId]
  );

  // Set initial selected child if none is selected
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const removeChild = useCallback(
    async (id: string) => {
      try {
        if (!firestoreUser) return;

        const updatedChildren = children.filter((child) => child.id !== id);
        await dispatch(
          updateUserData({
            userId: firestoreUser.userId,
            updatedData: { children: updatedChildren },
          })
        ).unwrap();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // If the removed child was selected, select the first remaining child if any
        if (selectedChildId === id) {
          setSelectedChildId(updatedChildren.length > 0 ? updatedChildren[0].id : null);
        }
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        console.error("Error removing child:", error);
      }
    },
    [children, dispatch, firestoreUser, selectedChildId]
  );

  const handleSelectChild = useCallback((id: string) => {
    setSelectedChildId(id);
  }, []);

  return (
    <>
      <View className="p-4">
        {/* Horizontal Scroll for Children Selection */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {children.map((child, index) => (
            <ChildItem
              key={child.id}
              child={child}
              index={index}
              isSelected={child.id === selectedChildId}
              onSelect={handleSelectChild}
            />
          ))}
        </ScrollView>

        <FlatList
          data={selectedChild ? [selectedChild] : []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChildDetails
              child={item}
              colorScheme={colorScheme}
              onRemove={removeChild}
            />
          )}
          ListEmptyComponent={<EmptyState colorScheme={colorScheme} />}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </View>
      <WindowOverlay>
        <PortalHost name={CUSTOM_PORTAL_HOST_NAME} />
      </WindowOverlay>
    </>
  );
}
