import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'

const applySchema = z.object({
  district_id: z.string().uuid(),
  mandal_id: z.string().uuid(),
  village_id: z.string().uuid(),
  notes: z.string().optional(),
})

export default async function ApplyServicePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: service } = await supabase.from('services').select('*').eq('id', params.id).single()
  
  if (!service) return (
    <div className="p-8 text-center text-red-500">Service not found.</div>
  )

  const reqDocs = typeof service.required_documents === 'string' 
    ? JSON.parse(service.required_documents) 
    : service.required_documents

  // We should ideally fetch actual locations, but for MVP stubbing the dropdown is fine.
  // We'll mock the district/mandal/village context for the UI if needed, but in real code, 
  // you'd query the locations tables.
  const { data: districts } = await supabase.from('districts').select('*')

  async function submitApplication(formData: FormData) {
    'use server'
    const supabaseServer = await createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    
    if (!user || user.user_metadata?.role !== 'citizen') {
      throw new Error("Unauthorized: Only citizens can apply for services.")
    }

    const result = applySchema.safeParse({
      district_id: formData.get('district_id'),
      mandal_id: formData.get('mandal_id'),
      village_id: formData.get('village_id'),
      notes: formData.get('notes')
    })

    if (!result.success) {
      throw new Error("Invalid form data: " + result.error.message)
    }

    // Extract files dynamically and validate constraints
    const files: File[] = [];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

    if (reqDocs && Array.isArray(reqDocs)) {
      for (let i = 0; i < reqDocs.length; i++) {
        const doc = reqDocs[i];
        const file = formData.get(`file_${i}`) as File | null;
        
        if (doc.isRequired && (!file || file.size === 0)) {
          throw new Error(`Document ${doc.nameEn} is required.`);
        }
        
        if (file && file.size > 0) {
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File ${file.name} exceeds the 5MB size limit.`);
          }
          if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error(`File ${file.name} must be a PDF, JPG, or PNG.`);
          }
          files.push(file);
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
      throw new Error("Failed to submit request: " + requestError?.message);
    }

    // 2. Upload Files & Insert Metadata sequentially
    const timestamp = Date.now();
    const uploadedPaths: string[] = [];
    
    for (const file of files) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const storagePath = `requests/${request.id}/${user.id}/${timestamp}-${cleanName}`;
      
      const { error: uploadError } = await supabaseServer.storage
        .from('service_documents')
        .upload(storagePath, file);
      
      if (uploadError) {
         // Partial failure cleanup: remove all previously successful uploads
         if (uploadedPaths.length > 0) {
           await supabaseServer.storage.from('service_documents').remove(uploadedPaths);
         }
         await supabaseServer.from('service_requests').delete().eq('id', request.id);
         throw new Error("Failed to upload document: " + uploadError.message);
      }
      
      uploadedPaths.push(storagePath);

      const { error: docError } = await supabaseServer.from('documents').insert({
        request_id: request.id,
        citizen_id: user.id,
        storage_path: storagePath,
        file_name: file.name,
        file_type: file.type,
        status: 'pending'
      });

      if (docError) {
         // Partial failure cleanup: remove all successful uploads including the current one
         await supabaseServer.storage.from('service_documents').remove(uploadedPaths);
         await supabaseServer.from('service_requests').delete().eq('id', request.id);
         throw new Error("Failed to link document: " + docError.message);
      }
    }

    redirect('/citizen/cases')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/citizen/services" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Services</Link>
        
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Apply for {service.title}</h1>
          <p className="text-gray-600 mb-8">{service.description}</p>

          <form action={submitApplication} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Location Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <select name="district_id" required className="w-full px-3 py-2 border rounded-md">
                  <option value="">Select District</option>
                  {districts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              {/* Note: In a full app, mandal and village would dynamically populate based on district */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mandal</label>
                <select name="mandal_id" required className="w-full px-3 py-2 border rounded-md">
                  <option value="">Select Mandal</option>
                  <option value="22222222-1111-1111-1111-111111111111">Peddapuram</option>
                  <option value="22222222-1111-1111-1111-222222222222">Samalkota</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                <select name="village_id" required className="w-full px-3 py-2 border rounded-md">
                  <option value="">Select Village</option>
                  <option value="22222222-1111-1111-1111-111111111111">Peddapuram / Samalkota Villages</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Required Documents</h3>
              {reqDocs?.map((doc: any, i: number) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {doc.nameEn} {doc.isRequired && <span className="text-red-500">*</span>}
                  </label>
                  <input type="file" name={`file_${i}`} required={doc.isRequired} className="w-full" />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea name="notes" rows={3} className="w-full px-3 py-2 border rounded-md"></textarea>
            </div>

            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
