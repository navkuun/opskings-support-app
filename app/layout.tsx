import type { Metadata } from "next"
import { Geist_Mono, Anybody } from "next/font/google"
import "./globals.css"
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast"
import { RiZeroProvider } from "./zero-provider"

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${anybody.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className={`${anybody.className} antialiased`}>
        <ToastProvider>
          <AnchoredToastProvider>
            <RiZeroProvider>{children}</RiZeroProvider>
          </AnchoredToastProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
