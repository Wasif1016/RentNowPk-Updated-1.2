'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type VehicleOption = {
  id: string
  name: string
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  vehicles: VehicleOption[]
  onSubmit: (values: {
    vehicleId: string
    pricePerDay: string
    totalPrice: string
    note: string
  }) => Promise<void>
}

export function OfferDialog({ open, onOpenChange, vehicles, onSubmit }: Props) {
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '')
  const [pricePerDay, setPricePerDay] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!vehicleId || !pricePerDay || !totalPrice) return
    setLoading(true)
    void onSubmit({ vehicleId, pricePerDay, totalPrice, note }).finally(() =>
      setLoading(false)
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Offer</DialogTitle>
          <DialogDescription>
            Customer will see this in the chat and can accept or reject.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="offer-vehicle">Vehicle</Label>
            <select
              id="offer-vehicle"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="offer-price">Price per day (PKR)</Label>
              <Input
                id="offer-price"
                type="number"
                min="1"
                placeholder="5000"
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="offer-total">Total price (PKR)</Label>
              <Input
                id="offer-total"
                type="number"
                min="1"
                placeholder="15000"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="offer-note">Note (optional)</Label>
            <Textarea
              id="offer-note"
              placeholder="Any conditions or extras…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !vehicleId || !pricePerDay || !totalPrice}
            >
              {loading ? 'Sending…' : 'Send Offer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
