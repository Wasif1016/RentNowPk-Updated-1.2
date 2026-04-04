'use client'

import { useMemo, useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DEFAULT_PHONE_COUNTRY,
  getPhoneCountryOptions,
} from '@/lib/phone/vendor-countries'

type PhoneCountryComboboxProps = {
  value: string
  onValueChange: (code: string) => void
  disabled?: boolean
  'aria-invalid'?: boolean
  className?: string
}

export function PhoneCountryCombobox({
  value,
  onValueChange,
  disabled,
  'aria-invalid': invalid,
  className,
}: PhoneCountryComboboxProps) {
  const [open, setOpen] = useState(false)
  const options = useMemo(() => getPhoneCountryOptions(), [])

  const selected = useMemo(() => {
    return (
      options.find((o) => o.code === value) ??
      options.find((o) => o.code === DEFAULT_PHONE_COUNTRY) ??
      options[0]
    )
  }, [options, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          disabled={disabled}
          className={cn(
            'h-9 min-w-38 shrink-0 justify-between gap-1 bg-card px-3 font-normal',
            !invalid && 'border-border',
            invalid && 'border-destructive ring-[3px] ring-destructive/20 dark:border-destructive/50',
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <span aria-hidden>{selected?.flag}</span>
            <span className="text-muted-foreground">+{selected?.dial}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 sm:w-80" align="start">
        <Command>
          <CommandInput placeholder="Search country or dial code…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {options.map((c) => (
                <CommandItem
                  key={c.code}
                  keywords={[c.label, c.code, c.dial, `+${c.dial}`]}
                  value={`${c.label} ${c.code} +${c.dial}`}
                  onSelect={() => {
                    onValueChange(c.code)
                    setOpen(false)
                  }}
                >
                  <span className="flex w-full min-w-0 items-center gap-2">
                    <span aria-hidden>{c.flag}</span>
                    <span className="min-w-0 flex-1 truncate">{c.label}</span>
                    <span className="shrink-0 text-muted-foreground">+{c.dial}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
