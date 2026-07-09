'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveProfileLocation } from '@/app/actions/location'
import { toast } from 'sonner'

export default function LocationCard({ initialLocation }: { initialLocation: string | null }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(!initialLocation)
  const [isLocating, setIsLocating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [district, setDistrict] = useState('')
  const [mandal, setMandal] = useState('')
  const [village, setVillage] = useState('')

  const handleUseMyLocation = () => {
    setIsLocating(true)
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            const res = await saveProfileLocation(latitude, longitude, 'Auto-located via Browser')
            
            if (res.error) {
              toast.error(res.error)
            } else {
              toast.success('Location saved successfully!')
              setIsEditing(false)
              router.refresh()
            }
          } catch (err) {
            toast.error('An error occurred while saving location.')
          } finally {
            setIsLocating(false)
          }
        },
        (error) => {
          toast.error('Location access denied or failed. Please enter manually.')
          setIsLocating(false)
        }
      )
    } else {
      toast.error('Geolocation is not supported by your browser.')
      setIsLocating(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!district || !mandal || !village) {
      toast.error('Please fill in all manual location fields.')
      return
    }

    setIsSubmitting(true)
    try {
      const locationName = `${district}, ${mandal}, ${village}`
      const res = await saveProfileLocation(null, null, locationName)
      
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Location saved successfully!')
        setIsEditing(false)
        router.refresh()
      }
    } catch (err) {
      toast.error('An error occurred while saving location.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isEditing && initialLocation) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Your Location</h2>
          <p className="text-gray-900 font-medium flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            {initialLocation}
          </p>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Set Your Location</h2>
        {initialLocation && (
          <button 
            onClick={() => setIsEditing(false)}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Cancel
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Setting your location helps us show you relevant services and nearby centers.
      </p>

      <form onSubmit={handleManualSubmit} className="space-y-4 max-w-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input 
            type="text" 
            value={district}
            onChange={e => setDistrict(e.target.value)}
            placeholder="District (e.g. Kakinada)" 
            required
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          <input 
            type="text" 
            value={mandal}
            onChange={e => setMandal(e.target.value)}
            placeholder="Mandal (e.g. Peddapuram)" 
            required
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          <input 
            type="text" 
            value={village}
            onChange={e => setVillage(e.target.value)}
            placeholder="Village/Town" 
            required
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
        
        <div className="flex items-center gap-3 pt-2">
          <button 
            type="submit"
            disabled={isLocating || isSubmitting}
            className="bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-6 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Location'}
          </button>
          
          <span className="text-sm text-gray-400 mx-2">or</span>
          
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating || isSubmitting}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-2.5 px-4 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            {isLocating ? 'Locating...' : 'Use Browser Geolocation'}
          </button>
        </div>
      </form>
    </div>
  )
}
