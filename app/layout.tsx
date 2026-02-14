import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'TOMS - Tourism Management System',
  description: 'Safar Shomal Rakam Tourism Management System',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
