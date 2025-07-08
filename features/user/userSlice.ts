import { UserData, FamilyConnection } from "@/interfaces";
import { RootState } from "@/store";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addUserToFirebase,
  getApprovedFamiliesFromFirebase,
  getSupportersFromFirebase,
  getUserFromFirebase,
  updateFirebaseUser,
  deleteUserFromFirebase,
} from "./userAPI";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import * as Haptics from "expo-haptics";

interface UserState {
  userData: UserData | null;
  isLoading: boolean;
  error: string;
  isFirstVisit: boolean;
  supporters: UserData[] | null;
  supportersLoading: boolean;
  supportersError: string | null;
  approvedFamilies: UserData[] | null;
  approvedFamiliesLoading: boolean;
  approvedFamiliesError: string | null;
}

const initialState: UserState = {
  userData: null,
  isLoading: false,
  error: "",
  isFirstVisit: false,
  supporters: null,
  supportersLoading: false,
  supportersError: null,
  approvedFamilies: null,
  approvedFamiliesLoading: false,
  approvedFamiliesError: null,
};

// Fetch user data from Firestore
export const getUserData = createAsyncThunk(
  "users/getUserData",
  async (userId: string, { rejectWithValue }) => {
    try {
      const userData = await getUserFromFirebase(userId);
      return userData;
    } catch (error) {
      return rejectWithValue((error as Error).message || "An error occurred");
    }
  }
);

// Add user data to Firestore
export const addUserData = createAsyncThunk(
  "users/addUserData",
  async (
    {
      user,
      appleFamilyName,
      appleFirstName,
      families,
    }: {
      user: FirebaseAuthTypes.User;
      appleFamilyName?: string | null;
      appleFirstName?: string | null;
      families?: FamilyConnection[] | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const newUserData = await addUserToFirebase(
        user,
        appleFamilyName,
        appleFirstName,
        families
      );
      return newUserData;
    } catch (error) {
      return rejectWithValue((error as Error).message || "Failed to add user");
    }
  }
);

// Update user data in Firestore
export const updateUserData = createAsyncThunk(
  "users/updateUserData",
  async (
    { userId, updatedData }: { userId: string; updatedData: Partial<UserData> },
    { rejectWithValue }
  ) => {
    try {
      const updatedUser = await updateFirebaseUser(userId, updatedData);
      return updatedUser;
    } catch (error) {
      return rejectWithValue(
        (error as Error).message || "Failed to update user"
      );
    }
  }
);

export const fetchSupporters = createAsyncThunk(
  "users/fetchSupporters",
  async (families: FamilyConnection[], { rejectWithValue }) => {
    try {
      const supporters = await getSupportersFromFirebase(families);
      return supporters;
    } catch (error) {
      return rejectWithValue(
        (error as Error).message || "Failed to fetch supporters"
      );
    }
  }
);

export const fetchApprovedFamilies = createAsyncThunk(
  "users/fetchApprovedFamilies",
  async (families: FamilyConnection[], { rejectWithValue }) => {
    try {
      const familiesData = await getApprovedFamiliesFromFirebase(families);
      return familiesData;
    } catch (error) {
      return rejectWithValue(
        (error as Error).message || "Failed to fetch families"
      );
    }
  }
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const result = await deleteUserFromFirebase(userId);
      if (result.error) {
        return rejectWithValue(result.error);
      }
      return result.success;
    } catch (error) {
      return rejectWithValue(
        (error as Error).message || "Failed to delete user"
      );
    }
  }
);

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    resetUser: (state) => {
      state.userData = null;
    },
    setIsFirstVisit: (state, action) => {
      state.isFirstVisit = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Handle fetch user data
    builder
      .addCase(getUserData.pending, (state) => {
        state.isLoading = true;
        state.error = ""; // Clear any previous error
      })
      .addCase(getUserData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userData = action.payload;
      })
      .addCase(getUserData.rejected, (state, action) => {
        state.isLoading = false;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        state.error = action.payload as string; // Safely cast the error
      });
    // Handle add user data
    builder
      .addCase(addUserData.pending, (state) => {
        state.isLoading = true;
        state.error = ""; // Clear any previous error
      })
      .addCase(addUserData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userData = action.payload;
      })
      .addCase(addUserData.rejected, (state, action) => {
        state.isLoading = false;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        state.error = action.payload as string;
      });

    // Handle update user data
    builder
      .addCase(updateUserData.pending, (state) => {
        state.isLoading = true;
        state.error = "";
      })
      .addCase(updateUserData.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.userData) {
          state.userData = { ...state.userData, ...action.payload };
        }
      })
      .addCase(updateUserData.rejected, (state, action) => {
        state.isLoading = false;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        state.error = action.payload as string;
      });
    builder
      .addCase(fetchSupporters.pending, (state) => {
        state.supportersLoading = true;
        state.supportersError = "";
      })
      .addCase(fetchSupporters.fulfilled, (state, action) => {
        state.supportersLoading = false;
        state.supporters = action.payload;
      })
      .addCase(fetchSupporters.rejected, (state, action) => {
        state.supportersLoading = false;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        state.supportersError = action.payload as string;
      });
    builder
      .addCase(fetchApprovedFamilies.pending, (state) => {
        state.approvedFamiliesLoading = true;
        state.approvedFamiliesError = "";
      })
      .addCase(fetchApprovedFamilies.fulfilled, (state, action) => {
        state.approvedFamiliesLoading = false;
        state.approvedFamilies = action.payload as UserData[];
      })
      .addCase(fetchApprovedFamilies.rejected, (state, action) => {
        state.approvedFamiliesLoading = false;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        state.approvedFamiliesError = action.payload as string;
      });
    builder
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = "";
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.isLoading = false;
        state.userData = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        state.error = action.payload as string;
      }); 
  },
});

// Action creators
export const { resetUser, setIsFirstVisit } = userSlice.actions;

// Selectors
export const selectUserData = (state: RootState) => state.user.userData;
export const selectUserLoading = (state: RootState) => state.user.isLoading;
export const selectUserError = (state: RootState) => state.user.error;
export const selectUserFirstVisit = (state: RootState) =>
  state.user.isFirstVisit;
export const selectSupporters = (state: RootState) => state.user.supporters;
export const selectSupportersLoading = (state: RootState) =>
  state.user.supportersLoading;
export const selectSupportersError = (state: RootState) =>
  state.user.supportersError;
export const selectApprovedFamilies = (state: RootState) =>
  state.user.approvedFamilies;
export const selectApprovedFamiliesLoading = (state: RootState) =>
  state.user.approvedFamiliesLoading;
export const selectApprovedFamiliesError = (state: RootState) =>
  state.user.approvedFamiliesError;

export default userSlice.reducer;
