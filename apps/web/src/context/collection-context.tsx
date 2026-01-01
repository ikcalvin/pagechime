"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/utils/api";
import { toast } from "sonner";

export interface Collection {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  articles?: { count: number }[];
}

interface CollectionContextType {
  collections: Collection[];
  loading: boolean;
  refreshCollections: () => Promise<void>;
  addCollection: (name: string) => Promise<Collection | null>;
  updateCollection: (id: string, name: string) => Promise<boolean>;
  deleteCollection: (id: string) => Promise<boolean>;
}

const CollectionContext = createContext<CollectionContextType | undefined>(
  undefined
);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCollections = async () => {
    try {
      const res = await api.get("/collections");
      setCollections(
        res.data?.sort((a: Collection, b: Collection) =>
          a.name.localeCompare(b.name)
        ) || []
      );
    } catch (error) {
      console.error("Failed to fetch collections", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCollections();
  }, []);

  const addCollection = async (name: string) => {
    try {
      const res = await api.post("/collections", { name });
      const newCollection = res.data;
      setCollections((prev) =>
        [...prev, newCollection].sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success("Collection created");
      return newCollection;
    } catch (error) {
      console.error(error);
      toast.error("Failed to create collection");
      return null;
    }
  };

  const updateCollection = async (id: string, name: string) => {
    try {
      await api.put(`/collections/${id}`, { name });
      setCollections((prev) =>
        prev
          .map((c) => (c.id === id ? { ...c, name } : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Failed to update collection");
      return false;
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      await api.delete(`/collections/${id}`);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      toast.success("Collection deleted");
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete collection");
      return false;
    }
  };

  return (
    <CollectionContext.Provider
      value={{
        collections,
        loading,
        refreshCollections,
        addCollection,
        updateCollection,
        deleteCollection,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollections() {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error("useCollections must be used within a CollectionProvider");
  }
  return context;
}
