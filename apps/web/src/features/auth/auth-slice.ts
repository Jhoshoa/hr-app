import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CurrentUser, PlatformRoleKey } from "@/types/identity";

interface AuthState {
  readonly user: CurrentUser | null;
  readonly platformRoles: PlatformRoleKey[];
}

const initialState: AuthState = {
  platformRoles: [],
  user: null
};

export const authSlice = createSlice({
  initialState,
  name: "auth",
  reducers: {
    clearCurrentUser: (state) => {
      state.user = null;
      state.platformRoles = [];
    },
    setPlatformRoles: (state, action: PayloadAction<PlatformRoleKey[]>) => {
      state.platformRoles = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<CurrentUser>) => {
      state.user = action.payload;
    }
  }
});

export const { clearCurrentUser, setCurrentUser, setPlatformRoles } = authSlice.actions;
