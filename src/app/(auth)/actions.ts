'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export async function login(formData: FormData) {
  const result = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.enum(['citizen', 'operator', 'admin']).default('citizen'),
})

export async function signup(formData: FormData) {
  const result = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
    role: formData.get('role') || 'citizen',
  })

  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        full_name: result.data.fullName,
        role: result.data.role,
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}
