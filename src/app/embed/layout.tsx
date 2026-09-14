import type { ReactNode } from 'react'
import '../globals.css'

// embed 頁面跳過全站 layout，只保留 Tailwind 樣式
export default function EmbedLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="bg-transparent antialiased">
        {children}
      </body>
    </html>
  )
}
