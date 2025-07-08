import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { fetchMessagesFromFirebase, addMessageToFirebase } from './messageAPI';
import { Message } from '@/interfaces';
import { Timestamp } from 'firebase/firestore'; 
// Initial state
interface MessagesState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  checkedRequests: string[]; // Track which requests have been checked for messages
}

const initialState: MessagesState = {
  messages: [],
  loading: false,
  error: null,
  checkedRequests: [],
};

// Async thunks
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ requestId, parentId, claimerId }: { requestId: string, parentId: string, claimerId: string }, { rejectWithValue }) => {
    try {
      const messages = await fetchMessagesFromFirebase(requestId, parentId, claimerId);
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return rejectWithValue('Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'read'>, { rejectWithValue }) => {
    try {
     return await addMessageToFirebase(messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      return rejectWithValue('Failed to send message');
    }
  }
);

// Slice
const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.messages = [];
      state.checkedRequests = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        // Merge new messages with existing ones, avoiding duplicates
        const newMessages = action.payload;
        const existingMessages = state.messages;
        
        // Create a map of existing messages by ID for quick lookup
        const existingMessagesMap = new Map(existingMessages.map(msg => [msg.id, msg]));
        
        // Add or update messages
        newMessages.forEach(newMsg => {
          existingMessagesMap.set(newMsg.id, newMsg);
        });
        
        // Convert back to array
        state.messages = Array.from(existingMessagesMap.values());

        // Add the request to checked requests, regardless of whether messages were found
        const requestId = action.meta.arg.requestId;
        if (!state.checkedRequests.includes(requestId)) {
          state.checkedRequests.push(requestId);
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        // Replace Firebase Timestamp with JavaScript Date
        if (action.payload) {
          action.payload.createdAt = Timestamp.now();
          action.payload.updatedAt = Timestamp.now();
        }
        state.messages.push(action.payload as Message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const { clearMessages } = messagesSlice.actions;

// Selectors
export const selectMessages = (state: RootState) => state.messages.messages;
export const selectMessagesLoading = (state: RootState) => state.messages.loading;
export const selectMessagesError = (state: RootState) => state.messages.error;

// Add a new memoized selector to get messages for a specific request
export const selectMessagesByRequestId = createSelector(
  [selectMessages, (state: RootState, requestId: string) => requestId],
  (messages, requestId) => messages.filter(msg => msg.requestId === requestId)
);

// Add a new selector to check if messages exist for a specific request
export const selectHasMessagesForRequest = createSelector(
  [selectMessages, (state: RootState, requestId: string) => requestId],
  (messages, requestId) => messages.some(msg => msg.requestId === requestId)
);

// Add a new selector to check if a request has been checked for messages
export const selectHasCheckedRequest = createSelector(
  [(state: RootState) => state.messages.checkedRequests, (state: RootState, requestId: string) => requestId],
  (checkedRequests, requestId) => checkedRequests.includes(requestId)
);

// Reducer
export default messagesSlice.reducer; 