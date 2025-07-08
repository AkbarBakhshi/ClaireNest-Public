import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { HelpRequest } from "@/interfaces";
import { EventItem } from "@howljs/calendar-kit";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCalendarDate = (date: Date) => format(date, "yyyy-MM-dd");
export const parseFirestoreDate = (timestamp: any) =>
  parseISO(timestamp.toDate().toISOString());

export function mapHelpRequestsToEvents(
  helpRequests: HelpRequest[]
): EventItem[] {
  return helpRequests.map((request) => {
    const startDate = format(request.startDateTime.toDate(), "yyyy-MM-dd"); // Extract YYYY-MM-DD from ISO string
    const endDate = format(
      request.endDateTime?.toDate() || new Date(),
      "yyyy-MM-dd"
    );

    return {
      id: request.id,
      start: { dateTime: request.startDateTime.toDate().toISOString() },
      end: { dateTime: request.endDateTime?.toDate().toISOString() || "" },
      title: request.title,
      type: request.type,
      notes: request.notes,
      status: request.status,
      urgency: request.urgency,
      claimedBy: request.claimedBy,
    };
  });
}

export function isDateInRange(
  dateToCheck: string,
  startDate: string,
  endDate: string
): boolean {
  const check = new Date(dateToCheck).getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return check >= start && check <= end;
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      throw new Error(
        "Permission not granted to get push token for push notification!"
      );
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      throw new Error("Project ID not found");
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      return pushTokenString;
    } catch (e: unknown) {
      throw new Error(`${e}`);
    }
  } else {
    throw new Error("Must use physical device for push notifications");
  }
}
