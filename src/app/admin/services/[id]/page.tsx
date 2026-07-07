import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

export default async function AdminServiceDetail({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  // Fetch the service details
  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!service) {
    return <div className="p-8 text-center text-red-500">Service not found</div>
  }

  // Fetch all active centers
  const { data: allCenters } = await supabase
    .from('service_centers')
    .select('*')
    .eq('is_active', true)
    .order('district', { ascending: true })
    .order('name', { ascending: true })

  // Fetch current mappings for this service
  const { data: currentMappings } = await supabase
    .from('service_center_mappings')
    .select('center_id')
    .eq('service_id', params.id)

  const mappedCenterIds = new Set(currentMappings?.map(m => m.center_id) || [])

  async function updateMappings(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const selectedCenters = formData.getAll('center_ids') as string[]
    
    // First, delete all existing mappings for this service
    await supabase.from('service_center_mappings').delete().eq('service_id', params.id)
    
    // Then insert the newly selected mappings
    if (selectedCenters.length > 0) {
      const inserts = selectedCenters.map(center_id => ({
        service_id: params.id,
        center_id
      }))
      await supabase.from('service_center_mappings').insert(inserts)
    }
    
    revalidatePath(`/admin/services/${params.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Service: {service.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Configure service settings and availability.</p>
          </div>
          <Link href="/admin/services" className="text-blue-600 hover:underline text-sm font-medium">Back to Services</Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Eligible Service Centers</h2>
          <p className="text-sm text-gray-600 mb-6">
            Select the centers where this service is available. Citizens will only be able to choose from these locations when applying.
          </p>
          
          <form action={updateMappings} className="space-y-4">
            <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {allCenters?.map((center) => {
                const isSelected = mappedCenterIds.has(center.id)
                return (
                  <label key={center.id} className="flex items-start p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <input 
                        type="checkbox" 
                        name="center_ids" 
                        value={center.id}
                        defaultChecked={isSelected}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{center.name}</p>
                      <p className="text-xs text-gray-500">{center.district} &gt; {center.mandal} &gt; {center.village_or_town}</p>
                    </div>
                  </label>
                )
              })}
              {(!allCenters || allCenters.length === 0) && (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No active service centers found. <Link href="/admin/locations/centers" className="text-blue-600 hover:underline">Add centers first.</Link>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors">
                Save Center Mappings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
