'use client'

import { useEffect } from 'react'
import { SubscribeButton } from './SubscribeButton'
import { STATUS_CONFIG, tagColorClass } from '@/lib/status'
import type { TopicCardData } from './TopicCard'
import type { CandidateTopicData } from './HomeClient'

// 通知外層 GA4（postMessage 橋接，跨 origin iframe 用）
function gaEvent(event: string, params?: Record<string, string>) {
  window.parent.postMessage({ type: 'dl101_ga', event, ...params }, '*')
}

interface EmbedViewProps {
  topics:     TopicCardData[]
  candidates: CandidateTopicData[]
  baseUrl:    string
}

export function EmbedView({ topics, candidates, baseUrl }: EmbedViewProps) {
  // embed 頁面載入時記錄一次 page view
  useEffect(() => { gaEvent('embed_view') }, [])

  return (
    <div className="p-3 space-y-5 text-sm">

      {/* ── 已確認聚會 ──────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">近期已排定的聚會</span>
          <span className="rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5">
            {topics.length} 場
          </span>
        </div>

        {topics.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-6">目前尚無已確認的聚會</p>
        ) : (
          <div className="space-y-2">
            {topics.map((t) => <ConfirmedCard key={t.id} topic={t} />)}
          </div>
        )}
      </section>

      {/* ── 候選議題 ────────────────────────────────────── */}
      {candidates.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">候選中的議題</span>
            <span className="rounded-full bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5">
              {candidates.length} 則
            </span>
          </div>
          <div className="space-y-2">
            {candidates.map((c) => <CandidateCard key={c.id} topic={c} />)}
          </div>
        </section>
      )}

      {/* ── 底部連結 ────────────────────────────────────── */}
      <div className="flex gap-3 pt-1 border-t border-gray-100">
        <a
          href={`${baseUrl}/submit`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => gaEvent('embed_click_submit')}
          className="flex-1 text-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700
                     text-xs font-medium py-2 hover:bg-indigo-100 transition-colors"
        >
          ＋ 提交新議題
        </a>
        <a
          href={baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => gaEvent('embed_click_platform')}
          className="flex-1 text-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600
                     text-xs font-medium py-2 hover:bg-gray-100 transition-colors"
        >
          查看完整平台 →
        </a>
      </div>
    </div>
  )
}

// ── 已確認聚會卡片 ────────────────────────────────────────
function ConfirmedCard({ topic }: { topic: TopicCardData }) {
  const cfg = STATUS_CONFIG[topic.status]

  const dateStr = topic.meetingDate
    ? new Date(topic.meetingDate).toLocaleDateString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
      })
    : null

  return (
    <article className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badgeClass}`}>
          {cfg.label}
        </span>
        <span className="text-xs text-gray-400">{topic.nickname}</span>
      </div>

      <p className="font-semibold text-gray-900 leading-snug line-clamp-2">{topic.title}</p>
      <p className="text-xs text-gray-500 line-clamp-2">{topic.summary}</p>

      {topic.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {topic.tags.map((tag) => (
            <span key={tag} className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${tagColorClass(tag)}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {(dateStr || topic.meetingUrl) && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {dateStr && <span>📅 {dateStr}</span>}
          {topic.isPublic && topic.meetingUrl && (
            <a href={topic.meetingUrl} target="_blank" rel="noopener noreferrer"
               onClick={() => gaEvent('embed_click_meeting', { title: topic.title })}
               className="text-indigo-500 hover:underline">
              🔗 加入聚會
            </a>
          )}
          {!topic.isPublic && <span>🔒 私人聚會</span>}
          {topic.allowRecording && topic.meetingUrl && <span>📹 可錄影回放</span>}
        </div>
      )}
    </article>
  )
}

// ── 候選議題卡片 ──────────────────────────────────────────
function CandidateCard({ topic }: { topic: CandidateTopicData }) {
  const cfg = STATUS_CONFIG[topic.status]

  return (
    <article className="bg-white rounded-xl border border-dashed border-gray-200 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badgeClass}`}>
          {cfg.label}
        </span>
        <span className="text-xs text-gray-400">{topic.nickname}</span>
      </div>

      <p className="font-semibold text-gray-900 leading-snug line-clamp-2">{topic.title}</p>
      <p className="text-xs text-gray-500 line-clamp-2">{topic.summary}</p>

      {topic.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {topic.tags.map((tag) => (
            <span key={tag} className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${tagColorClass(tag)}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="pt-1 border-t border-dashed border-gray-100">
        <SubscribeButton
          topicId={topic.id}
          onSuccess={() => gaEvent('embed_subscribe', { title: topic.title })}
        />
      </div>
    </article>
  )
}
