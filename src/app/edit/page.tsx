import { prisma } from '@/lib/prisma'
import { TopicForm } from '@/components/TopicForm'
import Link from 'next/link'

export const metadata = { title: '編輯議題 | Deep Learning 101 線上聚會' }

interface EditPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function EditPage({ searchParams }: EditPageProps) {
  const { token } = await searchParams

  // ── 無 token：顯示輸入框 ────────────────────────────────────────
  if (!token) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">編輯申請</h1>
          <p className="mt-1 text-sm text-gray-500">
            請輸入您在提交議題後收到的 Access Token
          </p>
        </div>
        <TokenInputForm redirectTo="/edit" />
      </div>
    )
  }

  // ── 驗證 token ──────────────────────────────────────────────────
  const participant = await prisma.participant.findUnique({
    where: { accessToken: token },
    select: {
      topics: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true, title: true, summary: true, tags: true,
          meetingDate: true, meetingUrl: true, status: true,
        },
      },
    },
  })

  if (!participant) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-3">
        <p className="text-4xl">🔐</p>
        <p className="text-gray-700 font-medium">Token 無效或已失效</p>
        <Link href="/edit" className="btn-secondary inline-flex">重新輸入</Link>
      </div>
    )
  }

  const topic = participant.topics[0]
  if (!topic) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-3">
        <p className="text-4xl">📭</p>
        <p className="text-gray-700 font-medium">此 Token 尚無任何議題</p>
        <Link href="/submit" className="btn-primary inline-flex">提交新議題</Link>
      </div>
    )
  }

  // 僅允許 PENDING / REVIEWING 狀態進行編輯
  const isEditable = ['PENDING', 'REVIEWING'].includes(topic.status)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">編輯議題</h1>
          <p className="mt-1 text-sm text-gray-500">修改您的議題申請內容</p>
        </div>
        <Link href={`/track?token=${token}`} className="btn-secondary text-xs shrink-0">
          查看進度 →
        </Link>
      </div>

      {!isEditable && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          議題目前狀態為「{topic.status}」，已進入審核後期，暫不開放修改。如需調整請聯繫管理員。
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {isEditable ? (
          <TopicForm
            mode="edit"
            topicId={topic.id}
            accessToken={token}
            initialData={{
              title:       topic.title,
              summary:     topic.summary,
              tags:        topic.tags.join(', '),
              meetingDate: topic.meetingDate
                ? new Date(topic.meetingDate).toISOString().slice(0, 16)
                : '',
              meetingUrl: topic.meetingUrl ?? '',
            }}
          />
        ) : (
          <div className="text-sm text-gray-500 text-center py-8">
            此議題目前無法編輯
          </div>
        )}
      </div>
    </div>
  )
}

// ── Token 輸入表單（Server Component 中的 Client Island） ─────────
function TokenInputForm({ redirectTo }: { redirectTo: string }) {
  return (
    <form
      action={redirectTo}
      method="GET"
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4"
    >
      <div>
        <label htmlFor="token" className="label-base">Access Token</label>
        <input
          id="token"
          name="token"
          type="text"
          required
          className="input-base font-mono"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
      </div>
      <button type="submit" className="btn-primary w-full">
        繼續
      </button>
    </form>
  )
}
