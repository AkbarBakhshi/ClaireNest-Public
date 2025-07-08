import { useLocalSearchParams, Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Button } from "react-native";
import { setItem } from "@/lib/storage";

export default function InvitePage() {
  const { code } = useLocalSearchParams(); // This is the parentId
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    async function validateParentId() {
      if (!code) {
        setLoading(false);
        return;
      }

      // check the code validity after the user is logged in or signed up
      setIsValid(true);
      setItem("inviteParentId", code as string); // Store it for later
      setLoading(false);
    }

    validateParentId();
  }, [code]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isValid) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg text-red-500" style={{fontFamily: "Quicksand_700Bold"}}>
          Invalid invite link.
        </Text>
        <Text className="text-center text-gray-600">
          The invite link seems incorrect or expired. Please contact the person who invited you and try again.
        </Text>
        <Button title="Go Back" onPress={() => router.replace("/")} />
      </View>
    );
  }
  return <Redirect href="/" />; // Continue normal login/signup process
}