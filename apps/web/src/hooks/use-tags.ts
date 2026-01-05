import { useState, useEffect, useCallback } from "react";
import api from "@/utils/api";

export type Tag = {
    id: string;
    name: string;
};

export function useTags() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchTags = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get("/tags");
            setTags(response.data || []);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch tags", err);
            setError(err instanceof Error ? err : new Error("Failed to fetch tags"));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    return { tags, isLoading, error, refreshTags: fetchTags };
}
