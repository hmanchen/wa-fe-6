"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { CaseStoreProvider } from "@/stores/case-store"
import { PlatformSidebar } from "@/components/layouts/platform-sidebar"
import { PlatformHeader } from "@/components/layouts/platform-header"

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <CaseStoreProvider>
        <PlatformSidebar />
        <SidebarInset>
          <PlatformHeader />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </SidebarInset>
      </CaseStoreProvider>
    </SidebarProvider>
  );
}
