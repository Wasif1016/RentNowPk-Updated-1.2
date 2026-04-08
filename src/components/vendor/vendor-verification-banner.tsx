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
          'mx-6 lg:mx-12 mt-8 flex flex-col gap-4 bg-white border-4 border-[#0B1B3D] px-6 py-5 rounded-sm shadow-[8px_8px_0_rgba(11,27,61,0.05)]',
          'sm:flex-row sm:items-center sm:justify-between relative overflow-hidden'
        )}
        role="status"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F5A623]" />
        <div className="flex items-start gap-4">
          <div className="bg-[#0B1B3D]/5 p-2 rounded-sm border-2 border-[#0B1B3D] shrink-0">
             <Clock className="h-5 w-5 text-[#0B1B3D]" strokeWidth={3} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase text-[#0B1B3D] tracking-[0.2em] leading-none mb-1.5 mt-0.5">Application Pending</p>
            <p className="text-[10px] font-bold text-[#0B1B3D]/50 uppercase tracking-tight max-w-md">
              Your business credentials are being manually verified. Expect a status update within <span className="text-[#0B1B3D]">24 hours</span>.
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
            'mx-6 lg:mx-12 mt-8 flex flex-col gap-6 bg-[#0B1B3D] border-4 border-[#0B1B3D] px-8 py-6 rounded-sm shadow-[8px_8px_0_#F5A623]',
            'sm:flex-row sm:items-center sm:justify-between relative overflow-hidden'
          )}
        >
          <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.05] pointer-events-none -mr-10 -mt-10" 
               style={{ backgroundImage: 'repeating-linear-gradient(45deg, #F5A623, #F5A623 2px, transparent 2px, transparent 15px)' }} />
          
          <div className="flex items-start gap-5 relative z-10">
            <div className="bg-[#F5A623] p-2.5 rounded-sm border-2 border-[#0B1B3D] shrink-0 rotate-2 shadow-lg">
               <AlertCircle className="h-6 w-6 text-[#0B1B3D]" strokeWidth={3} />
            </div>
            <div>
              <p className="text-[13px] font-black uppercase text-white tracking-[0.25em] leading-none mb-2 mt-1">Activate Business Account</p>
              <p className="text-[10px] font-bold text-[#F5A623] uppercase tracking-widest opacity-80 decoration-[#F5A623]/30 underline underline-offset-4 decoration-2">
                Legal verification required for vehicle deployment.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="shrink-0 bg-[#F5A623] text-[#0B1B3D] hover:bg-white transition-all text-[11px] font-black uppercase tracking-[0.2em] h-12 px-8 rounded-sm shadow-[4px_4px_0_rgba(255,255,255,0.2)] hover:translate-y-1 hover:shadow-none"
            onClick={() => setDialogOpen(true)}
          >
            Initiate Verification
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
          'mx-6 lg:mx-12 mt-8 flex flex-col gap-6 bg-white border-4 border-red-600 px-8 py-6 rounded-sm shadow-[8px_8px_0_rgba(220,38,38,0.1)]',
          'sm:flex-row sm:items-start sm:justify-between relative'
        )}
        role="alert"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
        <div className="flex items-start gap-5">
          <div className="bg-red-50 p-2.5 rounded-sm border-2 border-red-600 shrink-0">
             <XCircle className="h-6 w-6 text-red-600" strokeWidth={3} />
          </div>
          <div className="space-y-2">
            <p className="text-[13px] font-black uppercase text-red-600 tracking-[0.2em] leading-none mt-1">Verification Rejected</p>
            {statusNote ? (
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight bg-red-50 p-2 border border-red-100 rounded-sm italic">
                Reason: &quot;{statusNote}&quot;
              </p>
            ) : (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                Your submitted documents did not meet our verification criteria.
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          className="shrink-0 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all text-[11px] font-black uppercase tracking-[0.2em] h-12 px-8 rounded-sm shadow-[4px_4px_0_rgba(220,38,38,0.1)] hover:translate-y-1 hover:shadow-none bg-white"
          onClick={() => setDialogOpen(true)}
        >
          Resolve Discrepancies
        </Button>
      </div>
      <VerificationWizardDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
