'use client'

import { toast } from 'sonner'
import { useRef } from 'react'

export default function ActionForm({ 
  action, 
  children, 
  className, 
  successMessage 
}: { 
  action: (formData: FormData) => Promise<any>, 
  children: React.ReactNode, 
  className?: string,
  successMessage: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  
  return (
    <form 
      ref={formRef}
      className={className}
      action={async (formData) => {
        try {
          const result = await action(formData)
          if (result && result.error) {
            toast.error(result.error)
          } else {
            toast.success(successMessage)
            formRef.current?.reset()
          }
        } catch (err: any) {
          toast.error(err.message || "An error occurred processing the request.")
        }
      }}
    >
      {children}
    </form>
  )
}
