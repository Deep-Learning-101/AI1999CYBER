'use client'

import Link from 'next/link'
import { STATUS_CONFIG, tagColorClass } from '@/lib/status'
import type { TopicStatus } from '@prisma/client'

export interface TopicCardData {
  id: string
  title: string
  summary: string
  tags: string[]
  meetingDate: string | null
  meetingUrl: string | null
  isPublic: boolean
  allowRecording: boolean
  status: TopicStatus
  nickname: string
}

export function TopicCard({ topic }: { topic: TopicCardData }) {
  const cfg = STATUS_CONFIG[topic.status]
  const date = topic.meetingDate
    ? new Date(topic.meetingDate).toLocaleDateString('zh-TW', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 p-5">
      {/* 狀態 + 日期 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badgeClass}`}>
          {cfg.label}
        </span>
        {date && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <CalendarIcon />
            {date}
          </span>
        )}
      </div>

      {/* 標題 + 摘要 */}
      <div>
        <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">
          {topic.title}
        </h3>
        <p className="mt-1 text-sm text-gray-600 line-clamp-3">{topic.summary}</p>
      </div>

      {/* 標籤 */}
      {topic.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topic.tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tagColorClass(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 底部：提交者 + 錄影標籤 + 會議連結 */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <UserIcon />
          {topic.nickname}
        </span>
        <div className="flex items-center gap-2">
          {topic.allowRecording && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              📹 可觀看錄影
            </span>
          )}
          {topic.isPublic && topic.meetingUrl ? (
            <Link
              href={topic.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              <LinkIcon />
              加入聚會
            </Link>
          ) : topic.isPublic ? (
            <span className="text-xs text-gray-400">連結待定</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-1 text-xs text-gray-400 border border-gray-200">
              🔒 私人聚會
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

// ── 小型 SVG 圖示（避免引入額外套件） ──────────────────────────────
function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}
