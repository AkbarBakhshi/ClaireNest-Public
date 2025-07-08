import { selectUserData } from "@/features/user/userSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppReduxHooks";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  selectFetchedDates,
  selectRequests,
} from "@/features/request/requestSlice";
import * as Haptics from "expo-haptics";
import { fetchRequests } from "@/features/request/requestSlice";
import { isDateInRange } from "@/lib/utils";

import DashboardContainer from "@/components/parent/dashboard-container";

export default function Home() {
  const dispatch = useAppDispatch();
  const fetchedDates = useAppSelector(selectFetchedDates);
  const requests = useAppSelector(selectRequests);
  const firestoreUser = useAppSelector(selectUserData);

  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    open: 0,
    claimed: 0,
    expired: 0,
  });
  const [supporterStats, setSupporterStats] = useState({
    total: 0,
    pending: 0,
  });

  const getRequests = async (date: string) => {
    try {
      if (
        fetchedDates &&
        isDateInRange(date.split("T")[0], fetchedDates.start, fetchedDates.end)
      ) {
        console.log("Requests already fetched for this date range");
        return;
      }

      // Use a 45-day window: 15 days back and 30 days forward
      const lookbackDays = 15; // days to look back for expired requests
      const forwardDays = 30; // days to look forward for upcoming requests

      const dateObj = new Date(date);
      const fromDate = new Date(dateObj);
      fromDate.setDate(dateObj.getDate() - lookbackDays); // Look back 15 days
      const toDate = new Date(dateObj);
      toDate.setDate(dateObj.getDate() + forwardDays - 1); // Look forward 30 days

      await dispatch(
        fetchRequests({
          parentId: firestoreUser!.userId,
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        })
      );
    } catch (error) {
      console.error("Error fetching requests:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Fetch requests when the component mounts
  useEffect(() => {
    if (firestoreUser?.userId) {
      getRequests(new Date().toISOString());
    }
  }, [firestoreUser?.userId]);

  // Update stats when the requests change
  useEffect(() => {
    if (requests.length > 0) {
      setTaskStats({
        total: requests.length,
        completed: requests.filter((request) => request.status === "completed")
          .length,
        open: requests.filter(
          (request) =>
            request.status === "open" &&
            request.startDateTime.toDate() > new Date()
        ).length,
        claimed: requests.filter((request) => request.status === "claimed")
          .length,
        expired: requests.filter(
          (request) =>
            request.status === "open" &&
            request.startDateTime.toDate() < new Date()
        ).length,
      });
    }
  }, [requests]);

  useEffect(() => {
    setSupporterStats({
      total: firestoreUser?.families?.length || 0,
      pending:
        firestoreUser?.families?.filter((family) => family.status === "pending")
          .length || 0,
    });
  }, []);

  if (!firestoreUser) {
    return <Redirect href="/" />;
  }

  return (
    <DashboardContainer
      firestoreUser={firestoreUser}
      requests={requests}
      taskStats={taskStats}
      supporterStats={supporterStats}
    />
  );
}
