import {createContext, useContext} from "react";
import type {GeneratedResponse, ItemDetails} from "@/lib/constants";

export const HistoryContext = createContext<
  | {
      history: GeneratedResponse[];
      selected: ItemDetails | null;
      onHistorySelect: (
        item: GeneratedResponse | null,
      ) => Promise<(ItemDetails & { file: File | Blob }) | null>;
      appendHistory: (item: GeneratedResponse) => void;
      resetHistory: () => void;
      removeHistory: (item: GeneratedResponse) => void;
    }
  | undefined
>(undefined);

// Custom hook to use the history context
export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
}
