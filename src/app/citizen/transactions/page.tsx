import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Fetch payments joined with service_requests and services
  const { data: payments } = await supabase
    .from('payments')
    .select('*, service_requests(citizen_id, services(title))')
    .eq('service_requests.citizen_id', user.id)
    .order('created_at', { ascending: false })

  // Supabase inner joins sometimes need filtering if citizen_id doesn't match directly in a nested way depending on foreign key
  // A safer approach if the above doesn't work correctly is to fetch requests first, then payments.
  // Assuming the query works (Supabase inner join):
  const validPayments = payments?.filter(p => p.service_requests !== null) || []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center space-x-3 sticky top-0 z-10">
        <Link href="/citizen" className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">My Transactions</h1>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-4">
        {validPayments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-green-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            You don't have any transactions yet.
          </div>
        ) : (
          <div className="space-y-3">
            {validPayments.map((payment: any) => (
              <Link key={payment.id} href={`/citizen/applications/${payment.request_id}`} className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-green-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-base font-bold text-gray-900 leading-tight">
                    {payment.service_requests?.services?.title || 'Service Payment'}
                  </h2>
                  <span className={`flex-shrink-0 ml-3 px-2 py-1 text-xs rounded-full font-semibold ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    payment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Stage: {payment.stage}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(payment.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    ₹{payment.amount}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
