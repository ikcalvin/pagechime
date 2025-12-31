import { createClient } from './supabase/client';
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api', // Pointing to Next.js API routes which will proxy to Express or direct
});

// Interceptor to add auth token
api.interceptors.request.use(async (config) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
});

export default api;
