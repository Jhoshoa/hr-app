"use client";

import { Provider } from "react-redux";
import { ToastProvider } from "@/components/ui/toast";
import { store } from "@/store";

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Provider store={store}>
      <ToastProvider>{children}</ToastProvider>
    </Provider>
  );
}
