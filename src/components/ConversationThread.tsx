import type { Conversation } from '@/lib/types'
import { cn, timeAgo } from '@/lib/utils'
import { Bot, User, Sparkles, Phone, Mail } from 'lucide-react'

interface ConversationThreadProps {
  conversations: Conversation[]
  className?: string
}

export default function ConversationThread({ conversations, className }: ConversationThreadProps) {
  if (conversations.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <p className="text-sm">No conversations yet</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {conversations.map((msg) => {
        const isOutbound = msg.direction === 'outbound'
        return (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2.5 animate-fade-in',
              isOutbound ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                isOutbound ? 'bg-emerald-500/20' : 'bg-gray-800'
              )}
            >
              {isOutbound ? (
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <User className="w-3.5 h-3.5 text-gray-400" />
              )}
            </div>

            {/* Message bubble */}
            <div className={cn('max-w-[75%] space-y-1', isOutbound ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'rounded-xl px-3 py-2 text-sm leading-relaxed',
                  isOutbound
                    ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20 rounded-br-sm'
                    : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm'
                )}
              >
                {msg.message_text}
              </div>

              {/* AI Analysis */}
              {msg.ai_analysis && (
                <div className="flex items-center gap-1 px-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span className="text-[10px] text-amber-400/80">{msg.ai_analysis}</span>
                </div>
              )}

              {/* Extracted contact */}
              {msg.contact_info_extracted && (
                <div className="flex items-center gap-1.5 px-1 flex-wrap">
                  <Phone className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400/80">{msg.contact_info_extracted}</span>
                </div>
              )}

              {/* Timestamp */}
              <p className={cn('text-[10px] text-gray-600 px-1', isOutbound && 'text-right')}>
                {timeAgo(msg.sent_at)}
                {msg.is_ai_generated && (
                  <span className="ml-1 text-emerald-600">· AI Generated</span>
                )}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
