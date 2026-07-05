'use client'

import { signup } from '../actions'
import { useActionState } from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await signup(formData)
    },
    null
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <main className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
        
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              name="fullName" 
              type="text" 
              required 
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role (Pilot MVP Only)</label>
            <select name="role" className="w-full px-3 py-2 border rounded-md">
              <option value="citizen">Citizen</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          {state?.error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
              {state.error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
          >
            {isPending ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </div>
      </main>
    </div>
  )
}
