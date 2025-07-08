import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator } from "react-native";
import { Share } from "react-native";
import Animated, { BounceIn, FadeInUp } from "react-native-reanimated";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import {
  selectUserData,
  fetchSupporters,
  selectSupporters,
  selectSupportersLoading,
} from "@/features/user/userSlice";
import { Supporter } from "@/interfaces";
import SupporterCard from "@/components/supporter-card";
import { Ionicons } from "@expo/vector-icons";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";

export default function SupportersScreen() {
  const { colorScheme } = useColorScheme();
  const dispatch = useAppDispatch();
  const firestoreUser = useAppSelector(selectUserData);
  const invitedSupporters = useAppSelector(selectSupporters);
  const inviteParentsLoading = useAppSelector(selectSupportersLoading);
  const inviteLink = `https://clairenest.com/invite/${firestoreUser?.userId}`;

  useEffect(() => {
    const fetchData = async () => {
      const families = firestoreUser?.families ?? [];
      if (families.length > 0) {
        await dispatch(fetchSupporters(families)).unwrap();
      }
    };
    fetchData();
  }, []);

  const shareInvite = async () => {
    try {
      await Share.share({
        message: `Join my parenting support network: ${inviteLink}`,
        // url: inviteLink, // iOS only
      });
    } catch (error) {
      console.error("Error sharing invite:", error);
    }
  };

  const EmptyState = () => (
    <Animated.View
      entering={FadeInUp.delay(300).duration(500)}
      className="flex-1 justify-center px-4 py-10"
    >
      <View className="bg-primary/90 p-6 rounded-2xl items-center mb-6 shadow-md">
        <Text
          className="text-white text-2xl mb-2"
          style={{ fontFamily: "Quicksand_700Bold" }}
        >
          Invite Your Support Circle
        </Text>
        <Text
          className="text-white text-center mb-6"
          style={{ fontFamily: "Quicksand_500Medium" }}
        >
          Share your unique invite link to start building your network of supporters.
        </Text>
        <View className="bg-white px-4 py-2 rounded-lg mb-4">
          <Text
            className="text-xl text-primary"
            style={{ fontFamily: "Quicksand_700Bold" }}
          >
            {firestoreUser?.userId}
          </Text>
        </View>
        <Button
          variant="secondary"
          size="lg"
          className="flex-row items-center gap-2 bg-muted p-2 rounded-lg"
          onPress={shareInvite}
        >
          <Ionicons name="share-outline" size={24} color={NAV_THEME[colorScheme].text} />
          <Text style={{ fontFamily: "Quicksand_700Bold" }}>
            Share Your Link
          </Text>
        </Button>
      </View>
  
      <View className="bg-secondary/10 border-l-4 border-primary p-5 rounded-xl">
        <Text
          className="text-lg mb-2"
          style={{ fontFamily: "Quicksand_700Bold" }}
        >
          How it Works
        </Text>
        <Text className="text-base text-muted-foreground">
          Share your invite link with trusted family and friends. When they tap it, they’ll be redirected back to the app and connected to your support circle.
        </Text>
        <Text className="text-base text-muted-foreground mt-2">
          You'll get a notification when someone joins, and you’ll need to approve them before they can view or claim your requests. This keeps your circle secure and trusted.
        </Text>
      </View>
    </Animated.View>
  );
  

  // Sort supporters by status (pending first) and then by name
  const sortedSupporters = [...(invitedSupporters || [])].sort((a, b) => {
    // First, sort by status (pending first)
    const aIsPending = firestoreUser?.families?.find(
      (f) => f.id === a.userId && f.status !== "approved"
    );
    const bIsPending = firestoreUser?.families?.find(
      (f) => f.id === b.userId && f.status !== "approved"
    );

    if (aIsPending && !bIsPending) return -1;
    if (!aIsPending && bIsPending) return 1;

    // Then sort by name
    const aName = a.displayName || `${a.firstName} ${a.lastName}`;
    const bName = b.displayName || `${b.firstName} ${b.lastName}`;
    return aName.localeCompare(bName);
  });

  if (inviteParentsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background px-2 items-center justify-center">
        <ActivityIndicator size="large" color={NAV_THEME[colorScheme].text} />
        <Text className="text-lg">Loading Supporters...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-2">
      {!invitedSupporters || invitedSupporters?.length == 0 ? (
        <EmptyState />
      ) : (
        <>
          <Animated.View entering={FadeInUp.delay(100).duration(700)}>
            <Card className="p-6 mb-4 rounded-2xl border-0 shadow-sm mx-6 bg-primary/5">
              <View className="space-y-4">
                <View className="flex-row items-center gap-3">
                  <View className="bg-primary/10 p-3 rounded-full">
                    <Ionicons
                      name="people-outline"
                      size={24}
                      color={NAV_THEME[colorScheme].primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text 
                      className="text-lg"
                      style={{ fontFamily: "Quicksand_700Bold" }}
                    >
                      Grow Your Support Network
                    </Text>
                    <Text className="text-muted-foreground mt-1">
                      Invite friends & family to support you on your parenting journey
                    </Text>
                  </View>
                </View>
                <Button
                  onPress={shareInvite}
                  size="lg"
                  className="flex-row items-center justify-center gap-2 bg-primary mt-2"
                >
                  <Ionicons
                    name="share-outline"
                    size={24}
                    color={NAV_THEME[colorScheme].background}
                  />
                  <Text 
                    className="text-white"
                    style={{ fontFamily: "Quicksand_700Bold" }}
                  >
                    Share Invite
                  </Text>
                </Button>
              </View>
            </Card>
          </Animated.View>

          <View className="flex-1 justify-center p-6">
            <FlatList
              data={sortedSupporters}
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={FadeInUp.delay(index * 100).duration(300)}
                  layout={BounceIn}
                  className="mx-4"
                >
                  <SupporterCard item={item as Supporter} index={index} />
                </Animated.View>
              )}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
