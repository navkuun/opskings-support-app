"use client"

import * as React from "react"
import { CommandIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { authClient } from "@/lib/auth-client"
import { isRecord } from "@/lib/type-guards"

type AppUserMeResponse = {
  userType: "internal" | "client"
  internalRole: "support_agent" | "manager" | "admin" | null
}

function parseAppUserMeResponse(value: unknown): AppUserMeResponse | null {
  if (!isRecord(value)) return null
  const userType = value.userType
  const internalRole = value.internalRole

  if (userType !== "internal" && userType !== "client") return null
  if (
    internalRole !== null &&
    internalRole !== undefined &&
    internalRole !== "support_agent" &&
    internalRole !== "manager" &&
    internalRole !== "admin"
  ) {
    return null
  }

  return { userType, internalRole: internalRole ?? null }
}

type PaletteItem = {
  value: string
  label: string
  href?: string
  shortcut?: string
  onSelect?: () => void | Promise<void>
}

type PaletteGroup = {
  value: string
  items: readonly PaletteItem[]
}

export function AppCommandPalette() {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const [open, setOpen] = React.useState(false)
  const [user, setUser] = React.useState<AppUserMeResponse | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function loadUser() {
      if (!session?.user) {
        setUser(null)
        return
      }

      try {
        const res = await fetch("/api/app-user/me", { cache: "no-store" })
        if (!res.ok) return
        const json: unknown = await res.json()
        const parsed = parseAppUserMeResponse(json)
        if (!parsed || cancelled) return
        setUser(parsed)
      } catch {
        // Ignore; palette still works with defaults.
      }
    }

    void loadUser()
    return () => {
      cancelled = true
    }
  }, [session?.user])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return
      if (!event.metaKey && !event.ctrlKey) return
      event.preventDefault()
      setOpen((prev) => !prev)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const signOut = React.useCallback(async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace("/")
          router.refresh()
        },
      },
    })
  }, [router])

  const items = React.useMemo<readonly PaletteGroup[]>(() => {
    if (user?.userType === "client") {
      return [
        {
          value: "Navigation",
          items: [
            { value: "nav:tickets", label: "Your Tickets", href: "/tickets" },
          ],
        },
        {
          value: "Actions",
          items: [
            { value: "act:new-ticket", label: "New ticket", href: "/tickets?new=1", shortcut: "⌘C" },
            { value: "act:search", label: "Search tickets", href: "/tickets?focus=search", shortcut: "/" },
            { value: "act:sign-out", label: "Sign out", onSelect: signOut },
          ],
        },
      ]
    }

    if (user?.userType === "internal") {
      return [
        {
          value: "Navigation",
          items: [
            { value: "nav:dashboard", label: "Dashboard", href: "/dashboard" },
            { value: "nav:response-time", label: "Response time", href: "/response-time" },
            { value: "nav:tickets", label: "Tickets", href: "/tickets" },
          ],
        },
        {
          value: "Actions",
          items: [
            { value: "act:new-ticket", label: "New ticket", href: "/tickets?new=1", shortcut: "⌘C" },
            { value: "act:search", label: "Search tickets", href: "/tickets?focus=search", shortcut: "/" },
            { value: "act:sign-out", label: "Sign out", onSelect: signOut },
          ],
        },
      ]
    }

    return [
      {
        value: "Navigation",
        items: [{ value: "nav:sign-in", label: "Sign in", href: "/" }],
      },
    ]
  }, [signOut, user?.userType])

  const onSelectItem = React.useCallback(
    async (item: PaletteItem) => {
      setOpen(false)

      if (item.href) {
        router.push(item.href)
        return
      }

      if (item.onSelect) {
        await item.onSelect()
      }
    },
    [router],
  )

  if (!session?.user) return null

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="!h-full !w-(--header-height) !rounded-none !border-y-0 !border-l-0 border-r-0 !border-border bg-transparent !px-0"
          />
        }
        aria-label="Open command palette"
        title="Command palette (⌘K)"
      >
        <CommandIcon aria-hidden="true" className="size-5" />
        <span className="sr-only">Open command palette</span>
      </CommandDialogTrigger>

      <CommandDialogPopup>
        <Command items={items}>
          <CommandInput placeholder="Search…" />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandList>
            {(group: PaletteGroup, index: number) => (
              <React.Fragment key={group.value}>
                <CommandGroup items={group.items}>
                  <CommandGroupLabel>{group.value}</CommandGroupLabel>
                  <CommandCollection>
                    {(item: PaletteItem) => (
                      <CommandItem
                        key={item.value}
                        value={item}
                        onClick={() => void onSelectItem(item)}
                      >
                        {item.label}
                        {item.shortcut ? (
                          <CommandShortcut>{item.shortcut}</CommandShortcut>
                        ) : null}
                      </CommandItem>
                    )}
                  </CommandCollection>
                </CommandGroup>
                {index < items.length - 1 ? <CommandSeparator /> : null}
              </React.Fragment>
            )}
          </CommandList>
          <CommandFooter>
            <div className="flex items-center gap-2">
              <span>Open</span>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center gap-2">
              <span>Select</span>
              <Kbd>↵</Kbd>
            </div>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  )
}
