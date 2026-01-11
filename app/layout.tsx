import type { Metadata } from "next"
import { Geist_Mono, Anybody, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast"
import { RiZeroProvider } from "./zero-provider"

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
})  

const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "OpsKings Support",
    template: "%s | OpsKings Support",
  },
  description: "Support dashboard for OpsKings clients.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexMono.variable} ${geistMono.variable} ${anybody.variable}`}
      suppressHydrationWarning
    >
      <body className={`${ibmPlexMono.className} antialiased`}>
        <ToastProvider>
          <AnchoredToastProvider>
            <RiZeroProvider>{children}</RiZeroProvider>
          </AnchoredToastProvider>
        </ToastProvider>
      </body>
    </html>
  )
}