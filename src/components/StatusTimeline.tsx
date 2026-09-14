import type { TopicStatus } from '@prisma/client'
import { TIMELINE_STEPS, STATUS_CONFIG, getCurrentStep } from '@/lib/status'

interface StatusLogEntry {
  id: string
  toStatus: TopicStatus
  note: string | null
  createdAt: string
}

interface StatusTimelineProps {
  currentStatus: TopicStatus
  statusLogs: StatusLogEntry[]
}

export function StatusTimeline({ currentStatus, statusLogs }: StatusTimelineProps) {
  const currentStep = getCurrentStep(currentStatus)
  const isRejected = currentStatus === 'REJECTED'

  // 建立 toStatus → log 的對照表（取最後一筆）
  const logByStatus = Object.fromEntries(
    statusLogs.map((log) => [log.toStatus, log]),
  ) as Record<TopicStatus, StatusLogEntry | undefined>

  return (
    <div className="relative">
      {/* 垂直連接線 */}
      <div
        className="absolute left-5 top-6 bottom-6 w-0.5 bg-gray-200"
        aria-hidden="true"
      />

      <ol className="space-y-0">
        {TIMELINE_STEPS.map((step, idx) => {
          const isDone    = !isRejected && currentStep > idx
          const isCurrent = !isRejected && currentStep === idx
          const isFuture  = !isRejected && currentStep < idx
          const log       = logByStatus[step.status]

          return (
            <li key={step.status} className="relative flex gap-5 pb-8 last:pb-0">
              {/* 圓點 */}
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white
                  transition-all duration-300
                  ${isDone    ? 'border-indigo-500 bg-indigo-500'
                    : isCurrent ? 'border-indigo-500 ring-4 ring-indigo-100 animate-pulse-slow'
                    : 'border-gray-300'}"
                style={{
                  borderColor: isDone ? '#6366f1' : isCurrent ? '#6366f1' : '#d1d5db',
                  backgroundColor: isDone ? '#6366f1' : 'white',
                }}
              >
                {isDone ? (
                  <CheckIcon className="w-5 h-5 text-white" />
                ) : isCurrent ? (
                  <span className="h-3 w-3 rounded-full bg-indigo-500" />
                ) : (
                  <span className="h-3 w-3 rounded-full bg-gray-300" />
                )}
              </div>

              {/* 內容 */}
              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-semibold text-sm
                    ${isDone ? 'text-indigo-600' : isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-medium ring-1 ring-indigo-200">
                      目前狀態
                    </span>
                  )}
                  {log && (
                    <time className="text-xs text-gray-400 ml-auto">
                      {new Date(log.createdAt).toLocaleString('zh-TW', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </time>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isFuture ? 'text-gray-400' : 'text-gray-500'}`}>
                  {step.description}
                </p>
                {log?.note && (
                  <p className="mt-1.5 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 italic">
                    管理員備註：{log.note}
                  </p>
                )}
              </div>
            </li>
          )
        })}

        {/* REJECTED 終止狀態 */}
        {isRejected && (
          <li className="relative flex gap-5 pb-0">
            <div
              className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-red-500 border-red-500"
            >
              <XIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 pt-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-red-600">
                  {STATUS_CONFIG.REJECTED.label}
                </span>
                <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium ring-1 ring-red-200">
                  目前狀態
                </span>
                {logByStatus.REJECTED && (
                  <time className="text-xs text-gray-400 ml-auto">
                    {new Date(logByStatus.REJECTED.createdAt).toLocaleString('zh-TW', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </time>
                )}
              </div>
              <p className="text-xs mt-0.5 text-gray-500">申請未通過</p>
              {logByStatus.REJECTED?.note && (
                <p className="mt-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600 italic">
                  管理員備註：{logByStatus.REJECTED.note}
                </p>
              )}
            </div>
          </li>
        )}
      </ol>
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
