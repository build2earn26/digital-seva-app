'use client'

import { useState, useActionState, useRef } from 'react'
import Link from 'next/link'
import { uploadVaultDocument } from './actions'
import { toast } from 'sonner'

export default function DocumentVaultClient({ documents, userId }: { documents: any[], userId: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleUpload = async (formData: FormData) => {
    setIsUploading(true)
    try {
      const result = await uploadVaultDocument(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Document uploaded to your vault successfully!')
        formRef.current?.reset()
      }
    } catch (e) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Link href="/citizen" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Document Vault</h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        
        {/* Upload New Document */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upload a Document</h2>
          <form ref={formRef} action={handleUpload} className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG or DOCX</p>
                </div>
                <input id="file" name="file" type="file" className="hidden" required />
              </label>
            </div>
            <button 
              type="submit" 
              disabled={isUploading}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {isUploading ? 'Uploading...' : 'Upload to Vault'}
            </button>
          </form>
        </div>

        {/* Existing Documents */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">My Stored Documents</h2>
          {documents.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-500">
              No documents stored in your vault yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate" title={doc.file_name}>{doc.file_name}</h3>
                      <p className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-xs text-gray-400">{(doc.size_bytes / 1024).toFixed(1)} KB</span>
                    {doc.signedUrl && (
                      <a 
                        href={doc.signedUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
