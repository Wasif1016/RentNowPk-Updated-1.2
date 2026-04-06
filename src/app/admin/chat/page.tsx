import { Message01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

export default function AdminChatHubPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center bg-muted/5">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
        <HugeiconsIcon icon={Message01Icon} className="h-8 w-8 text-primary" />
      </div>
      <div className="max-w-xs flex flex-col gap-1">
        <h3 className="text-lg font-bold text-foreground">Select a thread</h3>
        <p className="text-sm text-muted-foreground font-medium underline underline-offset-4 decoration-primary/30">
          Choose a conversation from the sidebar to start monitoring or intervening.
        </p>
      </div>
    </div>
  )
}
