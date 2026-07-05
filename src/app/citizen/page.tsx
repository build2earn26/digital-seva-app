import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function CitizenDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.user_metadata?.full_name || 'Citizen'}</h1>
            <p className="text-gray-500">Citizen Dashboard</p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-medium">
              Sign Out
            </button>
          </form>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/citizen/services" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
            <h2 className="text-xl font-semibold text-blue-600 group-hover:text-blue-700">Apply for a Service &rarr;</h2>
            <p className="mt-2 text-gray-600">Browse available government services like Birth, Income, and Caste certificates.</p>
          </Link>
          
          <Link href="/citizen/cases" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
            <h2 className="text-xl font-semibold text-blue-600 group-hover:text-blue-700">My Cases &rarr;</h2>
            <p className="mt-2 text-gray-600">Check the status of your existing requests, respond to messages, and make payments.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
