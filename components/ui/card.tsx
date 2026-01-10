import * as React from "react"

import { cn } from "@/lib/utils"

type CardVariant = "default" | "group"

function Card({
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm"; variant?: CardVariant }) {
  const base =
    variant === "group"
      ? "bg-transparent text-card-foreground gap-4 py-4 text-xs/relaxed data-[size=sm]:gap-3 data-[size=sm]:py-3 group/card flex flex-col"
      : "ring-foreground/10 bg-card text-card-foreground gap-4 overflow-hidden rounded-lg py-4 text-xs/relaxed ring-1 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg group/card flex flex-col"

  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(base, className)}
      {...props}
    />
  )
}

function CardGroup({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-group"
      className={cn(
        "relative rounded-lg border border-border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 z-10 select-none" aria-hidden="true">
        <div className="absolute left-[-7px] top-[-7px] h-[14px] w-[14px] rounded-[3px] border border-border bg-card" />
        <div className="absolute right-[-7px] top-[-7px] h-[14px] w-[14px] rounded-[3px] border border-border bg-card" />
        <div className="absolute bottom-[-7px] left-[-7px] h-[14px] w-[14px] rounded-[3px] border border-border bg-card" />
        <div className="absolute bottom-[-7px] right-[-7px] h-[14px] w-[14px] rounded-[3px] border border-border bg-card" />
      </div>
      {children}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "gap-1 rounded-t-lg px-4 group-data-[variant=group]/card:rounded-none group-data-[size=sm]/card:px-3 [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3 group/card-header @container/card-header grid auto-rows-min items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-xs/relaxed", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "rounded-b-lg px-4 group-data-[variant=group]/card:rounded-none group-data-[size=sm]/card:px-3 [.border-t]:pt-4 group-data-[size=sm]/card:[.border-t]:pt-3 flex items-center",
        className,
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardGroup,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
