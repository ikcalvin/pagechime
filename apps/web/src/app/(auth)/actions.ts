'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import { createClient } from '@/utils/supabase/server'

/**
 * Authenticates a user with email and password.
 * Redirects to home on success, or back to login with error on failure.
 *
 * @param formData - The form data containing email and password.
 */
export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        const cookieStore = await cookies()
        cookieStore.set({
            name: 'auth-error',
            value: 'Could not authenticate user',
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60,
        })
        redirect('/login')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

/**
 * Registers a new user with email and password.
 * Redirects to home on success (or Check Email), or back to signup with error on failure.
 *
 * @param formData - The form data containing email and password.
 */
type State = {
    error: string | null;
    message?: string | null;
}

export async function signup(prevState: State | null, formData: FormData): Promise<State> {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        // To prevent email enumeration, we treat "User already registered" as a success (ambiguous).
        // Supabase might not return this error depending on config, but if it does, we mask it.
        if (error.message.includes("User already registered") || error.code === "user_already_exists") {
            return { error: null, message: "Please check your email to verify your account." }
        }
        return { error: error.message }
    }

    return { error: null, message: "Please check your email to verify your account." }
}

/**
 * Signs out the current user.
 * Redirects to the login page.
 */
export async function signOut() {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
        console.error('Sign out failed:', error)
        return { error: error.message }
    }

    redirect('/login')
}

export async function deleteAuthErrorCookie() {
    const cookieStore = await cookies()
    cookieStore.delete('auth-error')
}

/**
 * Sends a password reset email to the user.
 * Redirects to the login page with a success message (optional) or back to forgot-password on error.
 */
export async function forgotPassword(prevState: State | null, formData: FormData): Promise<State> {
    const supabase = await createClient()

    const email = formData.get('email') as string
    // Get the base URL from the request headers or env var, defaulting to localhost
    // In server actions, we need to construct the URL carefully.
    // However, supabase.auth.resetPasswordForEmail takes a redirectTo options.
    // We can rely on the site URL configured in Supabase or pass a relative path if supported/configured correctly.
    // But best to provide a full URL if possible or let Supabase handle the base.
    // We'll use a relative path assuming Supabase is configured with the correct site URL.

    // Correction: We need to pass the FULL URL for redirectTo usually.
    // Let's assume the callback route handles the redirection.
    // The callback route is at /auth/callback.

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { error: null, message: 'Check your email for the password reset link' }
}

/**
 * Updates the user's password.
 * Must be called when the user is authenticated (e.g. after clicking the reset link).
 */
export async function updatePassword(prevState: State | null, formData: FormData): Promise<State> {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
