'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { redirect } from 'next/navigation'

const applySchema = z.object({
  service_id: z.string().uuid(),
  district_id: z.string().uuid().optional(),
  mandal_id: z.string().uuid().optional(),
  village_id: z.string().uuid().optional(),
  center_id: z.string().uuid().optional(),
  notes: z.string().optional(),
})

export async function submitApplication(formData: FormData) {
  const supabaseServer = await createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  
  if (!user || user.user_metadata?.role !== 'citizen') {
    return { error: "Unauthorized: Only citizens can apply for services." }
  }

  const result = applySchema.safeParse({
    service_id: formData.get('service_id'),
    district_id: formData.get('district_id') || undefined,
    mandal_id: formData.get('mandal_id') || undefined,
    village_id: formData.get('village_id') || undefined,
    center_id: formData.get('center_id') || undefined,
    notes: formData.get('notes')
  })

  if (!result.success) {
    return { error: "Invalid form data: " + result.error.message }
  }

  const serviceId = result.data.service_id
  const { data: service } = await supabaseServer.from('services').select('*').eq('id', serviceId).single()
  if (!service) return { error: "Service not found." }

  const reqDocs = typeof service.required_documents === 'string' 
    ? JSON.parse(service.required_documents) 
    : (service.required_documents || [])

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
  
  // We'll collect new files and vault document references
  const documentsToAttach: { newFile?: File, vaultDocId?: string, docName: string }[] = []

  if (Array.isArray(reqDocs)) {
    for (let i = 0; i < reqDocs.length; i++) {
      const doc = reqDocs[i];
      const newFile = formData.get(`file_${i}`) as File | null;
      const vaultDocId = formData.get(`vault_${i}`) as string | null;
      
      if (doc.isRequired && (!newFile || newFile.size === 0) && !vaultDocId) {
        return { error: `Document ${doc.nameEn} is required.` }
      }
      
      if (newFile && newFile.size > 0) {
        if (newFile.size > MAX_FILE_SIZE) {
          return { error: `File ${newFile.name} exceeds the 5MB size limit.` }
        }
        if (!ALLOWED_TYPES.includes(newFile.type)) {
          return { error: `File ${newFile.name} must be a PDF, JPG, or PNG.` }
        }
        documentsToAttach.push({ newFile, docName: doc.nameEn })
      } else if (vaultDocId) {
        documentsToAttach.push({ vaultDocId, docName: doc.nameEn })
      }
    }
  }

  // 1. Insert Request
  const { data: request, error: requestError } = await supabaseServer.from('service_requests').insert({
    citizen_id: user.id,
    service_id: service.id,
    status: 'pending',
    metadata: result.data
  }).select('id').single()

  if (requestError || !request) {
    return { error: "Failed to submit request: " + requestError?.message }
  }

  // 2. Process Documents
  const timestamp = Date.now();
  const uploadedPaths: string[] = [];
  
  for (const item of documentsToAttach) {
    if (item.newFile) {
      const cleanName = item.newFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const storagePath = `requests/${request.id}/${user.id}/${timestamp}-${cleanName}`;
      
      const { error: uploadError } = await supabaseServer.storage
        .from('service_documents')
        .upload(storagePath, item.newFile);
      
      if (uploadError) {
         if (uploadedPaths.length > 0) {
           await supabaseServer.storage.from('service_documents').remove(uploadedPaths);
         }
         await supabaseServer.from('service_requests').delete().eq('id', request.id);
         return { error: "Failed to upload document: " + uploadError.message }
      }
      
      uploadedPaths.push(storagePath);

      // Corrected schema insert
      const { error: docError } = await supabaseServer.from('documents').insert({
        request_id: request.id,
        uploaded_by: user.id,
        path: storagePath,
        file_name: cleanName,
        mime_type: item.newFile.type,
        size_bytes: item.newFile.size,
        status: 'uploaded'
      });

      if (docError) {
         await supabaseServer.storage.from('service_documents').remove(uploadedPaths);
         await supabaseServer.from('service_requests').delete().eq('id', request.id);
         return { error: "Failed to link document: " + docError.message }
      }
    } else if (item.vaultDocId) {
      // User selected a vault document. We'll copy the reference.
      const { data: vaultDoc } = await supabaseServer.from('documents').select('*').eq('id', item.vaultDocId).single()
      if (vaultDoc) {
        const { error: copyError } = await supabaseServer.from('documents').insert({
          request_id: request.id,
          uploaded_by: user.id,
          path: vaultDoc.path,
          file_name: vaultDoc.file_name,
          mime_type: vaultDoc.mime_type,
          size_bytes: vaultDoc.size_bytes,
          status: 'uploaded'
        })
        if (copyError) {
           return { error: "Failed to link vault document: " + copyError.message }
        }
      }
    }
  }

  return { success: true, redirect: `/citizen/applications/${request.id}` }
}

export async function getEligibleCenters(serviceId: string, lat?: number, lng?: number, district?: string, mandal?: string, village?: string) {
  const supabaseServer = await createClient()

  if (lat && lng) {
    // Use the RPC for earthdistance sorting
    const { data, error } = await supabaseServer.rpc('get_nearby_centers', {
      p_service_id: serviceId,
      p_lat: lat,
      p_lng: lng
    })
    if (error) console.error('RPC Error:', error)
    return data || []
  } else {
    // Fallback: manual selection via district/mandal/village filtering
    let query = supabaseServer
      .from('service_centers')
      .select('*, service_center_mappings!inner(service_id)')
      .eq('service_center_mappings.service_id', serviceId)
      .eq('is_active', true)

    if (district) query = query.eq('district', district)
    if (mandal) query = query.eq('mandal', mandal)
    if (village) query = query.eq('village_or_town', village)

    const { data, error } = await query
    if (error) console.error('Query Error:', error)
    return data || []
  }
}
