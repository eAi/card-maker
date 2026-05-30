import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Greeting Card Maker',
  description: 'Create printable greeting cards with custom images and text',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-inter antialiased">
        {children}
      </body>
    </html>
  )
}
