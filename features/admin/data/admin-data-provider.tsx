"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadAdminOperations } from "./browser-repository";
import {
  defaultStoreSettings,
  type AdminOperationsSnapshot,
} from "./types";

type AdminDataContextValue = AdminOperationsSnapshot & {
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
  updateSnapshot: (
    updater: (current: AdminOperationsSnapshot) => AdminOperationsSnapshot,
  ) => void;
};

const initialSnapshot: AdminOperationsSnapshot = {
  orders: [],
  deliveryZones: [],
  promoCodes: [],
  settings: defaultStoreSettings,
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setSnapshot(await loadAdminOperations());
    } catch {
      setError(
        "Не удалось загрузить служебные данные. Проверьте соединение и повторите попытку.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadAdminOperations()
      .then((nextSnapshot) => {
        if (active) setSnapshot(nextSnapshot);
      })
      .catch(() => {
        if (active) {
          setError(
            "Не удалось загрузить служебные данные. Проверьте соединение и повторите попытку.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AdminDataContextValue>(
    () => ({
      ...snapshot,
      isLoading,
      error,
      refresh,
      updateSnapshot: setSnapshot,
    }),
    [error, isLoading, refresh, snapshot],
  );

  return (
    <AdminDataContext.Provider value={value}>
      {error ? (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()} className="admin-secondary">
            Повторить
          </button>
        </div>
      ) : null}
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const value = useContext(AdminDataContext);
  if (!value) throw new Error("AdminDataProvider is missing");
  return value;
}
