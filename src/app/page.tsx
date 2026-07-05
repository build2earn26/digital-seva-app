import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const role = user.user_metadata?.role || 'citizen'
    if (role === 'admin') return redirect('/admin')
    if (role === 'operator') return redirect('/operator')
    return redirect('/citizen')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <main className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Digital Seva MVP</h1>
        <p className="text-gray-600 text-sm">
          Streamlining government service requests for citizens, operators, and administrators.
        </p>
        
        <div className="pt-4 flex flex-col space-y-3">
          <Link 
            href="/login"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/signup"
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
          >
            Create an Account
          </Link>
        </div>
      </main>
    </div>
  )
}
