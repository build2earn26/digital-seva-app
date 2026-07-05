import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function OperatorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.user_metadata?.full_name || 'Operator'}</h1>
            <p className="text-blue-600 font-medium">Operator Workspace</p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-medium">
              Sign Out
            </button>
          </form>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/operator/queue" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
            <h2 className="text-xl font-semibold text-blue-600 group-hover:text-blue-700">Work Queue &rarr;</h2>
            <p className="mt-2 text-gray-600">View your assigned cases and take unassigned cases from the pool.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
