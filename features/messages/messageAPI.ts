import { Message } from "@/interfaces";
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
  onSnapshot,
  limit,
} from "@react-native-firebase/firestore";

const db = getFirestore();

export const fetchMessagesFromFirebase = async (requestId: string, parentId: string, claimerId: string) => {
  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("requestId", "==", requestId),
    where("parentId", "==", parentId),
    where("claimerId", "==", claimerId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  const messages: Message[] = [];
  querySnapshot.forEach((doc) => {
    messages.push({
      id: doc.id,
      ...doc.data()
    } as Message);
  });
  return messages;
};

export const addMessageToFirebase = async (message: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'read'>) => {
  const messagesRef = collection(db, "messages");
  const messageData = {
    ...message,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    read: false,
  };
  const docRef = await addDoc(messagesRef, messageData);
  return { id: docRef.id, ...messageData };
};

export const updateMessageStatus = async (messageId: string, status: "sent" | "delivered" | "read") => {
  const messageRef = doc(db, "messages", messageId);
  await updateDoc(messageRef, { status });
};

export const deleteMessage = async (messageId: string) => {
  const messageRef = doc(db, "messages", messageId);
  await deleteDoc(messageRef);
};


