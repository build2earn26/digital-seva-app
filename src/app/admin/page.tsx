import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  // Fetch Aggregates using fast count queries
  const [{ count: pendingReq }, { count: assignedReq }, { count: inProgressReq }, { count: completedReq }] = await Promise.all([
    supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'assigned'),
    supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed')
  ])

  const { count: pendingDocs } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'uploaded')
  
  const [{ count: paidReq }, { count: pendingPayReq }] = await Promise.all([
    supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
    supabase.from('service_requests').select('*', { count: 'exact', head: true }).in('payment_status', ['requested', 'pending'])
  ])

  // Active cases: non-completed, non-cancelled
  const { count: activeCases } = await supabase.from('service_requests').select('*', { count: 'exact', head: true }).not('status', 'in', '("completed","cancelled")')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-gray-900 text-white p-6 rounded-xl shadow-md">
          <div>
            <h1 className="text-2xl font-bold">Admin Console</h1>
            <p className="text-gray-400">System Management & Operational Metrics</p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md font-medium">
              Sign Out
            </button>
          </form>
        </header>

        {/* METRICS DASHBOARD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Key Operational Metrics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-blue-800 mb-1">Active Cases</p>
              <p className="text-3xl font-bold text-blue-600">{activeCases ?? 0}</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-orange-800 mb-1">Pending Documents</p>
              <p className="text-3xl font-bold text-orange-600">{pendingDocs ?? 0}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-indigo-800 mb-1">Pending Payments</p>
              <p className="text-3xl font-bold text-indigo-600">{pendingPayReq ?? 0}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-green-800 mb-1">Completed Cases</p>
              <p className="text-3xl font-bold text-green-600">{completedReq ?? 0}</p>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between text-sm text-gray-600 overflow-x-auto gap-4">
            <span className="font-medium text-gray-700 whitespace-nowrap">Pipeline:</span>
            <span className="whitespace-nowrap">Unassigned: <b className="text-gray-900">{pendingReq ?? 0}</b></span>
            <span className="whitespace-nowrap">Assigned: <b className="text-gray-900">{assignedReq ?? 0}</b></span>
            <span className="whitespace-nowrap">In Progress: <b className="text-gray-900">{inProgressReq ?? 0}</b></span>
            <span className="whitespace-nowrap">Total Paid: <b className="text-gray-900">{paidReq ?? 0}</b></span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/admin/requests" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 group">
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">Global Requests &rarr;</h2>
            <p className="mt-2 text-sm text-gray-600">View all service requests and manage operator assignments.</p>
          </Link>
          
          <Link href="/admin/services" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 group">
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">Manage Services &rarr;</h2>
            <p className="mt-2 text-sm text-gray-600">Create and edit the catalog of public services.</p>
          </Link>

          <Link href="/admin/locations" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 group">
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">Manage Locations &rarr;</h2>
            <p className="mt-2 text-sm text-gray-600">Configure districts, mandals, and villages.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
