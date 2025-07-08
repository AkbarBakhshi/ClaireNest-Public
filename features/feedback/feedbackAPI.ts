import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from "@react-native-firebase/firestore";

const db = getFirestore();

type Feedback = {
  userId: string;
  comment: string;
  rating: string;
};

export const addFeedbackToFirebase = async (feedback: Feedback) => {
  try {
    const feedbackData = {
      ...feedback,
      createdAt: Timestamp.now(),
    };
    const feedbackRef = collection(db, "feedback");
    await addDoc(feedbackRef, feedbackData);
    return { message: "Feedback added successfully" };
  } catch (error) {
    console.error("Error adding feedback to Firebase:", error);
    throw error;
  }
};
