'use client'

import { ChatMessageDto } from '@/lib/db/chat'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { Check, X, Car, Calendar, Info } from 'lucide-react'
import { acceptOfferFromChat, rejectOfferFromChat } from '@/lib/actions/booking-offers'
import { toast } from 'sonner'
import { useState } from 'react'

interface OfferMessageProps {
  message: ChatMessageDto
  currentUserId: string
}

export function OfferMessage({ message, currentUserId }: OfferMessageProps) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const offer = message.offer

  if (!offer) return null

  const isPending = offer.status === 'PENDING'
  const isAccepted = offer.status === 'ACCEPTED'
  const isRejected = offer.status === 'REJECTED'
  
  // Recipient is the one who didn't send the offer
  const isRecipient = offer.senderId !== currentUserId

  async function handleAccept() {
    if (!offer) return
    setLoading('accept')
    try {
      const res = await acceptOfferFromChat(offer.id)
      if (res.ok) {
        toast.success('Offer accepted! Booking updated.')
      } else {
        toast.error(res.error)
      }
    } catch (err) {
      toast.error('Failed to accept offer')
    } finally {
      setLoading(null)
    }
  }

  async function handleReject() {
    if (!offer) return
    setLoading('reject')
    try {
      const res = await rejectOfferFromChat(offer.id)
      if (res.ok) {
        toast.success('Offer declined.')
      } else {
        toast.error(res.error)
      }
    } catch (err) {
      toast.error('Failed to reject offer')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className={cn("w-full max-w-[280px] overflow-hidden shadow-sm border", 
      isAccepted ? "border-green-500/50 bg-green-50/10" : 
      isRejected ? "border-red-500/50 bg-red-50/10" : 
      "border-amber-500/30 bg-amber-50/5")}>
      <CardHeader className="p-3 pb-2 space-y-1">
        <div className="flex items-center justify-between">
          <Badge variant={isAccepted ? "default" : isRejected ? "destructive" : "secondary"} className="text-[9px] h-4 uppercase font-bold tracking-wider px-1">
            {offer.status}
          </Badge>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
             <Calendar className="w-3 h-3" />
             Negotiation
          </div>
        </div>
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Car className="w-4 h-4 text-amber-600" />
          {offer.vehicleName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-1.5 rounded bg-muted/50">
            <p className="text-muted-foreground text-[9px] uppercase font-medium">Per Day</p>
            <p className="font-bold text-foreground">{formatCurrency(offer.pricePerDay)}</p>
          </div>
          <div className="p-1.5 rounded bg-muted/50">
            <p className="text-muted-foreground text-[9px] uppercase font-medium">Total</p>
            <p className="font-bold text-foreground">{formatCurrency(offer.totalPrice)}</p>
          </div>
        </div>
        
        {offer.note && (
          <div className="bg-amber-50/30 p-2 rounded text-[11px] text-amber-900 flex gap-2 border border-amber-100/50 dark:text-amber-200">
            <Info className="w-3 h-3 mt-0.5 shrink-0 opacity-70" />
            <p className="italic">"{offer.note}"</p>
          </div>
        )}
      </CardContent>
      
      {isPending && isRecipient && (
        <CardFooter className="p-3 pt-0 flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 bg-green-600 hover:bg-green-700 h-7 text-[11px] font-medium"
            onClick={handleAccept}
            disabled={!!loading}
          >
            {loading === 'accept' ? 'Updating...' : <><Check className="w-3 h-3 mr-1" /> Accept</>}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 h-7 text-[11px] font-medium text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
            onClick={handleReject}
            disabled={!!loading}
          >
             {loading === 'reject' ? '...' : <><X className="w-3 h-3 mr-1" /> Decline</>}
          </Button>
        </CardFooter>
      )}
      
      {(isAccepted || isRejected) && (
        <CardFooter className="p-2 pt-0 justify-center">
          <p className="text-[10px] text-muted-foreground italic">
            Offer {offer.status.toLowerCase()} by {isRecipient ? 'you' : 'the other party'}
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
