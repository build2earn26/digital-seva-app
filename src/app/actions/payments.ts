'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestPayment(formData: FormData) {
  const requestId = formData.get('request_id') as string
  const amount = parseFloat(formData.get('amount') as string)
  const stage = formData.get('stage') as string
  
  if (!requestId || isNaN(amount) || amount <= 0 || !stage) {
    return { error: "Invalid payment request parameters" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.user_metadata?.role !== 'operator') {
    return { error: "Unauthorized" }
  }

  const { data: request } = await supabase
    .from('service_requests')
    .select('payment_status, assigned_operator_id')
    .eq('id', requestId)
    .single()

  if (!request || request.assigned_operator_id !== user.id) {
    return { error: "Unauthorized or request not found" }
  }

  if (request.payment_status !== 'unpaid' && request.payment_status !== 'cancelled') {
    return { error: `Cannot request payment when status is ${request.payment_status}` }
  }

  const adminClient = createAdminClient()

  const { data: payment, error: paymentError } = await adminClient
    .from('payments')
    .insert({
      request_id: requestId,
      stage,
      amount,
      status: 'pending'
    })
    .select('id')
    .single()

  if (paymentError) return { error: "Failed to create payment record" }

  const { error: reqError } = await adminClient
    .from('service_requests')
    .update({ payment_status: 'requested' })
    .eq('id', requestId)

  if (reqError) return { error: "Failed to update request status" }

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'payment_requested',
    target_type: 'service_requests',
    target_id: requestId,
    metadata: { payment_id: payment.id, amount, stage, prior_status: request.payment_status, new_status: 'requested' }
  })

  revalidatePath(`/operator/queue/${requestId}`)
}

export async function completeMockPayment(formData: FormData) {
  const paymentId = formData.get('payment_id') as string
  const requestId = formData.get('request_id') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'citizen') {
    return { error: "Unauthorized" }
  }

  const { data: request } = await supabase
    .from('service_requests')
    .select('payment_status, citizen_id')
    .eq('id', requestId)
    .single()

  if (!request || request.citizen_id !== user.id) {
    return { error: "Unauthorized or request not found" }
  }

  if (request.payment_status !== 'requested' && request.payment_status !== 'pending') {
    return { error: `Cannot pay when status is ${request.payment_status}` }
  }

  const adminClient = createAdminClient()

  await adminClient
    .from('payments')
    .update({ status: 'succeeded' })
    .eq('id', paymentId)

  await adminClient
    .from('service_requests')
    .update({ payment_status: 'paid' })
    .eq('id', requestId)

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'payment_completed',
    target_type: 'service_requests',
    target_id: requestId,
    metadata: { payment_id: paymentId, prior_status: request.payment_status, new_status: 'paid' }
  })

  revalidatePath(`/citizen/cases/${requestId}`)
}

export async function cancelPayment(formData: FormData) {
  const paymentId = formData.get('payment_id') as string
  const requestId = formData.get('request_id') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "Unauthorized" }

  const role = user.user_metadata?.role

  const { data: request } = await supabase
    .from('service_requests')
    .select('payment_status, citizen_id, assigned_operator_id')
    .eq('id', requestId)
    .single()

  if (!request) return { error: "Request not found" }

  if (role === 'citizen' && request.citizen_id !== user.id) {
    return { error: "Unauthorized" }
  }
  if (role === 'operator' && request.assigned_operator_id !== user.id) {
    return { error: "Unauthorized" }
  }

  if (request.payment_status !== 'requested' && request.payment_status !== 'pending') {
    return { error: `Cannot cancel payment when status is ${request.payment_status}` }
  }

  const adminClient = createAdminClient()

  await adminClient
    .from('payments')
    .update({ status: 'failed' })
    .eq('id', paymentId)

  await adminClient
    .from('service_requests')
    .update({ payment_status: 'cancelled' })
    .eq('id', requestId)

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: 'payment_cancelled',
    target_type: 'service_requests',
    target_id: requestId,
    metadata: { payment_id: paymentId, prior_status: request.payment_status, new_status: 'cancelled', cancelled_by: role }
  })

  if (role === 'citizen') {
    revalidatePath(`/citizen/cases/${requestId}`)
  } else {
    revalidatePath(`/operator/queue/${requestId}`)
  }
}
