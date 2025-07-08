import { NAV_THEME } from "@/lib/constants";
import {
  addUserData,
  getUserData,
  selectUserData,
  selectUserFirstVisit,
  setIsFirstVisit,
  updateUserData,
} from "@/features/user/userSlice";
import { useColorScheme } from "@/lib/useColorScheme";
import { FirebaseAuthTypes, getAuth } from "@react-native-firebase/auth";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import { getItem, removeItem, setItem } from "@/lib/storage";
import * as Haptics from "expo-haptics";
import { addFamilyConnection } from "@/features/user/userAPI";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const dispatch = useAppDispatch();
  const isFirstVisit = useAppSelector(selectUserFirstVisit);
  const firestoreUser = useAppSelector(selectUserData);

  // Handle user state changes
  function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    setLoading(true);
    // console.log("user: ", user);
    if (user) {
      auth.currentUser
        ?.reload()
        .then(async () => {
          // console.log("User reload:", user);
          const currrentUserData = await dispatch(
            getUserData(user.uid)
          ).unwrap();
          const parentId = getItem("inviteParentId") as string | null;
          if (!currrentUserData) {
            // this is the case where there is no user in the database
            dispatch(
              addUserData({
                user,
                families: parentId ? [{ id: parentId, status: "pending" }] : [],
              })
            );
          } else {
            if (user.emailVerified && !currrentUserData.emailVerified) {
              dispatch(
                updateUserData({
                  userId: user!.uid,
                  updatedData: { emailVerified: true },
                })
              );
            }
            if (
              parentId &&
              parentId.length > 0 &&
              !currrentUserData.families?.some((p) => p.id === parentId)
            ) {
              if (currrentUserData.role === "parent") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error
                );
                Alert.alert(
                  "Action denied!",
                  "You currently have a parent account. Please create a new account with a different email address and select the supporter role and use that to accept this invite."
                );
                removeItem("inviteParentId");
                // need to create a new user with the parentId with parentId and role as supporter
                //TODO: Implement multiple accounts like Instagram or FB I guess
              } else {
                try {
                  const updatedUser = await dispatch(
                    updateUserData({
                      userId: user.uid,
                      updatedData: {
                        role: "supporter",
                        families: [
                          ...(currrentUserData.families || []),
                          { id: parentId, status: "pending" },
                        ],
                      },
                    })
                  );
                  if (updatedUser.type === "users/updateUserData/fulfilled") {
                    const result = await addFamilyConnection(
                      parentId,
                      user.uid,
                      currrentUserData.displayName ||
                        currrentUserData.firstName ||
                        currrentUserData.lastName ||
                        "A supporter"
                    );
                    if (!result || result.error) {
                      Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Error
                      );
                      await dispatch(
                        updateUserData({
                          userId: user.uid,
                          updatedData: {
                            role: "supporter",
                            families: currrentUserData.families || [],
                          },
                        })
                      );
                      Alert.alert(
                        "Something went wrong",
                        "While adding the family connection, we encountered an error. Please try tapping on the link again."
                      );
                    } else {
                      Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success
                      );
                      Alert.alert(
                        "Family connection added",
                        "You have been added to the family. Please wait for the parent to approve your request."
                      );
                    }
                  } else {
                    Alert.alert(
                      "Something went wrong",
                      "While adding the family connection, we encountered an error. Please try tapping on the link again."
                    );
                  }
                } catch (error) {
                  console.error("Error validating parentId:", error);
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Error
                  );
                  Alert.alert(
                    "",
                    "An error occurred while validating the invite link. Please contact the person who invited you and ask them to resend their unique invite link to you."
                  );
                  removeItem("inviteParentId");
                }
              }
            } else {
              // this is the case where there is no parentId or parentId is an empty string or the parentId is already in the inviteParentIds array
              removeItem("inviteParentId");
            }
          }
          setUser(user);
          setLoading(false);
        })
        .catch((e) => {
          // console.error(e);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert(
            "",
            "There is no user record corresponding to this identifier. The user may have been deleted."
          );
          setLoading(false);
        });
    } else {
      setUser(null);
      setLoading(false);
    }
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    const firstVisit = getItem("isAppFirstLaunched");
    if (firstVisit == null) {
      dispatch(setIsFirstVisit(true));
      setItem("isAppFirstLaunched", "false");
    } else {
      dispatch(setIsFirstVisit(false));
    }

    // removeItem('isAppFirstLaunched');
  }, []);

  if (initializing) return null;
  if (loading)
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: NAV_THEME[colorScheme].background,
        }}
      >
        <ActivityIndicator size="large" color={NAV_THEME[colorScheme].text} />
      </SafeAreaView>
    );
  if (isFirstVisit) {
    return <Redirect href="/welcome" />;
  }
  if (!user) {
    return <Redirect href="/auth" />;
  }

  if (user && !firestoreUser?.role) {
    return <Redirect href="/select-role" />;
  }
  if (firestoreUser?.role === "parent") {
    return <Redirect href="/parent" />;
  }
  if (firestoreUser?.role === "supporter") {
    return <Redirect href="/supporter" />;
  }

  // fallback which shold never get called
  return null;
}
