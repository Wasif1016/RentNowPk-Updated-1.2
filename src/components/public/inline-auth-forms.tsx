'use client'

import { useActionState, useEffect } from 'react'
import { signUpAndLoginCustomerAction, type CustomerSignupState } from '@/lib/actions/customer-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { showToast } from '@/components/ui/toast'
import { Loader2 } from 'lucide-react'

export function InlineSignupForm({ 
  next, 
  onSuccess 
}: { 
  next: string, 
  onSuccess?: (redirectTo: string) => void 
}) {
  const [state, action, pending] = useActionState(signUpAndLoginCustomerAction, null)

  useEffect(() => {
    if (state?.ok && state.redirectTo) {
      showToast('Account Created', { 
        description: 'You have been logged in automatically.',
        type: 'success'
      })
      onSuccess?.(state.redirectTo)
    } else if (state && !state.ok && state.formError) {
      showToast('Sign up failed', { 
        description: state.formError, 
        type: 'error' 
      })
    }
  }, [state, onSuccess])

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      
      <div className="space-y-1.5 text-left">
        <Label className="text-[10px] font-black uppercase tracking-widest text-[#0B1B3D]/50">Full Name</Label>
        <Input 
          name="fullName" 
          placeholder="e.g. Ali Ahmed" 
          className="rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] h-12 font-bold bg-[#F8F9FA]"
          required 
        />
        {state && !state.ok && state.fieldErrors.fullName && (
          <p className="text-[10px] text-red-600 font-bold uppercase">{state.fieldErrors.fullName}</p>
        )}
      </div>

      <div className="space-y-1.5 text-left">
        <Label className="text-[10px] font-black uppercase tracking-widest text-[#0B1B3D]/50">Email Address</Label>
        <Input 
          type="email" 
          name="email" 
          placeholder="name@example.com"
          className="rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] h-12 font-bold bg-[#F8F9FA]"
          required 
        />
        {state && !state.ok && state.fieldErrors.email && (
          <p className="text-[10px] text-red-600 font-bold uppercase">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-1.5 text-left">
        <Label className="text-[10px] font-black uppercase tracking-widest text-[#0B1B3D]/50">Password</Label>
        <Input 
          type="password" 
          name="password" 
          placeholder="Min 8 characters"
          className="rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] h-12 font-bold bg-[#F8F9FA]"
          required 
        />
        {state && !state.ok && state.fieldErrors.password && (
          <p className="text-[10px] text-red-600 font-bold uppercase">{state.fieldErrors.password}</p>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={pending}
        className="w-full bg-[#0B1B3D] text-white font-black h-12 rounded-none border-2 border-[#0B1B3D] shadow-[4px_4px_0px_0px_#F8991D] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#F8991D] transition-all uppercase italic"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account & Continue'}
      </Button>
    </form>
  )
}

import { loginAction } from '@/lib/actions/auth'

export function InlineLoginForm({ 
  next, 
  onSuccess 
}: { 
  next: string, 
  onSuccess?: (redirectTo: string) => void 
}) {
  const [state, action, pending] = useActionState(loginAction, null)

  useEffect(() => {
    if (state?.success && state.data.redirectTo) {
      showToast('Welcome Back', { type: 'success' })
      onSuccess?.(state.data.redirectTo)
    } else if (state && !state.success && state.error) {
      showToast('Login failed', { 
        description: state.error, 
        type: 'error' 
      })
    }
  }, [state, onSuccess])

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      
      <div className="space-y-1.5 text-left">
        <Label className="text-[10px] font-black uppercase tracking-widest text-[#0B1B3D]/50">Email Address</Label>
        <Input 
          type="email" 
          name="email" 
          className="rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] h-12 font-bold bg-[#F8F9FA]"
          required 
        />
      </div>

      <div className="space-y-1.5 text-left">
        <div className="flex justify-between items-center">
          <Label className="text-[10px] font-black uppercase tracking-widest text-[#0B1B3D]/50">Password</Label>
        </div>
        <Input 
          type="password" 
          name="password" 
          className="rounded-none border-2 border-[#0B1B3D]/10 focus:border-[#0B1B3D] h-12 font-bold bg-[#F8F9FA]"
          required 
        />
      </div>

      <Button 
        type="submit" 
        disabled={pending}
        className="w-full bg-[#0B1B3D] text-white font-black h-12 rounded-none border-2 border-[#0B1B3D] shadow-[4px_4px_0px_0px_#F8991D] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#F8991D] transition-all uppercase italic"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In & Continue'}
      </Button>
    </form>
  )
}
