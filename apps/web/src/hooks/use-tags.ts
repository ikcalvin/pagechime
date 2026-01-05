import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/utils/api";

export type Tag = {
    id: string;
    name: string;
};

export function useTags() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        const fetchTags = async () => {
            try {
                if (isMounted.current) setIsLoading(true);

                const response = await api.get("/tags");

                if (isMounted.current) {
                    setTags(response.data || []);
                    setError(null);
                }
            } catch (err) {
                console.error("Failed to fetch tags", err);
                if (isMounted.current) {
                    setError(err instanceof Error ? err : new Error("Failed to fetch tags"));
                }
            } finally {
                if (isMounted.current) {
                    setIsLoading(false);
                }
            }
        };

        fetchTags();

        return () => {
            isMounted.current = false;
        };
    }, []);

    const refreshTags = useCallback(async () => {
        try {
            if (isMounted.current) setIsLoading(true);
            const response = await api.get("/tags");

            if (isMounted.current) {
                setTags(response.data || []);
                setError(null);
            }
        } catch (err) {
            console.error("Failed to fetch tags", err);
            if (isMounted.current) {
                setError(err instanceof Error ? err : new Error("Failed to fetch tags"));
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, [])

    return { tags, isLoading, error, refreshTags };
}
