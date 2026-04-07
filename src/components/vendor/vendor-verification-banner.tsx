'use client'

import { useState } from 'react'
import type { VendorVerificationBannerMode } from '@/lib/vendor/verification-ui'
import { Button } from '@/components/ui/button'
import { VerificationWizardDialog } from '@/components/vendor/verification-wizard-dialog'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

type VendorVerificationBannerProps = {
  mode: VendorVerificationBannerMode
  statusNote: string | null
}

export function VendorVerificationBanner({
  mode,
  statusNote,
}: VendorVerificationBannerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  if (mode === 'hidden') return null

  if (mode === 'under_review') {
    return (
      <div
        className={cn(
          'mx-6 lg:mx-8 mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm shadow-sm',
          'sm:flex-row sm:items-center sm:justify-between'
        )}
        role="status"
      >
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Verification in progress</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              We received your documents and will notify you within 24 hours.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'needs_verification') {
    return (
      <>
        <div
          className={cn(
            'mx-6 lg:mx-8 mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm shadow-sm',
            'sm:flex-row sm:items-center sm:justify-between'
          )}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Verify your business</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Submit your CNIC and photos to go live on RentNowPk.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="shrink-0 rounded-xl"
            onClick={() => setDialogOpen(true)}
          >
            Start verification
          </Button>
        </div>
        <VerificationWizardDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    )
  }

  // rejected
  return (
    <>
      <div
        className={cn(
          'mx-6 lg:mx-8 mt-6 flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm shadow-sm',
          'sm:flex-row sm:items-start sm:justify-between'
        )}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Verification needs attention</p>
            {statusNote ? (
              <p className="text-muted-foreground text-xs">{statusNote}</p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Please submit your documents again so we can review your business.
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 rounded-xl"
          onClick={() => setDialogOpen(true)}
        >
          Resubmit documents
        </Button>
      </div>
      <VerificationWizardDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
