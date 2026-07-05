import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminLocations() {
  const supabase = await createClient()
  const { data: districts } = await supabase.from('districts').select('*')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Locations</h1>
          <Link href="/admin" className="text-blue-600 hover:underline">Back to Console</Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-100 text-gray-700 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">District Name</th>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {districts?.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{d.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{d.id}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:underline font-medium text-sm">View Mandals</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
