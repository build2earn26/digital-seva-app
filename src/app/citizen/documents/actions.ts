'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadVaultDocument(formData: FormData) {
  const file = formData.get('file') as File
  
  if (!file || file.size === 0) {
    return { error: 'Please select a file to upload.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const timestamp = Date.now()
  const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const storagePath = `${user.id}/vault/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('service_documents')
    .upload(storagePath, file)

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return { error: 'Failed to upload file to storage.' }
  }

  // Insert into documents table with request_id = null
  const { error: dbError } = await supabase
    .from('documents')
    .insert({
      uploaded_by: user.id,
      path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      status: 'uploaded'
    })

  if (dbError) {
    console.error('DB insert error:', dbError)
    // Attempt cleanup
    await supabase.storage.from('service_documents').remove([storagePath])
    return { error: 'Failed to save document metadata.' }
  }

  revalidatePath('/citizen/documents')
  return { success: true }
}
