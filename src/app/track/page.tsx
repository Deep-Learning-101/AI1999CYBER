import { prisma } from '@/lib/prisma'
import { StatusTimeline } from '@/components/StatusTimeline'
import { STATUS_CONFIG, tagColorClass } from '@/lib/status'
import Link from 'next/link'
import type { TopicStatus } from '@prisma/client'

export const metadata = { title: '追蹤進度 | Deep Learning 101 線上聚會' }

interface TrackPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const { token } = await searchParams

  // ── 無 token：顯示輸入框 ────────────────────────────────────────
  if (!token) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">查詢申請進度</h1>
          <p className="mt-1 text-sm text-gray-500">
            輸入您的 Access Token 以查看議題處理進度
          </p>
        </div>
        <form
          action="/track"
          method="GET"
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4"
        >
          <div>
            <label htmlFor="token" className="label-base">Access Token</label>
            <input
              id="token" name="token" type="text" required
              className="input-base font-mono"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>
          <button type="submit" className="btn-primary w-full">查詢進度</button>
        </form>
      </div>
    )
  }

  // ── 驗證 token ──────────────────────────────────────────────────
  const participant = await prisma.participant.findUnique({
    where: { accessToken: token },
    select: {
      nickname: true,
      topics: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true, title: true, summary: true, tags: true,
          meetingDate: true, meetingUrl: true,
          status: true, createdAt: true, updatedAt: true,
          statusLogs: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true, toStatus: true, note: true, createdAt: true,
            },
          },
        },
      },
    },
  })

  if (!participant) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-3">
        <p className="text-4xl">🔐</p>
        <p className="text-gray-700 font-medium">Token 無效或已失效</p>
        <Link href="/track" className="btn-secondary inline-flex">重新輸入</Link>
      </div>
    )
  }

  const topic = participant.topics[0]
  if (!topic) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-3">
        <p className="text-4xl">📭</p>
        <p className="text-gray-700 font-medium">尚無提交的議題</p>
        <Link href="/submit" className="btn-primary inline-flex">提交議題</Link>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[topic.status as TopicStatus]
  const statusLogs = topic.statusLogs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">議題處理進度</h1>
          <p className="mt-1 text-sm text-gray-500">
            {participant.nickname} 提交的申請
          </p>
        </div>
        <Link href={`/edit?token=${token}`} className="btn-secondary text-xs shrink-0">
          編輯議題 →
        </Link>
      </div>

      {/* 議題資訊卡 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h2 className="font-semibold text-gray-900 text-base">{topic.title}</h2>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-sm text-gray-600">{topic.summary}</p>
        {topic.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topic.tags.map((tag) => (
              <span key={tag} className={`rounded-full px-2 py-0.5 text-xs font-medium ${tagColorClass(tag)}`}>
                {tag}
              </span>
            ))}
          </div>
        )}
        {topic.meetingDate && (
          <div className="flex items-center gap-4 pt-1 text-sm text-gray-500 flex-wrap">
            <span>
              📅 {new Date(topic.meetingDate).toLocaleString('zh-TW', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
            {topic.meetingUrl && (
              <a
                href={topic.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                🔗 加入會議
              </a>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400">
          提交於 {new Date(topic.createdAt).toLocaleDateString('zh-TW')}
          　最後更新 {new Date(topic.updatedAt).toLocaleDateString('zh-TW')}
        </p>
      </div>

      {/* 進度時間軸 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-6">處理時程</h3>
        <StatusTimeline
          currentStatus={topic.status as TopicStatus}
          statusLogs={statusLogs}
        />
      </div>
    </div>
  )
}
