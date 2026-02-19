"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Bell, LogOut, Settings } from "lucide-react"

import { useAuth } from "@/lib/auth-provider"
import { useCase } from "@/hooks/use-cases"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getBreadcrumbs(pathname: string, caseDisplayName?: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return [{ label: "Dashboard", href: "/" }]

  return segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")

    // If this segment is a UUID and we have a display name, use it
    let label: string
    if (UUID_REGEX.test(segment) && caseDisplayName) {
      label = caseDisplayName
    } else {
      label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
    }

    return { label, href }
  })
}

/** Build a display name like "Hariprasad & Sindu" from case data */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCaseDisplayName(caseData: any): string {
  const primaryName = caseData?.clientName || ""
  const pi = caseData?.clientPersonalInfo
  if (pi?.partnerFirstName) {
    // Use first names: "Primary & Spouse"
    const primaryFirst = pi.firstName || primaryName.split(" ")[0] || primaryName
    const spouseFirst = pi.partnerFirstName
    return `${primaryFirst} & ${spouseFirst}`
  }
  return primaryName
}

/** Extract a case ID (UUID) from the pathname if present (e.g. /cases/<uuid>/discovery) */
function extractCaseId(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean)
  const casesIndex = segments.indexOf("cases")
  if (casesIndex >= 0 && casesIndex + 1 < segments.length) {
    const maybeId = segments[casesIndex + 1]
    if (UUID_REGEX.test(maybeId)) return maybeId
  }
  return null
}

function getUserInitials(email?: string | null): string {
  if (!email) return "?"
  return email.charAt(0).toUpperCase()
}

export function PlatformHeader() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Fetch case data when on a case-specific page so breadcrumbs show client name
  const caseId = extractCaseId(pathname)
  const { data: caseData } = useCase(caseId)
  const caseDisplayName = getCaseDisplayName(caseData)
  const breadcrumbs = getBreadcrumbs(pathname, caseDisplayName)

  const displayName = user?.user_metadata?.full_name || user?.email || "User"
  const displayEmail = user?.email || ""
  const initials = getUserInitials(user?.email)

  return (
    <header className="border-border flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 !h-4" />
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
                <AvatarImage src="" alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="font-medium">{displayName}</p>
                <p className="text-muted-foreground text-xs">
                  {displayEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
