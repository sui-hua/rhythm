import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AppNav } from '@/components/app-nav'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Rhythm',
  description: '记录节奏 · 看见成长'
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col md:flex-row">
        <AppNav />
        <main className="flex-1 overflow-x-hidden px-4 py-6 md:h-screen md:overflow-y-auto md:px-8">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
      </body>
    </html>
  )
}
