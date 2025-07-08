import { configureStore } from "@reduxjs/toolkit";
import userReducer from "@/features/user/userSlice";
import requestsReducer from "@/features/request/requestSlice";
import messagesReducer from "@/features/messages/messageSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    request: requestsReducer,
    messages: messagesReducer,
  },
  //There is an error when retrieving firebase data regarding the data being non-serializable in the state for redux.

  // https://stackoverflow.com/questions/61704805/getting-an-error-a-non-serializable-value-was-detected-in-the-state-when-using
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
