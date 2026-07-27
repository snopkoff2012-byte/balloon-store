"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  defaultStoreSettings,
  type StoreSettings,
} from "@/features/admin/data/types";

const StoreSettingsContext = createContext<StoreSettings>(defaultStoreSettings);

export function StoreSettingsProvider({
  initial,
  children,
}: {
  initial: StoreSettings;
  children: ReactNode;
}) {
  return (
    <StoreSettingsContext.Provider value={initial}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
