"use client"

import * as React from "react"

const DEFAULT_BREAKPOINT_PX = 768

export function useIsMobile(breakpointPx: number = DEFAULT_BREAKPOINT_PX) {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const query = `(max-width: ${Math.max(0, Math.floor(breakpointPx) - 1)}px)`
    const mediaQuery = window.matchMedia(query)

    const update = () => setIsMobile(mediaQuery.matches)
    update()

    mediaQuery.addEventListener("change", update)
    return () => mediaQuery.removeEventListener("change", update)
  }, [breakpointPx])

  return isMobile
}
