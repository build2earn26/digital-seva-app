'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  request_id: string
  sender_id: string
  content: string
  created_at: string
}

export default function ChatBox({
  requestId,
  initialMessages,
  currentUserId,
    currentUserRole,
}: {
  requestId: string
  initialMessages: Message[]
  currentUserId: string
    currentUserRole: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`case-chat-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('request_id', requestId)
            .order('created_at', { ascending: true })

          if (data && !error) {
            setMessages(data)
          }
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId, supabase])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setIsSending(true)
    const { error } = await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: currentUserId,
      content: content.trim(),
    })

    if (error) {
      alert('Failed to send message: ' + error.message)
    } else {
      setContent('')
    }
    setIsSending(false)
  }

  return (
    <div className="flex flex-col h-[400px] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-500 mt-4">No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-gray-500 mb-1 px-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div
                className={`px-4 py-2 rounded-2xl max-w-[85%] ${
                  isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t bg-gray-50 flex gap-2 items-center">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          disabled={isSending}
          className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <button
          type="submit"
          disabled={isSending || !content.trim()}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-full text-sm font-medium transition-colors"
        >
          {isSending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
