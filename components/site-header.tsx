import { UserButton } from "@/components/auth/user-button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header className="bg-background flex h-(--header-height) shrink-0 items-center gap-3 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="text-sm font-semibold tracking-wide">OpsKings Support</div>
      <div className="ml-auto">
        <UserButton />
      </div>
    </header>
  )
}

