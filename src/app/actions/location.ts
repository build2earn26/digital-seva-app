'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveProfileLocation(latitude: number | null, longitude: number | null, locationName: string) {
  const supabase = await createClient() // uses session-based client, not service role
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Update scoped exactly to the authenticated user's own row
  const { error } = await supabase
    .from('profiles')
    .update({
      latitude,
      longitude,
      location_name: locationName
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
