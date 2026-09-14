'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { TopicCard, type TopicCardData } from './TopicCard'
import { SubscribeButton } from './SubscribeButton'
import { STATUS_CONFIG, tagColorClass } from '@/lib/status'
import type { TopicStatus } from '@prisma/client'

export interface CandidateTopicData {
  id: string
  title: string
  summary: string
  tags: string[]
  status: TopicStatus
  nickname: string
}

interface HomeClientProps {
  topics: TopicCardData[]
  candidates: CandidateTopicData[]
}

export function HomeClient({ topics, candidates }: HomeClientProps) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // 收集已確認聚會的所有標籤
  const allTags = useMemo(
    () => [...new Set(topics.flatMap((t) => t.tags))].sort(),
    [topics],
  )

  // 前端篩選（僅針對已確認聚會）
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return topics.filter((t) => {
      const matchTag  = activeTag ? t.tags.includes(activeTag) : true
      const matchText = q
        ? t.title.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.nickname.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        : true
      return matchTag && matchText
    })
  }, [topics, query, activeTag])

  return (
    <div className="space-y-10">

      {/* ── 已確認聚會 ──────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">近期已排定的聚會</h2>
          <span className="rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5">
            {topics.length} 場
          </span>
        </div>

        {topics.length > 0 ? (
          <>
            {/* 搜尋與篩選 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜尋議題標題、摘要或提交者..."
                  className="input-base pl-9"
                />
              </div>
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-gray-500 shrink-0">標籤篩選：</span>
                  <button
                    onClick={() => setActiveTag(null)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors
                      ${activeTag === null ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    全部
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors
                        ${activeTag === tag ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filtered.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm">找不到符合條件的聚會</p>
                <button onClick={() => { setQuery(''); setActiveTag(null) }}
                  className="mt-2 text-indigo-500 text-xs hover:underline">
                  清除篩選
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 space-y-3 bg-white rounded-xl border border-gray-200">
            <p className="text-4xl">📭</p>
            <p className="text-gray-500 text-sm">目前尚無已確認的聚會</p>
            <Link href="/submit" className="btn-primary inline-flex text-xs">
              成為第一位提交者
            </Link>
          </div>
        )}
      </section>

      {/* ── 候選議題 ──────────────────────────────────────────────── */}
      {candidates.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">候選中的議題</h2>
            <span className="rounded-full bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5">
              {candidates.length} 則
            </span>
            <span className="text-xs text-gray-400">審核通過後將安排聚會</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((c) => (
              <CandidateCard key={c.id} topic={c} />
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center pt-1">
            對以上議題有興趣？
            <Link href="/submit" className="text-indigo-500 hover:underline ml-1">
              提交你的相關議題
            </Link>
            ，讓更多人關注這個主題 🙌
          </p>
        </section>
      )}
    </div>
  )
}

// ── 候選卡片（精簡版，無聚會日期/連結） ─────────────────────────────
function CandidateCard({ topic }: { topic: CandidateTopicData }) {
  const cfg = STATUS_CONFIG[topic.status]

  return (
    <article className="bg-white rounded-xl border border-dashed border-gray-200 p-4 flex flex-col gap-2.5 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badgeClass}`}>
          {cfg.label}
        </span>
        <span className="text-xs text-gray-400">{topic.nickname}</span>
      </div>

      <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
        {topic.title}
      </h3>

      <p className="text-xs text-gray-500 line-clamp-2">{topic.summary}</p>

      {topic.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {topic.tags.map((tag) => (
            <span key={tag}
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${tagColorClass(tag)}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-dashed border-gray-100">
        <SubscribeButton topicId={topic.id} />
      </div>
    </article>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
