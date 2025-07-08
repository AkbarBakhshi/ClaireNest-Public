import { HelpRequest } from "@/interfaces";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { getFunctions, httpsCallable } from "@react-native-firebase/functions";

// Firestore reference
const db = getFirestore();

// Fetch all requests
export const fetchRequestsFromFirebase = async (
  parentId: string,
  from: string, // Expected format: YYYY-MM-DD
  to: string // Expected format: YYYY-MM-DD
) => {
  try {
    const startDate = Timestamp.fromDate(new Date(`${from}T00:00:00Z`));
    const endDate = Timestamp.fromDate(new Date(`${to}T23:59:59Z`));

    // Query that includes requests in the specified date range
    const requestsQuery = query(
      collection(db, "requests"),
      where("parentId", "==", parentId),
      where("startDateTime", ">=", startDate),
      orderBy("startDateTime")
    );

    const querySnapshot = await getDocs(requestsQuery);

    // Filter client-side to include only requests that start after the from date or are still open
    const requestsWithIds = querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDateTime: data.startDateTime as Timestamp,
          endDateTime: data.endDateTime ? (data.endDateTime as Timestamp) : null,
          updateHistory: data.updateHistory || [],
        } as unknown as HelpRequest;
      })
      .filter((req) => {
        // Include if startDateTime is after our from date OR 
        // if it's before but the request is still open (i.e., potentially expired)
        const reqStartDate = req.startDateTime.toDate();
        const fromDateObj = startDate.toDate();
        
        return reqStartDate >= fromDateObj || 
               (reqStartDate < fromDateObj && req.status === "open");
      });

    return requestsWithIds as HelpRequest[];
  } catch (error) {
    console.error("Error fetching requests:", error);
    throw error;
  }
};

export const fetchRequestByIdFromFirebase = async (
  id: string
): Promise<HelpRequest | null> => {
  try {
    const docRef = doc(db, "requests", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists) {
      console.warn(`Request with ID ${id} not found`);
      return null;
    }
    const data = docSnap.data();

    return {
      id: docSnap.id,
      ...data,
      startDateTime: data!.startDateTime as Timestamp,
      endDateTime: data!.endDateTime ? (data!.endDateTime as Timestamp) : null,
    } as HelpRequest;
  } catch (error) {
    console.error("Error fetching request by ID:", error);
    throw error;
  }
};

// Add a new request
export const addRequestToFirebase = async (
  request: Omit<HelpRequest, "id" | "createdAt" | "updatedAt">
) => {
  try {
    const requestData = {
      ...request,
      status: request.status || "pending",
      urgency: request.urgency || "medium",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "requests"), {
      ...requestData,
      startDateTime: request.startDateTime,
      endDateTime: request.endDateTime ? request.endDateTime : null, // Convert only if provided
    });

    return { id: docRef.id, ...requestData };
  } catch (error) {
    console.error("Error adding request:", error);
    throw error;
  }
};

// Update request (generalized for any field)
export const updateRequestInFirebase = async (
  id: string,
  updatedFields: Partial<HelpRequest>,
  currentUserId: string,
  updateType: "created" | "claimed" | "abandoned" | "completed" | "canceled" | "edited"
) => {
  try {
    // Get the current request to compare changes
    const currentRequest = await fetchRequestByIdFromFirebase(id);
    if (!currentRequest) {
      throw new Error("Request not found");
    }

    // Extract startDateTime and endDateTime for special handling
    const { startDateTime, endDateTime, ...otherFields } = updatedFields;

    // Prepare the update object with proper typing
    const updateObject: Record<string, any> = {
      ...otherFields,
      updatedAt: serverTimestamp(),
    };

    // Only add startDateTime if it exists and ensure it's a Timestamp
    if (startDateTime) {
      if (startDateTime instanceof Timestamp) {
        updateObject.startDateTime = startDateTime;
      } else if (typeof startDateTime === 'object' && 'seconds' in startDateTime) {
        updateObject.startDateTime = new Timestamp(startDateTime.seconds, startDateTime.nanoseconds);
      }
    }

    // Only add endDateTime if it exists and ensure it's a Timestamp
    if (endDateTime) {
      if (endDateTime instanceof Timestamp) {
        updateObject.endDateTime = endDateTime;
      } else if (typeof endDateTime === 'object' && 'seconds' in endDateTime) {
        updateObject.endDateTime = new Timestamp(endDateTime.seconds, endDateTime.nanoseconds);
      }
    } else if (endDateTime === null) {
      updateObject.endDateTime = null;
    }

    // Determine update type and track changes
    
    const changes: { field: string; oldValue: any; newValue: any }[] = [];

    // Track field changes
    Object.entries(updatedFields).forEach(([field, newValue]) => {
      if (field !== "status" && field !== "updatedAt" && field !== "updateHistory") {
        const oldValue = currentRequest[field as keyof HelpRequest];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({ field, oldValue: oldValue ?? null, newValue: newValue });
        }
      }
    });
    if(updatedFields.status === "completed") {
      changes.push({ field: "status", oldValue: currentRequest.status, newValue: updatedFields.status });
    }

    // Add update history
    const updateHistory = currentRequest.updateHistory || [];
    const currentTimestamp = Timestamp.now();
    updateHistory.push({
      timestamp: currentTimestamp,
      type: updateType,
      userId: currentUserId, // Use claimedBy for supporter actions, parentId for parent actions
      changes: changes.length > 0 ? changes : []
    });

    updateObject.updateHistory = updateHistory;

    await updateDoc(doc(db, "requests", id), updateObject);
    return { id, ...updatedFields, updateHistory };
  } catch (error) {
    console.error(`Error updating request ${id}:`, error);
    throw error;
  }
};

// Delete request
export const deleteRequestFromFirebase = async (id: string) => {
  try {
    await deleteDoc(doc(db, "requests", id));
    return id;
  } catch (error) {
    console.error(`Error deleting request ${id}:`, error);
    throw error;
  }
};

export const sendClaimedTaskPushNotification = async (task: HelpRequest, claimedByName: string) => {
  try {
    const functions = getFunctions();
    const sendPushNotification = httpsCallable(functions, "sendClaimedTaskPushNotification");
    const result = await sendPushNotification({
      task,
      claimedByName,
    });
    return { success: result.data };
  } catch (error) {
    console.error(`Error sending claimed task push notification:`, error);
    return { error: "An unexpected error occurred while sending the push notification." };
  }
}
