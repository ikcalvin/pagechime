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
}

export async function signup(prevState: State | null, formData: FormData): Promise<State> {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
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
