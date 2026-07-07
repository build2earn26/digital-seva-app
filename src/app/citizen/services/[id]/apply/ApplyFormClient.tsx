'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { submitApplication, getEligibleCenters } from './actions'
import { toast } from 'sonner'

export default function ApplyFormClient({ service, districts, vaultDocuments }: { service: any, districts: any[], vaultDocuments: any[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Track how users want to provide each required document: 'upload' or 'vault'
  const reqDocs = typeof service.required_documents === 'string' 
    ? JSON.parse(service.required_documents) 
    : (service.required_documents || [])
  const [docMethods, setDocMethods] = useState<Record<number, 'upload' | 'vault'>>({})

  // Center Selection State
  const [centers, setCenters] = useState<any[]>([])
  const [isLoadingCenters, setIsLoadingCenters] = useState(false)
  const [locationStatus, setLocationStatus] = useState<string>('')
  
  // Manual selection state
  const [selDistrict, setSelDistrict] = useState('')
  const [selMandal, setSelMandal] = useState('')
  const [selVillage, setSelVillage] = useState('')

  // Fetch centers manually
  useEffect(() => {
    // Only fetch manually if we have at least district selected and we are not using geolocation
    if (selDistrict) {
      const fetchManual = async () => {
        setIsLoadingCenters(true)
        const results = await getEligibleCenters(service.id, undefined, undefined, selDistrict, selMandal, selVillage)
        setCenters(results)
        setIsLoadingCenters(false)
      }
      fetchManual()
    }
  }, [selDistrict, selMandal, selVillage, service.id])

  // Geolocation trigger
  const handleUseMyLocation = () => {
    setLocationStatus('Locating...')
    setIsLoadingCenters(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocationStatus('Location found! Showing nearest centers.')
          const { latitude, longitude } = position.coords
          const results = await getEligibleCenters(service.id, latitude, longitude)
          setCenters(results)
          setIsLoadingCenters(false)
        },
        (error) => {
          console.error(error)
          setLocationStatus('Location access denied or failed. Please select manually.')
          setIsLoadingCenters(false)
        }
      )
    } else {
      setLocationStatus('Geolocation is not supported by your browser.')
      setIsLoadingCenters(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      const res = await submitApplication(formData)
      if (res.error) {
        toast.error(res.error)
      } else if (res.redirect) {
        toast.success('Application submitted successfully!')
        router.push(res.redirect)
      }
    } catch (err: any) {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Apply for {service.title}</h1>
      <p className="text-gray-600 mb-8">{service.description}</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <input type="hidden" name="service_id" value={service.id} />

        {/* Location Selection & Nearby Centers */}
        <section className="space-y-4">
          <div className="flex justify-between items-end border-b border-gray-100 pb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Service Center Selection</h3>
              <p className="text-sm text-gray-500">Find and select an eligible center for your application.</p>
            </div>
            <button 
              type="button" 
              onClick={handleUseMyLocation}
              className="text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span>Use my location</span>
            </button>
          </div>
          
          {locationStatus && (
            <p className={`text-sm ${locationStatus.includes('failed') || locationStatus.includes('denied') ? 'text-red-600' : 'text-green-600'}`}>
              {locationStatus}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <select 
                name="district_name"
                value={selDistrict}
                onChange={e => { setSelDistrict(e.target.value); setSelMandal(''); setSelVillage('') }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-blue-500"
              >
                <option value="">Select District</option>
                {districts?.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mandal (Optional)</label>
              <input 
                name="mandal_name"
                type="text" 
                value={selMandal}
                onChange={e => setSelMandal(e.target.value)}
                placeholder="e.g. Peddapuram"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Village/Town (Optional)</label>
              <input 
                name="village_name"
                type="text" 
                value={selVillage}
                onChange={e => setSelVillage(e.target.value)}
                placeholder="e.g. Peddapuram Town"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Eligible Centers Found {centers.length > 0 && `(${centers.length})`}</h4>
            {isLoadingCenters ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ) : centers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                {centers.map((center) => (
                  <label key={center.id} className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <input type="radio" name="center_id" value={center.id} required className="mt-1 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">{center.name}</span>
                      <span className="block text-xs text-gray-500 mt-1">{center.district} &gt; {center.mandal} &gt; {center.village_or_town}</span>
                      {center.distance_miles !== undefined && (
                        <span className="block text-xs font-medium text-blue-600 mt-1">{center.distance_miles.toFixed(2)} miles away</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 text-center">
                {selDistrict ? 'No eligible centers found in this area. Try selecting a different location or use geolocation.' : 'Select a location above or use "Use my location" to find eligible centers.'}
              </div>
            )}
          </div>
        </section>

        {/* Required Documents */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-100 pb-2 text-gray-900">Required Documents</h3>
          {reqDocs.length === 0 && <p className="text-sm text-gray-500">No documents required for this service.</p>}
          
          <div className="space-y-6">
            {reqDocs.map((doc: any, i: number) => {
              const method = docMethods[i] || 'upload'
              
              return (
                <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {doc.nameEn} {doc.isRequired && <span className="text-red-500">*</span>}
                  </label>
                  
                  <div className="flex space-x-4 mb-3">
                    <label className="inline-flex items-center text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        checked={method === 'upload'}
                        onChange={() => setDocMethods(prev => ({ ...prev, [i]: 'upload' }))}
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="ml-2 text-gray-700">Upload New File</span>
                    </label>
                    <label className="inline-flex items-center text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        checked={method === 'vault'}
                        onChange={() => setDocMethods(prev => ({ ...prev, [i]: 'vault' }))}
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="ml-2 text-gray-700">Choose from Vault</span>
                    </label>
                  </div>

                  {method === 'upload' ? (
                    <input 
                      type="file" 
                      name={`file_${i}`} 
                      required={doc.isRequired && method === 'upload'} 
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    />
                  ) : (
                    <select 
                      name={`vault_${i}`} 
                      required={doc.isRequired && method === 'vault'} 
                      className="block w-full text-sm px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a document from vault...</option>
                      {vaultDocuments.length === 0 && <option disabled>No documents in your vault</option>}
                      {vaultDocuments.map(vDoc => (
                        <option key={vDoc.id} value={vDoc.id}>{vDoc.file_name} ({(vDoc.size_bytes / 1024).toFixed(1)} KB)</option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Additional Notes */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-100 pb-2 text-gray-900">Additional Notes</h3>
          <textarea 
            name="notes" 
            rows={3} 
            placeholder="Any additional information you want to provide to the operator..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-blue-500"
          ></textarea>
        </section>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg disabled:opacity-50 transition-colors shadow-sm"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}
