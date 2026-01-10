import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Tickets",
  description: "View and track tickets.",
}

export const runtime = "nodejs"

export default function Page() {
  redirect("/tickets")
}
