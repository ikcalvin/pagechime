'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
    error?: string
    success?: string
}

export async function updateEmail(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const email = formData.get('email')

    if (typeof email !== 'string') {
        return { error: 'Invalid email format' }
    }

    if (!email) {
        return { error: 'Email is required' }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return { error: 'Please enter a valid email address' }
    }

    const { error } = await supabase.auth.updateUser({ email })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/settings')
    return { success: 'Confirmation email sent. Please check your inbox to confirm the change.' }
}
export async function updatePassword(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')

    if (typeof password !== 'string' || typeof confirmPassword !== 'string') {
        return { error: 'Invalid password format' }
    }

    if (!password) {
        return { error: 'Password is required' }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' }
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/settings')
    return { success: 'Password updated successfully' }
}
