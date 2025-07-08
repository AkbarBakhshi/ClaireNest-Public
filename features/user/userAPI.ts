import { UserData, FamilyConnection } from "@/interfaces";
import { removeItem } from "@/lib/storage";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  setDoc,
  doc,
  getFirestore,
  serverTimestamp,
  getDoc,
  updateDoc,
  deleteDoc,
} from "@react-native-firebase/firestore";

import { getFunctions, httpsCallable } from "@react-native-firebase/functions";
// import * as Sentry from '@sentry/react-native';

// type FirebaseFunctionsError = {
//   message?: string;
//   code?: string;
//   details?: unknown;
// };

// function isFirebaseFunctionsError(error: any): error is FirebaseFunctionsError {
//   return typeof error === 'object' && error !== null && 'message' in error;
// }

export const addUserToFirebase = async (
  user: FirebaseAuthTypes.User,
  appleFamilyName?: string | null,
  appleFirstName?: string | null,
  families?: FamilyConnection[] | null
) => {
  try {
    const db = getFirestore();
    const displayName =
      appleFamilyName && appleFirstName
        ? `${appleFirstName} ${appleFamilyName}`
        : appleFamilyName
        ? `${appleFamilyName}`
        : appleFirstName
        ? `${appleFirstName}`
        : user.displayName;
    const userData: UserData = {
      userId: user.uid,
      email: user.email?.trim(),
      emailVerified: user.emailVerified,
      photoUrl: user.photoURL ?? "",
      firstName: appleFirstName
        ? appleFirstName
        : displayName
        ? displayName.split(" ")[0]
        : "",
      lastName: appleFamilyName
        ? appleFamilyName
        : displayName && displayName.split(" ").length > 1
        ? displayName.split(" ")[1]
        : "",
      displayName: displayName ?? "",
      createdAt: serverTimestamp(),
      role: families && families.length > 0 ? "supporter" : null,
      families: Array.isArray(families) ? families : [],
    };

    await setDoc(doc(db, "users", user.uid), userData);
    userData.createdAt = serverTimestamp();
    removeItem("inviteParentId");
    return userData;
  } catch (error) {
    console.error("Error adding document: ", error);
    return null;
  }
};

export const getUserFromFirebase = async (id: string) => {
  try {
    const db = getFirestore();
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists) {
      return docSnap.data() as UserData;
    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching document: ", error);
    return null;
  }
};

export const updateFirebaseUser = async (
  userId: string,
  updatedData: Partial<UserData>
) => {
  try {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, updatedData);
    removeItem("inviteParentId");
    return updatedData;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const getSupportersFromFirebase = async (
  families: FamilyConnection[]
) => {
  try {
    const supporterIds = families.map((family) => family.id);
    const functions = getFunctions();
    const getSupporterData = httpsCallable(functions, "getSupporterData");
    let supporters: UserData[] = [];
    for (const supporterId of supporterIds) {
      const result = await getSupporterData({ supporterId });
      supporters.push(result.data as UserData);
    }
    return supporters;
  } catch (error) {
    console.error("Error fetching supporter data:", error);
    throw error;
  }
};

export const addFamilyConnection = async (
  parentId: string,
  supporterId: string,
  supporterName: string
) => {
  // Validate inputs before making the call
  if (!supporterId.trim()) {
    return { error: "Please enter a supporter ID" };
  }

  if (!parentId.trim()) {
    return { error: "Please enter a family ID" };
  }
  try {
    const functions = getFunctions();
    // Call the Firebase Cloud Function
    const addSupporterToParent = httpsCallable(
      functions,
      "addSupporterToParent"
    );
    const result = await addSupporterToParent({
      supporterId,
      parentId,
      supporterName
    });
    return { success: result.data };
    // Handle successful response
  } catch (error) {
    // Handle generic errors
    // console.error(error);
    // let extra: Record<string, any> = {
    //   functionName: 'addSupporterToParent',
    //   parentId,
    //   supporterId,
    // };
  
    // if (isFirebaseFunctionsError(error)) {
    //   extra.message = error.message;
    //   extra.code = error.code;
    //   extra.details = error.details;
    // }
  
    // Sentry.captureException(error, { extra });
    return {
      error:
        "An unexpected error occurred while adding the supporter. Please try again.",
    };
  }
};

export const updateSupporter = async (
  supporterId: string,
  parentId: string,
  status: "pending" | "approved" | "rejected",
  parentName: string
) => {
  try {
    const functions = getFunctions();
    // Call the Firebase Cloud Function
    const updateSupporterStatus = httpsCallable(
      functions,
      "updateSupporterStatus"
    );
    const result = await updateSupporterStatus({
      supporterId,
      parentId,
      status,
      parentName
    });
    return { success: result.data };
    // Handle successful response
  } catch (error) {
    // Handle generic errors
    console.error(error);
    return {
      error:
        "An unexpected error occurred while adding the supporter. Please try again.",
    };
  }
};

export const getApprovedFamiliesFromFirebase = async (families: FamilyConnection[]) => {
  try {
    const db = getFirestore();
    const familiesData: UserData[] = [];
    for (const family of families) {
      const docRef = doc(db, "users", family.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists) {
        familiesData.push(docSnap.data() as UserData);
      } else {
        console.log("No such document!");
      }
    }
    return familiesData;
  } catch (error) {
    console.error("Error fetching document: ", error);
    throw error;
  }
};

export const updateEmailFromFirebase = async ({
  userId,
  newEmail,
}: {
  userId: string;
  newEmail: string;
}) => {
  try {
    const functions = getFunctions();
    // Call the Firebase Cloud Function
    const updateEmail = httpsCallable(
      functions,
      "updateUserEmail"
    );
    const result = await updateEmail({
      userId,
      newEmail,
    });
    return { success: result.data };
  } catch (error) {
    console.error("Error updating email:", error);
    throw error;
  }
};

export const deleteUserFromFirebase = async (userId: string) => {
  try {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      error: "An unexpected error occurred while deleting your account. Please try again.",
    };
  }
};
