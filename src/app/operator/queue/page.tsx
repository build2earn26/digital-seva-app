import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function OperatorQueue() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch requests assigned to this operator OR pending (unassigned)
  const { data: requests } = await supabase
    .from('service_requests')
    .select('*, services(title)')
    .or(`assigned_operator_id.eq.${user?.id},status.eq.pending`)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Operator Queue</h1>
          <Link href="/operator" className="text-blue-600 hover:underline">Back to Workspace</Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Service</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Assignment</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests?.map((req) => (
                <tr key={req.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{req.services?.title}</td>
                  <td className="px-6 py-4">{new Date(req.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium uppercase">{req.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    {req.assigned_operator_id === user?.id ? (
                      <span className="text-blue-600 font-medium">Assigned to Me</span>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/operator/queue/${req.id}`} className="text-blue-600 hover:underline font-medium">
                      Review &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
              {(!requests || requests.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No requests in queue.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
