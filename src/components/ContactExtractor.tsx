import type { QualifiedLead } from '@/lib/types'
import { formatPhoneNumber, cn } from '@/lib/utils'
import { Phone, Mail, MessageCircle, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface ContactExtractorProps {
  lead: QualifiedLead
  className?: string
}

export default function ContactExtractor({ lead, className }: ContactExtractorProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const contacts = [
    { type: 'phone', value: lead.phone, icon: Phone, label: 'Phone' },
    { type: 'email', value: lead.email, icon: Mail, label: 'Email' },
    { type: 'whatsapp', value: lead.whatsapp, icon: MessageCircle, label: 'WhatsApp' },
  ].filter(c => c.value)

  const handleCopy = (value: string, type: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(type)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (contacts.length === 0) {
    return (
      <div className={cn('text-center py-4', className)}>
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-2">
          <Phone className="w-5 h-5 text-gray-600" />
        </div>
        <p className="text-sm text-gray-500">No contact info extracted yet</p>
        <p className="text-[10px] text-gray-600 mt-1">Contact Extractor agent will find phone/email/WhatsApp from conversations</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {contacts.map(({ type, value, icon: Icon, label }) => (
        <div
          key={type}
          className="flex items-center justify-between bg-gray-900/50 border border-gray-800 rounded-lg px-3 py-2"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
              <p className="text-sm text-white">
                {type === 'phone' || type === 'whatsapp' ? formatPhoneNumber(value) : value}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleCopy(value!, type)}
            className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            {copiedField === type ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
