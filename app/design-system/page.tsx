import type { Metadata } from "next"

import { DesignSystemClient } from "./design-system-client"

export const metadata: Metadata = {
  title: "Design System",
  description: "Internal design system showcase for UI atoms, fragments, and patterns.",
}

export default function Page() {
  return <DesignSystemClient />
}
