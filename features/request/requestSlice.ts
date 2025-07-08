import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchRequestsFromFirebase,
  addRequestToFirebase,
  updateRequestInFirebase,
  deleteRequestFromFirebase,
  fetchRequestByIdFromFirebase,
} from "@/features/request/requestAPI";
import { RootState } from "@/store";
import { HelpRequest } from "@/interfaces";
import { isDateInRange } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import * as Haptics from "expo-haptics";
import { Timestamp } from "@react-native-firebase/firestore";

interface RequestsState {
  requests: HelpRequest[];
  fetchedDates: { start: string; end: string } | null;
  selectedRequest: HelpRequest | null;
  loading: boolean;
  error: string | null;
}

const initialState: RequestsState = {
  requests: [],
  fetchedDates: null,
  selectedRequest: null as HelpRequest | null,
  loading: false,
  error: null,
};

// Fetch all requests

export const fetchRequests = createAsyncThunk(
  "requests/fetchRequests",
  async (
    { from, to, parentId }: { from: string; to: string; parentId: string },
    { rejectWithValue }
  ) => {
    try {
      const fromDate = format(parseISO(from), "yyyy-MM-dd"); // Convert to "yyyy-MM-dd"
      const toDate = format(parseISO(to), "yyyy-MM-dd");
      const fetchedRequests = await fetchRequestsFromFirebase(
        parentId,
        fromDate,
        toDate
      );
      const fetchedDates = { start: fromDate, end: toDate };
      return { fetchedRequests, fetchedDates };
    } catch (error: any) {
      return rejectWithValue(
        (error as Error).message || "Failde to fetch requests"
      );
    }
  }
);

// Async Thunk to Fetch a Single Request
export const fetchRequestByID = createAsyncThunk(
  "requests/fetchRequestByID",
  async (id: string, { rejectWithValue }) => {
    try {
      const request = await fetchRequestByIdFromFirebase(id);
      if (!request) throw new Error("Request not found");
      return request;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Add a new request
export const addRequest = createAsyncThunk(
  "requests/addRequest",
  async (
    requestData: Omit<HelpRequest, "id" | "createdAt" | "updatedAt">,
    { rejectWithValue }
  ) => {
    try {
      return await addRequestToFirebase(requestData);
    } catch (error: any) {
      return rejectWithValue(
        (error as Error).message || "Failed to add request"
      );
    }
  }
);

// Update request (any field)
export const updateRequest = createAsyncThunk(
  "requests/updateRequest",
  async (
    {
      id,
      updatedFields,
      currentUserId,
      updateType,
    }: {
      id: string;
      updatedFields: Partial<HelpRequest>;
      currentUserId: string;
      updateType:
        | "created"
        | "claimed"
        | "abandoned"
        | "completed"
        | "canceled"
        | "edited";
    },
    { rejectWithValue }
  ) => {
    try {
      const updatedRequest = await updateRequestInFirebase(
        id,
        updatedFields,
        currentUserId,
        updateType
      );
      return updatedRequest; // Return the updated request object
    } catch (error: any) {
      return rejectWithValue((error as Error).message || "Failed to update");
    }
  }
);

// Delete request
export const deleteRequest = createAsyncThunk(
  "requests/deleteRequest",
  async (id: string, { rejectWithValue }) => {
    try {
      return await deleteRequestFromFirebase(id);
    } catch (error: any) {
      return rejectWithValue(
        (error as Error).message || "Failed to delete request"
      );
    }
  }
);

const requestSlice = createSlice({
  name: "request",
  initialState,
  reducers: {
    resetRequests: (state) => {
      state.requests = [];
      state.fetchedDates = null;
      state.selectedRequest = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequests.pending, (state) => {
        state.loading = true;
        state.error = ""; // Clear any previous error
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.fetchedRequests;
        if (!state.fetchedDates) {
          state.fetchedDates = action.payload.fetchedDates;
        } else {
          state.fetchedDates = {
            start:
              action.payload.fetchedDates.start < state.fetchedDates.start
                ? action.payload.fetchedDates.start
                : state.fetchedDates.start,
            end:
              action.payload.fetchedDates.end > state.fetchedDates.end
                ? action.payload.fetchedDates.end
                : state.fetchedDates.end,
          };
        }
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.loading = false;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        state.error = action.payload as string;
      })

      // Fetch Single Request
      .addCase(fetchRequestByID.pending, (state) => {
        state.loading = true;
        state.error = ""; // Clear any previous error
      })
      .addCase(fetchRequestByID.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRequest = action.payload;
      })
      .addCase(fetchRequestByID.rejected, (state, action) => {
        state.loading = false;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        state.error = action.payload as string;
      })

      // Add Request
      .addCase(addRequest.pending, (state) => {
        state.loading = true;
        state.error = ""; // Clear any previous error
      })
      .addCase(addRequest.fulfilled, (state, action) => {
        state.loading = false;
        if (
          state.fetchedDates &&
          isDateInRange(
            action.payload.startDateTime.toDate().toISOString(),
            state.fetchedDates.start,
            state.fetchedDates.end
          )
        ) {
          const newRequest = action.payload as unknown as HelpRequest;
          newRequest.createdAt = Timestamp.now();
          newRequest.updatedAt = Timestamp.now();
          state.requests.push(newRequest);
          // Sort requests by startDateTime after adding new request
          state.requests.sort(
            (a, b) =>
              a.startDateTime.toDate().getTime() -
              b.startDateTime.toDate().getTime()
          );
        }
      })
      .addCase(addRequest.rejected, (state, action) => {
        state.loading = false;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        state.error = action.payload as string;
      })

      // Update Request (any field)
      .addCase(updateRequest.pending, (state) => {
        state.loading = true;
        state.error = ""; // Clear any previous error
      })
      .addCase(updateRequest.fulfilled, (state, action) => {
        state.loading = false;
        const requestIndex = state.requests.findIndex(
          (r) => r.id === action.payload.id
        );
        if (requestIndex !== -1) {
          // Preserve the existing updateHistory if it exists
          const existingUpdateHistory =
            state.requests[requestIndex].updateHistory || [];
          state.requests[requestIndex] = {
            ...state.requests[requestIndex],
            ...action.payload,
            updateHistory:
              action.payload.updateHistory || existingUpdateHistory,
          };
        }
      })
      .addCase(updateRequest.rejected, (state, action) => {
        state.loading = false;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        state.error = action.payload as string;
      })

      // Delete Request
      .addCase(deleteRequest.pending, (state) => {
        state.loading = true;
        state.error = ""; // Clear any previous error
      })
      .addCase(deleteRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = state.requests.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteRequest.rejected, (state, action) => {
        state.loading = false;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { resetRequests } = requestSlice.actions;

// Selectors
export const selectRequests = (state: RootState) => state.request.requests;
export const selectFetchedDates = (state: RootState) =>
  state.request.fetchedDates;
export const selectSelectedRequest = (state: RootState) =>
  state.request.selectedRequest;
export const selectRequestLoading = (state: RootState) => state.request.loading;
export const selectRequestError = (state: RootState) => state.request.error;

export default requestSlice.reducer;
