"use client"

import type React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { AdminProtectedRoute } from "@/components/admin-protected-route"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const pathSegments = pathname.split("/").filter(Boolean)

  // Traditional Chinese translations for breadcrumb labels
  const translations: Record<string, string> = {
    dashboard: "儀表板",
    cards: "卡牌管理",
    pools: "卡池管理",
    shop: "商店管理",
    settings: "設定",
  }

  // Generate breadcrumbs based on path
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join("/")}`
    const isLast = index === pathSegments.length - 1
    // Use translation if available, otherwise check if it's a number (ID), or capitalize
    const title = translations[segment.toLowerCase()] || 
                  (/^\d+$/.test(segment) ? `詳情 #${segment}` : segment.charAt(0).toUpperCase() + segment.slice(1))

    return { href, title, isLast }
  })

  return (
    <AdminProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center">
                      {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                      <BreadcrumbItem>
                        {crumb.isLast ? (
                          <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.href} className="hidden md:block">
                            {crumb.title}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminProtectedRoute>
  )
}
