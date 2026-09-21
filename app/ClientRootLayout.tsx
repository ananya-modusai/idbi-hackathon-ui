"use client"

// modus-ui (IDBI RM Workspace): this is a self-contained demo build reusing the
// insolvency-ui design system. No auth gate or insolvency shell — screens render
// their own IDBI shell.
export function ClientRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
