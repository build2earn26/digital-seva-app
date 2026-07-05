import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function MyCasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cases } = await supabase
    .from('service_requests')
    .select('*, services(title)')
    .eq('citizen_id', user?.id || '')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
          <Link href="/citizen" className="text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>

        <div className="grid gap-4">
          {cases?.map((c) => (
            <Link key={c.id} href={`/citizen/cases/${c.id}`} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-colors block">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{c.services?.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">Submitted: {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                    c.status === 'completed' ? 'bg-green-100 text-green-800' :
                    c.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {(!cases || cases.length === 0) && (
            <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm">
              You haven't submitted any service requests yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
