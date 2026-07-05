import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Allow citizens to view their dashboard. If operator/admin visit, they can see it too, 
  // or we can strictly enforce it. We will strictly enforce citizen only.
  if (user.user_metadata?.role !== 'citizen') {
    redirect('/')
  }

  return <>{children}</>
}
