import {
  FirebaseFirestoreTypes,
  Timestamp,
} from "@react-native-firebase/firestore";

export interface UserData {
  userId: string;
  firstName?: string;
  lastName?: string;
  displayName: string | null;
  email: string | undefined;
  emailVerified: boolean;
  photoUrl?: string;
  createdAt: FirebaseFirestoreTypes.FieldValue;
  role?: "parent" | "supporter" | null;
  children?: ChildProfile[] | []; // Only relevant for parents

  /** Parents this supporter is connected to */
  /** OR */
  /** Supporters who have requested to help */
  families?: FamilyConnection[];
  pushToken?: string;
}

/** Relationship between supporters & parents */
export interface FamilyConnection {
  id: string; // Either parentId (for supporters) or supporterId (for parents)
  status: "pending" | "approved" | "rejected";
}

/** Supporter-specific fields */
// not used at this point
export interface Supporter extends UserData {
  tasksCompleted: number;
  joinedAt: FirebaseFirestoreTypes.FieldValue;
  mealsProvided: number;
  lastActive: string;
  frequentContribution: "Meals" | "Errands" | "Babysitting" | "Groceries";
  weeklyProgress: { completed: number; total: number };
  monthlyProgress: { completed: number; total: number };
}

export interface HelpRequest {
  id: string; // Unique identifier (Firestore document ID)
  title: string; // Short title for the request
  type: TaskType; // Predefined categories
  notes?: string; // Additional details about the request (optional)
  status: "open" | "claimed" | "completed" | "canceled"; // Status of the request
  urgency: "low" | "medium" | "high"; // Priority level (defaults to "medium")
  createdAt: FirebaseFirestoreTypes.Timestamp; // Timestamp when the request was created (ISO string)
  updatedAt?: FirebaseFirestoreTypes.Timestamp; // Timestamp when the request was last updated (ISO string, optional)
  claimedBy?: string | null; // ID of the supporter who claimed the request (optional)
  parentId: string; // ID of the parent who made the request (ensures proper ownership)
  startDateTime: FirebaseFirestoreTypes.Timestamp; // Start date and Time in ISOString when the request is needed for
  endDateTime: FirebaseFirestoreTypes.Timestamp | null; // Optional end date and time (ISOString) in the form but will be added to fb (1 hour after start time)
  notificationIds?: string[]; // ID of the notifications for the request (optional)
  updateHistory?: {
    timestamp: FirebaseFirestoreTypes.Timestamp;
    type:
      | "created"
      | "claimed"
      | "abandoned"
      | "completed"
      | "canceled"
      | "edited";
    userId: string;
    changes?: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
  }[]; // History of updates to the request
}

export interface ChildProfile {
  id: string;
  name: string;
  birthdate: string;
  photoUrl?: string;
  height?: string;
  weight?: string;
  milestones?: { name: string; icon: React.ReactNode }[];
}

export interface Message {
  id: string; // Unique message ID
  requestId: string; // The request this message belongs to
  parentId: string; // The parent who created the request
  text: string; // Message content
  senderId: string; // User who sent the message
  claimerId: string; // User who claimed the request
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
  senderName: string;
  read: boolean;
}

export type TaskType =
  | "babysitting"
  | "meal"
  | "groceries"
  | "childcare"
  | "other";

export type RequestNotificationType =
  | "requestCreated"
  | "requestClaimed"
  | "requestCompleted"
  | "requestAbandoned"
  | "requestCanceled"
  | "requestMessageReceived"
  | "supporterRequest"
  | "supporterRequestApproved";


export interface RequestNotificationData {
  requestData: HelpRequest;
  type: RequestNotificationType;
}