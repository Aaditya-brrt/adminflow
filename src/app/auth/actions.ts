'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface ActionState {
  error?: boolean
  success?: boolean
  message?: string
  pending?: boolean
}

export async function login(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  console.log('🚀 Login attempt started')
  
  const supabase = await createClient()
  console.log('✅ Supabase client created successfully')

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('📝 Form data received:', {
    email: data.email,
    passwordLength: data.password?.length || 0,
    hasPassword: !!data.password
  })

  // Basic validation
  if (!data.email || !data.password) {
    console.error('❌ Missing email or password')
    return {
      error: true,
      message: 'Email and password are required'
    }
  }

  try {
    console.log('🔐 Attempting to sign in with Supabase...')
    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
      console.error('❌ Supabase login error:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      
      // Provide more specific error messages
      let errorMessage = 'Invalid credentials'
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account'
      } else if (error.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later'
      }
      
      return {
        error: true,
        message: errorMessage
      }
    }

    console.log('✅ Login successful')
    revalidatePath('/', 'layout')
    
  } catch (error) {
    console.error('💥 Unexpected error during login:', error)
    return {
      error: true,
      message: 'An unexpected error occurred. Please try again.'
    }
  }

  // Use server-side redirect as recommended in Next.js 15 docs
  // Must be outside try/catch since redirect() throws an error
  redirect('/dashboard')
}

export async function signup(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  console.log('🚀 Signup attempt started')
  
  const supabase = await createClient()
  console.log('✅ Supabase client created successfully')

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('📝 Form data received:', {
    email: data.email,
    passwordLength: data.password?.length || 0,
    hasPassword: !!data.password
  })

  // Basic validation
  if (!data.email || !data.password) {
    console.error('❌ Missing email or password')
    return {
      error: true,
      message: 'Email and password are required'
    }
  }

  if (data.password.length < 6) {
    console.error('❌ Password too short')
    return {
      error: true,
      message: 'Password must be at least 6 characters'
    }
  }

  try {
    console.log('🔐 Attempting to sign up user with Supabase...')
    const { data: signupData, error } = await supabase.auth.signUp(data)

    if (error) {
      console.error('❌ Supabase signup error:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      
      // Provide more specific error messages
      let errorMessage = 'Signup failed'
      if (error.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists'
      } else if (error.message.includes('password')) {
        errorMessage = 'Password is too weak'
      } else if (error.message.includes('email')) {
        errorMessage = 'Please enter a valid email address'
      } else if (error.status === 422) {
        errorMessage = 'Invalid email or password format'
      } else if (error.status === 429) {
        errorMessage = 'Too many signup attempts. Please try again later'
      }
      
      return {
        error: true,
        message: errorMessage
      }
    }

    console.log('✅ Signup successful:', {
      userId: signupData.user?.id,
      email: signupData.user?.email,
      emailConfirmed: signupData.user?.email_confirmed_at
    })

    revalidatePath('/', 'layout')
    
  } catch (error) {
    console.error('💥 Unexpected error during signup:', error)
    return {
      error: true,
      message: 'An unexpected error occurred. Please try again.'
    }
  }

  // Redirect to check-email page after successful signup
  // Must be outside try/catch since redirect() throws an error
  redirect('/auth/check-email')
}

export async function logout() {
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/')
} 