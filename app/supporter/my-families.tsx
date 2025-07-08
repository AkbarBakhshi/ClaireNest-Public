import { ScrollView, View } from "react-native";
import { FamiliesSection } from "@/components/supporter/families-section";
import { PendingInvitations } from "@/components/supporter/pending-invitations";
import {
  fetchApprovedFamilies,
  selectUserData,
  selectApprovedFamilies,
  selectApprovedFamiliesLoading,
} from "@/features/user/userSlice";
import {
  fetchRequests,
  selectFetchedDates,
  selectRequests,
} from "@/features/request/requestSlice";
import { HelpRequest } from "@/interfaces";
import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import * as Haptics from "expo-haptics";
import { isDateInRange } from "@/lib/utils";

export default function MyFamilies() {
  // User data
  const firestoreUser = useAppSelector(selectUserData);
  const approvedFamilies = useAppSelector(selectApprovedFamilies);
  const approvedFamiliesLoading = useAppSelector(selectApprovedFamiliesLoading);
  // Requests data
  const requests = useAppSelector(selectRequests);
  const fetchedDates = useAppSelector(selectFetchedDates);
  const dispatch = useAppDispatch();
  // Get pending invitations
  const pendingInvitations =
    firestoreUser?.families?.filter((family) => family.status === "pending") ||
    [];

  // Check if a task is overdue (start time is in the past)
  const isOverdue = useCallback((task: HelpRequest) => {
    const now = new Date();
    const startDate = task.startDateTime.toDate();
    return startDate < now && task.status === "open";
  }, []);

  // Fetch approved families
  useEffect(() => {
    const fetchInviteParentsList = async () => {
      const approvedFamiliesData = firestoreUser?.families?.filter(
        (family) => family.status === "approved"
      );
      if (approvedFamiliesData && approvedFamiliesData.length > 0) {
        if (
          !approvedFamilies ||
          approvedFamiliesData.length !== approvedFamilies.length
        ) {
          await dispatch(fetchApprovedFamilies(approvedFamiliesData));
        }
      }
    };

    fetchInviteParentsList();
  }, [firestoreUser]);

  // Fetch requests
  const getRequests = async (date: string) => {
    try {
      if (
        fetchedDates &&
        isDateInRange(date.split("T")[0], fetchedDates.start, fetchedDates.end)
      ) {
        console.log("Requests already fetched for this date range");
        return;
      }
      // Use a 30-day window for upcoming tasks
      const offset = 30;
      const dateObj = new Date(date);
      const fromDate = new Date(dateObj);
      fromDate.setDate(dateObj.getDate());
      const toDate = new Date(dateObj);
      toDate.setDate(dateObj.getDate() + offset - 1);

      if (firestoreUser?.families && firestoreUser.families.length > 0) {
        for (const family of firestoreUser.families.filter(
          (f) => f.status === "approved"
        )) {
          dispatch(
            fetchRequests({
              parentId: family.id,
              from: fromDate.toISOString(),
              to: toDate.toISOString(),
            })
          );
        }
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  useEffect(() => {
    if (firestoreUser?.families && firestoreUser.families.length > 0) {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      getRequests(fiveDaysAgo.toISOString());
    }
  }, [firestoreUser]);

  return (
    <ScrollView className="flex-1 px-4">
      {/* Pending invitations alert (if any) */}
      {pendingInvitations.length > 0 && (
        <View className="mt-6">
          <PendingInvitations pendingInvitations={pendingInvitations} />
        </View>
      )}

      {/* Families Section */}
      <FamiliesSection
        loading={approvedFamiliesLoading}
        approvedFamilies={approvedFamilies}
        familyConnections={firestoreUser?.families}
        userId={firestoreUser?.userId}
        requests={requests}
        isOverdueFunc={isOverdue}
      />
    </ScrollView>
  );
}
