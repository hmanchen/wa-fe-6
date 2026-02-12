"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Bell, LogOut, Settings, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return [{ label: "Dashboard", href: "/" }]

  return segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const label =
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
    return { label, href }
  })
}

export function PlatformHeader() {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="border-border flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden
              />
            )}
            <Link
              href={crumb.href}
              className={`font-medium transition-colors hover:text-foreground ${
                i === breadcrumbs.length - 1
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {crumb.label}
            </Link>
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-5" aria-hidden />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative size-8 rounded-full"
              aria-label="Account menu"
            >
              <Avatar className="size-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  JD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="font-medium">John Doe</p>
                <p className="text-muted-foreground text-xs">
                  john.doe@wealtharchitect.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="cursor-pointer">
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
