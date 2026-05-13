import { configureStore } from "@reduxjs/toolkit";
import { middleware } from "./middleware";
import { rootReducer } from "./root-reducer";

export const store = configureStore({
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(middleware),
  reducer: rootReducer
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
