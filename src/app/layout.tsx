import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Deep Learning 101 線上聚會',
  description: 'Deep Learning 101 社群議題徵集與線上聚會追蹤平台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-indigo-600 text-lg">
              <span className="text-xl">🧠</span>
              Deep Learning 101
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-gray-600 hover:text-indigo-600 transition-colors">
                聚會看板
              </Link>
              <Link
                href="/submit"
                className="btn-primary text-xs px-3 py-1.5"
              >
                ＋ 提交議題
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
          {children}
        </main>

        <footer className="border-t border-gray-200 bg-white mt-auto">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <a
              href="https://deep-learning-101.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-500 transition-colors"
            >
              © {new Date().getFullYear()} Deep Learning 101
            </a>
            <div className="flex gap-4">
              <Link href="/track" className="hover:text-indigo-500 transition-colors">
                查詢進度
              </Link>
              <Link href="/edit" className="hover:text-indigo-500 transition-colors">
                編輯申請
              </Link>
              <Link href="/submit" className="hover:text-indigo-500 transition-colors">
                提交議題
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
