import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ServicesList() {
  const supabase = await createClient()
  const { data: services } = await supabase.from('services').select('*').eq('is_active', true)
  
  // Note: For MVP, the location is selected in the apply form.

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Available Services</h1>
          <Link href="/citizen" className="text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>

        <div className="grid gap-4">
          {services?.map((service) => (
            <div key={service.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{service.title}</h2>
                <p className="text-gray-600 mt-1">{service.description}</p>
              </div>
              <Link 
                href={`/citizen/services/${service.id}/apply`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Apply
              </Link>
            </div>
          ))}
          {(!services || services.length === 0) && (
            <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm">
              No active services available at the moment.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
