import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import ChatBox from '@/components/ChatBox'
import { requestPayment, cancelPayment } from '@/app/actions/payments'
import ActionForm from '@/components/ActionForm'

const statusSchema = z.enum(['assigned', 'in_progress', 'completed', 'cancelled'])

export default async function OperatorRequestDetail({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: request } = await supabase
    .from('service_requests')
    .select('*, services(title), documents(*), messages(*), payments(*)')
    .eq('id', params.id)
    .single()

  if (!user) return <div className="p-8 text-center">Unauthorized</div>

  if (!request) return <div className="p-8 text-center">Request not found or access denied.</div>

  const isAssignedToMe = request.assigned_operator_id === user?.id

  const latestPayment = request.payments?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const documents = request.documents || [];
  const documentsWithUrls = await Promise.all(documents.map(async (doc: any) => {
    if (isAssignedToMe) {
      const { data } = await supabase.storage.from('service_documents').createSignedUrl(doc.storage_path, 3600);
      return { ...doc, signedUrl: data?.signedUrl }
    }
    return doc;
  }));

  async function assignToMe() {
    'use server'
    const supabaseServer = await createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    
    if (!user || user.user_metadata?.role !== 'operator') {
      return { error: "Unauthorized: Only operators can self-assign cases." }
    }

    const { error: assignError } = await supabaseServer
      .from('service_requests')
      .update({ assigned_operator_id: user.id, status: 'assigned' })
      .eq('id', params.id)
      .eq('status', 'pending')
    
    if (assignError) return { error: assignError.message }
    
    revalidatePath(`/operator/queue/${params.id}`)
  }

  async function updateStatus(formData: FormData) {
    'use server'
    
    const supabaseServer = await createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    
    if (!user || user.user_metadata?.role !== 'operator') {
      return { error: "Unauthorized: Only operators can update status." }
    }

    const result = statusSchema.safeParse(formData.get('status'))
    if (!result.success) {
      return { error: "Invalid status: " + result.error.message }
    }

    const { error: updateError } = await supabaseServer
      .from('service_requests')
      .update({ status: result.data })
      .eq('id', params.id)
      .eq('assigned_operator_id', user.id)
    
    if (updateError) return { error: updateError.message }

    revalidatePath(`/operator/queue/${params.id}`)
  }

  async function updateDocumentStatus(formData: FormData) {
    'use server'
    const docId = formData.get('doc_id') as string;
    const docStatus = formData.get('doc_status') as string;
    
    const supabaseServer = await createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    
    if (!user || user.user_metadata?.role !== 'operator') return { error: "Unauthorized" };

    const { error: updateError } = await supabaseServer
      .from('documents')
      .update({ status: docStatus })
      .eq('id', docId)
      .eq('request_id', params.id)
    
    if (updateError) return { error: updateError.message }

    revalidatePath(`/operator/queue/${params.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/operator/queue" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Queue</Link>
        
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-6 pb-6 border-b">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{request.services?.title}</h1>
              <p className="text-sm text-gray-500 mt-1">Request ID: {request.id}</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-medium text-sm uppercase">
                {request.status}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Location / Metadata</h3>
              <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-auto border">
                {JSON.stringify(request.metadata, null, 2)}
              </pre>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
              {documentsWithUrls.length === 0 ? (
                <p className="text-sm text-gray-500">No documents attached.</p>
              ) : (
                <ul className="space-y-3">
                  {documentsWithUrls.map((doc, idx) => (
                    <li key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-md border">
                      <div>
                        <p className="font-medium text-sm text-gray-800">{doc.file_name}</p>
                        <div className="mt-1 flex items-center space-x-3">
                           <span className="text-xs text-gray-500 capitalize">Status: {doc.status}</span>
                           {doc.signedUrl && (
                             <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                               View Document &rarr;
                             </a>
                           )}
                        </div>
                      </div>
                      
                      {isAssignedToMe && (
                        <ActionForm action={updateDocumentStatus} successMessage="Document status updated." className="flex gap-2">
                          <input type="hidden" name="doc_id" value={doc.id} />
                          <select name="doc_status" defaultValue={doc.status} className="text-xs px-2 py-1 border rounded-md">
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <button type="submit" className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md">
                            Update
                          </button>
                        </ActionForm>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Operator Actions</h3>
              
              {!isAssignedToMe && request.status === 'pending' ? (
                <ActionForm action={assignToMe} successMessage="Case assigned to you.">
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
                    Assign to Me
                  </button>
                </ActionForm>
              ) : isAssignedToMe ? (
                <ActionForm action={updateStatus} successMessage="Case status updated." className="flex gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                    <select name="status" defaultValue={request.status} className="px-3 py-2 border rounded-md">
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium">
                    Save Status
                  </button>
                </ActionForm>
              ) : (
                <p className="text-sm text-gray-500">This request is assigned to another operator.</p>
              )}
            </div>

            {isAssignedToMe && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Payment Management</h3>
                
                {request.payment_status === 'unpaid' || request.payment_status === 'cancelled' ? (
                  <ActionForm action={requestPayment} successMessage="Payment requested successfully." className="bg-gray-50 p-4 rounded-md border flex flex-col gap-3">
                    <input type="hidden" name="request_id" value={request.id} />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                        <input type="number" name="amount" min="1" step="0.01" required className="w-full px-3 py-2 border rounded-md" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stage / Reason</label>
                        <input type="text" name="stage" placeholder="e.g. Application Fee" required className="w-full px-3 py-2 border rounded-md" />
                      </div>
                    </div>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium w-max">
                      Request Payment
                    </button>
                  </ActionForm>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-md border flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-gray-900">Current Payment: <span className="uppercase">{request.payment_status}</span></p>
                      {latestPayment && (
                        <p className="text-xs text-gray-500 mt-1">₹{latestPayment.amount} for {latestPayment.stage}</p>
                      )}
                    </div>
                    {(request.payment_status === 'requested' || request.payment_status === 'pending') && latestPayment && (
                      <ActionForm action={cancelPayment} successMessage="Payment request cancelled.">
                        <input type="hidden" name="request_id" value={request.id} />
                        <input type="hidden" name="payment_id" value={latestPayment.id} />
                        <button type="submit" className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium">
                          Cancel Request
                        </button>
                      </ActionForm>
                    )}
                  </div>
                )}
              </div>
            )}

            {isAssignedToMe && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Case Chat</h3>
                <ChatBox 
                  requestId={request.id} 
                  initialMessages={(request.messages || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())} 
                  currentUserId={user.id} 
                  currentUserRole="operator" 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
