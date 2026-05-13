import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CurrentUser } from "@/types/identity";

interface AuthState {
  readonly user: CurrentUser | null;
}

const initialState: AuthState = {
  user: null
};

export const authSlice = createSlice({
  initialState,
  name: "auth",
  reducers: {
    clearCurrentUser: (state) => {
      state.user = null;
    },
    setCurrentUser: (state, action: PayloadAction<CurrentUser>) => {
      state.user = action.payload;
    }
  }
});

export const { clearCurrentUser, setCurrentUser } = authSlice.actions;
