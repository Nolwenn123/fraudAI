"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ArrowLeftRight,
  AlertTriangle,
  FileCode2,
  Settings,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react"

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Alerts", href: "/alerts", icon: AlertTriangle },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "API", href: "/api-docs", icon: FileCode2 },
  { name: "Settings", href: "/settings", icon: Settings },
]


export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">Fraude AI</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Main
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          )
        })}

      </nav>

      {/* Status */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-sidebar-foreground">System Status</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">All systems operational</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Response time: 124ms</p>
        </div>
      </div>
    </aside>
  )
}
