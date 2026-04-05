"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { type DashboardNavItem, isDashboardNavActive } from "./dashboard-nav"

export type DashboardShellUser = {
  email: string
  fullName: string
  avatarUrl: string | null
}

export type DashboardShellProps = {
  navItems: DashboardNavItem[]
  sidebarUserName: string
  user: DashboardShellUser
  children: React.ReactNode
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function DashboardShell({
  navItems,
  sidebarUserName,
  user,
  children,
}: DashboardShellProps) {
  const pathname = usePathname() ?? ""

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-2 py-2">
              <Avatar size="sm" className="size-8 ring-1 ring-sidebar-border">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback>{initials(sidebarUserName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {sidebarUserName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/70">
                  {user.email}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const active = isDashboardNavActive(pathname, item.href)
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.label}
                        >
                          <Link href={item.href} prefetch>
                            <HugeiconsIcon
                              icon={item.icon}
                              strokeWidth={2}
                              className="shrink-0"
                            />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-h-0 flex-1 overflow-hidden">
          {/* Mobile only: open navigation drawer (sheet). Desktop uses SidebarRail / ⌘/Ctrl+B. */}
          <header className="flex h-14 shrink-0 items-center border-b border-border bg-background px-4 md:hidden">
            <SidebarTrigger className="-ml-1" />
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
