"use client"

import { LayoutDashboard, Library, ShoppingBag, Settings, Layers, LogOut, Users, ScrollText } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  {
    title: "儀表板",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "玩家管理",
    url: "/dashboard/players",
    icon: Users,
  },
  {
    title: "卡牌管理",
    url: "/dashboard/cards",
    icon: Library,
  },
  {
    title: "卡池管理",
    url: "/dashboard/pools",
    icon: Layers,
  },
  {
    title: "商店商品",
    url: "/dashboard/shop",
    icon: ShoppingBag,
  },
  {
    title: "事件記錄",
    url: "/dashboard/event-logs",
    icon: ScrollText,
  },
  {
    title: "系統設定",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { logout } = useAuth()
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2 font-semibold">
          <span className="group-data-[collapsible=icon]:hidden">管理後台</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>管理功能</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip="登出">
              <LogOut />
              <span>登出</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
