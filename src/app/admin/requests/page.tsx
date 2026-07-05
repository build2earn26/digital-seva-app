import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminRequests() {
  const supabase = await createClient()
  const { data: requests } = await supabase
    .from('service_requests')
    .select('*, services(title)')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Global Requests (Admin)</h1>
          <Link href="/admin" className="text-blue-600 hover:underline">Back to Console</Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-100 text-gray-700 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Service</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Operator ID</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests?.map((req) => (
                <tr key={req.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{req.services?.title}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-200 rounded-md text-xs font-medium uppercase">{req.status}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{req.assigned_operator_id || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:underline font-medium text-sm">Reassign</button>
                  </td>
                </tr>
              ))}
              {(!requests || requests.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No requests in system.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
