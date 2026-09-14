'use client'

import { useState, useCallback } from 'react'
import { STATUS_CONFIG, tagColorClass } from '@/lib/status'
import type { TopicStatus } from '@prisma/client'

// ── 型別 ──────────────────────────────────────────────────────────
interface AdminTopic {
  id: string
  title: string
  summary: string
  tags: string[]
  meetingDate: string | null
  meetingUrl: string | null
  isPublic: boolean
  allowRecording: boolean
  preferredWeekdays: number[]
  status: TopicStatus
  createdAt: string
  participant: {
    nickname: string
    companyName: string
    companyEmail: string
  }
  statusLogs: { note: string | null; createdAt: string }[]
}

const ALL_STATUSES: TopicStatus[] = [
  'PENDING', 'REVIEWING', 'APPROVED', 'SCHEDULED', 'COMPLETED', 'REJECTED',
]

// ── 主元件 ────────────────────────────────────────────────────────
export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [topics, setTopics] = useState<AdminTopic[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<TopicStatus | 'ALL'>('ALL')

  // ── 登入 ────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setAuthError('')
    const res = await fetch('/api/admin/topics', {
      headers: { 'x-admin-key': adminKey },
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok || !json.success) {
      setAuthError('Admin Key 錯誤，請重新輸入')
      return
    }
    setTopics(json.data)
    setAuthed(true)
  }

  // ── 重新整理列表 ─────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    const res = await fetch('/api/admin/topics', {
      headers: { 'x-admin-key': adminKey },
    })
    const json = await res.json()
    if (json.success) setTopics(json.data)
  }, [adminKey])

  // ── 未登入畫面 ───────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="max-w-sm mx-auto py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">管理員登入</h1>
        <form onSubmit={handleLogin} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div>
            <label className="label-base">Admin Secret Key</label>
            <input
              type="password"
              className="input-base font-mono"
              placeholder="請輸入 ADMIN_SECRET_KEY"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
            />
          </div>
          {authError && (
            <p className="text-sm text-red-600">{authError}</p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '驗證中...' : '進入後台'}
          </button>
        </form>
      </div>
    )
  }

  // ── 篩選 ────────────────────────────────────────────────────────
  const displayed = filterStatus === 'ALL'
    ? topics
    : topics.filter((t) => t.status === filterStatus)

  return (
    <div className="space-y-6">
      {/* 頁首 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理後台</h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {topics.length} 筆議題</p>
        </div>
        <button onClick={refresh} className="btn-secondary text-xs">
          ↻ 重新整理
        </button>
      </div>

      {/* 狀態篩選 */}
      <div className="flex flex-wrap gap-2">
        <FilterChip label={`全部 (${topics.length})`} active={filterStatus === 'ALL'}
          onClick={() => setFilterStatus('ALL')} />
        {ALL_STATUSES.map((s) => {
          const count = topics.filter((t) => t.status === s).length
          return count > 0 ? (
            <FilterChip
              key={s}
              label={`${STATUS_CONFIG[s].label} (${count})`}
              active={filterStatus === s}
              onClick={() => setFilterStatus(s)}
            />
          ) : null
        })}
      </div>

      {/* 議題列表 */}
      {displayed.length === 0 ? (
        <p className="text-center text-gray-400 py-16">沒有符合條件的議題</p>
      ) : (
        <div className="space-y-3">
          {displayed.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              adminKey={adminKey}
              onUpdated={refresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── 議題列 ────────────────────────────────────────────────────────
function TopicRow({
  topic,
  adminKey,
  onUpdated,
}: {
  topic: AdminTopic
  adminKey: string
  onUpdated: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [newStatus, setNewStatus] = useState<TopicStatus>(topic.status)
  const [note, setNote] = useState('')
  const [meetingDate, setMeetingDate] = useState(
    topic.meetingDate ? new Date(topic.meetingDate).toISOString().slice(0, 16) : ''
  )
  const [meetingUrl, setMeetingUrl] = useState(topic.meetingUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const cfg = STATUS_CONFIG[topic.status]
  const needsMeetingInfo = newStatus === 'SCHEDULED' || newStatus === 'COMPLETED'

  async function handleDelete() {
    if (!confirm(`確定要刪除「${topic.title}」？此操作無法復原。`)) return
    const res = await fetch(`/api/admin/topics/${topic.id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey },
    })
    const json = await res.json()
    if (json.success) onUpdated()
    else alert(`刪除失敗：${json.error}`)
  }

  async function handleUpdate() {
    setSaving(true)
    setMsg('')
    const res = await fetch(`/api/admin/topics/${topic.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({
        status: newStatus,
        note,
        ...(needsMeetingInfo && {
          meetingDate: meetingDate || null,
          meetingUrl:  meetingUrl.trim() || null,
        }),
      }),
    })
    const json = await res.json()
    setSaving(false)
    if (json.success) {
      setMsg('✓ 已更新')
      setNote('')
      onUpdated()
    } else {
      setMsg(`✗ ${json.error}`)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 摘要列 */}
      <div className="flex items-stretch">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors min-w-0"
        >
          <span className={`mt-0.5 shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{topic.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {topic.participant.nickname}・{topic.participant.companyName}・
              <span className="font-mono">{topic.participant.companyEmail}</span>
            </p>
          </div>
          <span className="text-xs text-gray-400 shrink-0 mt-0.5">
            {new Date(topic.createdAt).toLocaleDateString('zh-TW')}
          </span>
          <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
        </button>
        <button
          onClick={handleDelete}
          title="刪除議題"
          className="px-4 border-l border-gray-100 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors text-lg"
        >
          ✕
        </button>
      </div>

      {/* 展開詳情 */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {/* 摘要 */}
          <p className="text-sm text-gray-700">{topic.summary}</p>

          {/* 標籤 */}
          {topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topic.tags.map((tag) => (
                <span key={tag} className={`rounded-full px-2 py-0.5 text-xs font-medium ${tagColorClass(tag)}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 聚會資訊 */}
          {(topic.meetingDate || topic.meetingUrl) && (
            <div className="text-sm text-gray-600 flex flex-wrap gap-4">
              {topic.meetingDate && (
                <span>📅 {new Date(topic.meetingDate).toLocaleString('zh-TW')}</span>
              )}
              {topic.meetingUrl && (
                <a href={topic.meetingUrl} target="_blank" rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline">
                  🔗 {topic.meetingUrl}
                </a>
              )}
            </div>
          )}

          {/* 偏好聚會日 */}
          {topic.preferredWeekdays.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-500 shrink-0">申請者偏好：</span>
              {topic.preferredWeekdays.map((d) => (
                <span key={d} className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 font-medium">
                  {['', '週一', '週二', '週三', '週四', '週五'][d]}
                </span>
              ))}
              <span className="text-gray-400 ml-1">晚上 8 點</span>
            </div>
          )}

          {/* 參與設定 */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-1 font-medium ${
              topic.isPublic
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {topic.isPublic ? '🔓 開放參與' : '🔒 私人聚會'}
            </span>
            <span className={`rounded-full px-2.5 py-1 font-medium ${
              topic.allowRecording
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {topic.allowRecording ? '📹 同意錄影' : '🚫 不錄影'}
            </span>
          </div>

          {/* 更新狀態 */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600">更新狀態</p>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
                    ${newStatus === s
                      ? STATUS_CONFIG[s].badgeClass + ' ring-2 ring-offset-1 ring-indigo-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
            {/* 選 SCHEDULED / COMPLETED 時顯示聚會欄位 */}
            {needsMeetingInfo && (
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="label-base text-xs">聚會日期時間</label>
                  <input
                    type="datetime-local"
                    className="input-base text-sm"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-base text-xs">線上會議連結</label>
                  <input
                    type="url"
                    className="input-base text-sm"
                    placeholder="https://meet.google.com/..."
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                  />
                </div>
              </div>
            )}
            <input
              type="text"
              className="input-base text-sm"
              placeholder="管理員備註（選填，會顯示在申請者進度頁）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpdate}
                disabled={saving || newStatus === topic.status}
                className="btn-primary text-xs px-4 py-1.5 disabled:opacity-40"
              >
                {saving ? '儲存中...' : '確認更新'}
              </button>
              {msg && (
                <span className={`text-xs font-medium ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {msg}
                </span>
              )}
              {newStatus === topic.status && !msg && (
                <span className="text-xs text-gray-400">（狀態未變更）</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 小元件 ────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
        ${active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
    >
      {label}
    </button>
  )
}
