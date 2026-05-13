import { createSlice } from "@reduxjs/toolkit";

interface LayoutState {
  readonly sidebarCollapsed: boolean;
}

const initialState: LayoutState = {
  sidebarCollapsed: false
};

export const layoutSlice = createSlice({
  initialState,
  name: "layout",
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    }
  }
});

export const { toggleSidebar } = layoutSlice.actions;
