import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CitizenDashboardClient from './CitizenDashboardClient'

export default async function CitizenDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  // Fetch available services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch citizen profile location
  const { data: profile } = await supabase
    .from('profiles')
    .select('location_name')
    .eq('id', user.id)
    .single()

  return (
    <CitizenDashboardClient 
      user={user} 
      services={services || []} 
      initialLocation={profile?.location_name || null}
    />
  )
}
