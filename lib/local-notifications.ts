import * as Notifications from "expo-notifications";
import { HelpRequest } from "@/interfaces";
export async function scheduleTaskReminderNotification(
  task: HelpRequest,
  date: Date
) {
  const date24Hours = new Date(date.getTime() - 1000 * 60 * 60 * 24);
  const date1Hour = new Date(date.getTime() - 1000 * 60 * 60 * 1);
  let notification24HoursId = null;
  let notification1HourId = null;
  if (date24Hours > new Date()) {
    notification24HoursId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: `Your task "${task.title}" is in 24 hours!`,
        data: {
          requestData: { ...task, id: task.id },
          type: "requestCreated",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: date24Hours,
      },
    });
  }

  if (date1Hour > new Date()) {
    notification1HourId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: `Your task "${task.title}" is in 1 hour!`,
        data: {
          requestData: { ...task, id: task.id },
          type: "requestCreated",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: date1Hour,
      },
    });
  }
  if (notification24HoursId && notification1HourId) {
    const notificationIds = [notification24HoursId, notification1HourId];
    return { notificationIds };
  } else if (notification24HoursId) {
    return { notificationIds: [notification24HoursId] };
  } else if (notification1HourId) {
    return { notificationIds: [notification1HourId] };
  } else {
    return { notificationIds: [] };
  }
}

export async function cancelTaskReminderNotification(
  notificationIds: string[]
) {
  for (const notificationId of notificationIds) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
}
