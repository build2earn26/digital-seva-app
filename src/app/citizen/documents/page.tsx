import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DocumentVaultClient from './DocumentVaultClient'

export default async function DocumentVaultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  // Fetch all documents uploaded by this user, including those without a request
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('uploaded_by', user.id)
    .order('created_at', { ascending: false })

  // We generate a signed URL for each document so the client can preview/download it
  const documentsWithUrls = await Promise.all((documents || []).map(async (doc) => {
    const { data } = await supabase.storage.from('service_documents').createSignedUrl(doc.path, 3600)
    return {
      ...doc,
      signedUrl: data?.signedUrl
    }
  }))

  return (
    <DocumentVaultClient 
      documents={documentsWithUrls} 
      userId={user.id} 
    />
  )
}
