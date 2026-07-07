import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ChatBox from '@/components/ChatBox'
import { completeMockPayment, cancelPayment } from '@/app/actions/payments'
import ActionForm from '@/components/ActionForm'

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: request } = await supabase
    .from('service_requests')
    .select('*, services(title, description), documents(*), messages(*), payments(*)')
    .eq('id', params.id)
    .single()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-8 text-center">Unauthorized</div>

  if (!request) return <div className="p-8 text-center">Case not found or access denied.</div>

  const documents = request.documents || [];
  
  // Generate signed URLs for documents (valid for 1 hour)
  const documentsWithUrls = await Promise.all(documents.map(async (doc: any) => {
    const { data } = await supabase.storage.from('service_documents').createSignedUrl(doc.storage_path, 3600);
    return { ...doc, signedUrl: data?.signedUrl }
  }));

  const messages = (request.messages || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const latestPayment = request.payments?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/citizen/cases" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Cases</Link>
        
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{request.services?.title}</h1>
              <p className="text-sm text-gray-500 mt-1">ID: {request.id}</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium text-sm">
              {request.status.toUpperCase()}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 border-t pt-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Application Details</h3>
              <dl className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><dt>Date Applied</dt><dd>{new Date(request.created_at).toLocaleDateString()}</dd></div>
                <div className="flex justify-between"><dt>Payment Status</dt><dd>{request.payment_status}</dd></div>
              </dl>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Metadata / Location</h3>
              <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-auto">
                {JSON.stringify(request.metadata, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Case Chat</h3>
            <ChatBox 
              requestId={request.id} 
              initialMessages={messages} 
              currentUserId={user.id} 
                        currentUserRole="citizen"

            />
          </div>
          
          <div className="mt-6 border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Status</h3>
            
            {request.payment_status === 'requested' || request.payment_status === 'pending' ? (
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="font-medium text-blue-900">Payment Required</h4>
                  {latestPayment && <p className="text-sm text-blue-700 mt-1">₹{latestPayment.amount} for {latestPayment.stage}</p>}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {latestPayment && (
                    <>
                      <ActionForm action={cancelPayment} successMessage="Payment request cancelled." className="flex-1 sm:flex-none">
                        <input type="hidden" name="request_id" value={request.id} />
                        <input type="hidden" name="payment_id" value={latestPayment.id} />
                        <button type="submit" className="w-full px-4 py-2 bg-white text-gray-700 border hover:bg-gray-50 rounded-md text-sm font-medium">
                          Cancel
                        </button>
                      </ActionForm>
                      <ActionForm action={completeMockPayment} successMessage="Payment simulated successfully." className="flex-1 sm:flex-none">
                        <input type="hidden" name="request_id" value={request.id} />
                        <input type="hidden" name="payment_id" value={latestPayment.id} />
                        <button type="submit" className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm">
                          Simulate Payment
                        </button>
                      </ActionForm>
                    </>
                  )}
                </div>
              </div>
            ) : request.payment_status === 'paid' ? (
              <div className="p-4 bg-green-50 border border-green-100 rounded-md flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-800 text-sm font-medium">Payment Completed</span>
                {latestPayment && <span className="text-green-600 text-sm ml-2">(₹{latestPayment.amount} for {latestPayment.stage})</span>}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pending payments for this case.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
