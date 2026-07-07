import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ApplyFormClient from './ApplyFormClient'

export default async function ApplyServicePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: service } = await supabase.from('services').select('*').eq('id', params.id).single()
  
  if (!service) return (
    <div className="p-8 text-center text-red-500">Service not found.</div>
  )

  // Fetch districts (mocking the full location tree for MVP)
  const { data: districts } = await supabase.from('districts').select('*')

  // Fetch the user's document vault
  const { data: vaultDocuments } = await supabase
    .from('documents')
    .select('*')
    .eq('uploaded_by', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center space-x-3 sticky top-0 z-10">
        <Link href="/citizen" className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Digital Seva</h1>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
        <ApplyFormClient 
          service={service} 
          districts={districts || []} 
          vaultDocuments={vaultDocuments || []} 
        />
      </main>
    </div>
  )
}
