import type { TopicStatus } from '@prisma/client'

export interface StatusConfig {
  label: string
  step: number   // -1 表示 REJECTED（終止狀態）
  badgeClass: string
}

export const STATUS_CONFIG: Record<TopicStatus, StatusConfig> = {
  PENDING:   { label: '等待審核', step: 0, badgeClass: 'bg-amber-100  text-amber-700  ring-1 ring-amber-200'  },
  REVIEWING: { label: '審核中',   step: 1, badgeClass: 'bg-blue-100   text-blue-700   ring-1 ring-blue-200'   },
  APPROVED:  { label: '已核准',   step: 2, badgeClass: 'bg-green-100  text-green-700  ring-1 ring-green-200'  },
  SCHEDULED: { label: '已排程',   step: 3, badgeClass: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200' },
  COMPLETED: { label: '已完成',   step: 3, badgeClass: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' },
  REJECTED:  { label: '已拒絕',   step: -1, badgeClass: 'bg-red-100   text-red-700    ring-1 ring-red-200'    },
}

export const TIMELINE_STEPS = [
  { status: 'PENDING'  as TopicStatus, label: '收件',     description: '申請已收到，等待審核' },
  { status: 'REVIEWING' as TopicStatus, label: '討論中',  description: '社群核心成員審查議題' },
  { status: 'APPROVED'  as TopicStatus, label: '準備中',  description: '議題已核准，規劃聚會細節' },
  { status: 'SCHEDULED' as TopicStatus, label: '已排程',  description: '聚會日期與連結已確定' },
]

// 取得目前步驟索引（0-3，-1 為 REJECTED）
export function getCurrentStep(status: TopicStatus): number {
  return STATUS_CONFIG[status].step
}

// TAG 顏色循環（Tailwind 靜態 class）
const TAG_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
]

export function tagColorClass(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0
  return TAG_PALETTE[hash % TAG_PALETTE.length]
}
