'use client'

import { useState } from 'react'
import Link from 'next/link'
import LocationCard from '@/components/LocationCard'

interface Service {
  id: string
  title: string
  description: string
  is_active: boolean
  is_open: boolean
  opening_time?: string
}

export default function CitizenDashboardClient({ user, services, initialLocation }: { user: any, services: Service[], initialLocation: string | null }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile-first PWA layout: Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {user.user_metadata?.full_name?.charAt(0) || 'C'}
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Digital Seva</h1>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <span>{user.user_metadata?.full_name || 'Citizen'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100">
                <div className="px-4 py-2 border-b border-gray-100 text-sm text-gray-500">
                  {user.email}
                </div>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                    Sign Out
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
          <LocationCard initialLocation={initialLocation} />

          {/* Dashboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/citizen/applications" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-center text-center space-y-2 group">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <span className="font-medium text-gray-900">My Applications</span>
            </Link>
            
            <Link href="/citizen/transactions" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-center text-center space-y-2 group">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <span className="font-medium text-gray-900">Transactions</span>
            </Link>

            <Link href="/citizen/documents" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-center text-center space-y-2 group col-span-2 md:col-span-1">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
              </div>
              <span className="font-medium text-gray-900">Document Vault</span>
            </Link>
          </div>

          {/* Search Services */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Apply for a Service</h2>
              <p className="text-sm text-gray-500">Search available government services.</p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                type="text"
                placeholder="Search services (e.g., Birth Certificate, Income...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50"
              />
            </div>

            <div className="space-y-3">
              {filteredServices.length === 0 ? (
                <div className="text-center py-6 text-gray-500">No services found matching your search.</div>
              ) : (
                filteredServices.map(service => (
                  <Link 
                    href={service.is_open ? `/citizen/services/${service.id}/apply` : '#'} 
                    key={service.id}
                    className={`block p-4 border rounded-lg transition-all ${
                      service.is_open 
                        ? 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white group' 
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-75'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-semibold ${service.is_open ? 'text-blue-700 group-hover:text-blue-800' : 'text-gray-600'}`}>
                          {service.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{service.description}</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {service.is_open ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Closed
                          </span>
                        )}
                      </div>
                    </div>
                    {!service.is_open && service.opening_time && (
                      <p className="text-xs text-orange-600 mt-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Opens: {service.opening_time}
                      </p>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
