import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { ClientRootLayout } from "./ClientRootLayout"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "modus ai",
  description: "Your application description",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geistSans.variable} suppressHydrationWarning>
        <Providers>
          <ClientRootLayout>{children}</ClientRootLayout>
        </Providers>
      </body>
    </html>
  )
}