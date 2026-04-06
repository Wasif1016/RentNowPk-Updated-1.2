import { createClient } from '@/lib/supabase/server'
import { chatThreadChannelName } from './constants'
import type { ChatMessageDto } from '@/lib/db/chat'

export async function broadcastChatEvent(
  threadId: string,
  event: 'INSERT' | 'UPDATE' | 'THREAD_READ',
  payload: any
) {
  const supabase = await createClient()
  const channelName = chatThreadChannelName(threadId)
  
  // Create a channel and send a broadcast
  const channel = supabase.channel(channelName, {
    config: { private: true },
  })

  // We don't subscribe on server, just send and remove
  await channel.send({
    type: 'broadcast',
    event,
    payload: { payload },
  })
  
  // Note: supabase-js doesn't strictly need .unsubscribe() on server for a one-off send
  // but it's good practice to ensure it doesn't leak. 
  // However, removing the channel is better.
  await supabase.removeChannel(channel)
}

export function dtoToBroadcastPayload(dto: ChatMessageDto) {
  // The hook parseBroadcastRecord expects a specific format
  // mapped back to snake_case usually if it mimics Supabase CDC-style or similar.
  // parseBroadcastRecord expects p.record or p.payload.record
  return {
    record: {
      id: dto.id,
      thread_id: dto.threadId,
      sender_id: dto.senderId,
      content: dto.content,
      message_type: dto.messageType,
      media_url: dto.mediaUrl,
      audio_duration: dto.audioDuration,
      created_at: dto.createdAt,
      delivered_at: dto.deliveredAt,
      seen_at: dto.seenAt,
    }
  }
}
