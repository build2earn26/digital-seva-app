import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ChatBox from '@/components/ChatBox'
import { completeMockPayment, cancelPayment } from '@/app/actions/payments'
import ActionForm from '@/components/ActionForm'

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: request } = await supabase
    .from('service_requests')
    .select('*, services(title, description), documents(*), messages(*), payments(*)')
    .eq('id', params.id)
    .single()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-8 text-center">Unauthorized</div>

  if (!request) return <div className="p-8 text-center">Application not found or access denied.</div>

  const documents = request.documents || [];
  
  // Generate signed URLs for documents (valid for 1 hour)
  const documentsWithUrls = await Promise.all(documents.map(async (doc: any) => {
    const { data } = await supabase.storage.from('service_documents').createSignedUrl(doc.path, 3600);
    return { ...doc, signedUrl: data?.signedUrl }
  }));

  const messages = (request.messages || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const latestPayment = request.payments?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* PWA Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center space-x-3 sticky top-0 z-10">
        <Link href="/citizen/applications" className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-gray-900 truncate">App #{request.id.slice(0,8)}</h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-6">
        
        {/* Status Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{request.services?.title}</h2>
            <p className="text-sm text-gray-500 mt-1">Submitted: {new Date(request.created_at).toLocaleDateString()}</p>
          </div>
          <span className={`self-start sm:self-auto px-4 py-1.5 text-sm rounded-full font-bold uppercase tracking-wide ${
            request.status === 'completed' ? 'bg-green-100 text-green-800' :
            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            request.status === 'cancelled' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {request.status}
          </span>
        </div>

        {/* Timeline View */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Application Timeline
          </h3>
          <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
            <div className="relative pl-6">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></span>
              <h4 className="text-sm font-semibold text-gray-900">Application Submitted</h4>
              <p className="text-xs text-gray-500 mt-1">{new Date(request.created_at).toLocaleString()}</p>
            </div>
            {(request.status === 'in_progress' || request.status === 'completed') && (
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></span>
                <h4 className="text-sm font-semibold text-gray-900">Processing Started</h4>
              </div>
            )}
            {request.status === 'completed' && (
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 ring-4 ring-white"></span>
                <h4 className="text-sm font-semibold text-gray-900">Application Approved</h4>
                <p className="text-xs text-gray-500 mt-1">{new Date(request.updated_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            Payment Status
          </h3>
          
          {request.payment_status === 'requested' || request.payment_status === 'pending' ? (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h4 className="font-semibold text-orange-900">Payment Required</h4>
                {latestPayment && <p className="text-sm text-orange-800 mt-1">₹{latestPayment.amount} for {latestPayment.stage}</p>}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {latestPayment && (
                  <>
                    <ActionForm action={cancelPayment} successMessage="Cancelled" className="flex-1 sm:flex-none">
                      <input type="hidden" name="request_id" value={request.id} />
                      <input type="hidden" name="payment_id" value={latestPayment.id} />
                      <button type="submit" className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md text-sm font-medium">
                        Cancel
                      </button>
                    </ActionForm>
                    <ActionForm action={completeMockPayment} successMessage="Paid" className="flex-1 sm:flex-none">
                      <input type="hidden" name="request_id" value={request.id} />
                      <input type="hidden" name="payment_id" value={latestPayment.id} />
                      <button type="submit" className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm">
                        Pay ₹{latestPayment.amount}
                      </button>
                    </ActionForm>
                  </>
                )}
              </div>
            </div>
          ) : request.payment_status === 'paid' ? (
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <div>
                <span className="text-green-900 font-semibold block">Payment Completed</span>
                {latestPayment && <span className="text-green-700 text-sm">₹{latestPayment.amount} paid</span>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No pending payments for this application.</p>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            Attached Documents
          </h3>
          {documentsWithUrls.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {documentsWithUrls.map((doc: any) => (
                <li key={doc.id} className="py-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 truncate mr-4">{doc.file_name}</span>
                  {doc.signedUrl && (
                    <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 font-medium hover:underline whitespace-nowrap">
                      View File
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No documents attached.</p>
          )}
        </div>

        {/* Messages / Chat */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Messages</h3>
          <div className="h-80">
            <ChatBox 
              requestId={request.id} 
              initialMessages={messages} 
              currentUserId={user.id} 
              currentUserRole="citizen" 
            />
          </div>
        </div>

      </main>
    </div>
  )
}
