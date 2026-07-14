import { createClient } from '@/lib/supabase/server'
import ServicesFeed from './ServicesFeedClient'

export const dynamic = 'force-dynamic'

export default async function ServicesListPage() {
  const supabase = await createClient()
  const [
    { data: services },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from('services')
      .select('id, title, description, category, tags, academic_track, popularity, created_at')
      .eq('is_active', true),
    supabase.auth.getUser(),
  ])

  const profileTrack =
    (user?.user_metadata?.academic_track as string | undefined) ?? 'none'

  return <ServicesFeed initial={services ?? []} initialAcademic={profileTrack} />
}
