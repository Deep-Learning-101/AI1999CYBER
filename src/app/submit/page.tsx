import { TopicForm } from '@/components/TopicForm'

export const metadata = { title: '提交議題 | Deep Learning 101 線上聚會' }

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">提交聚會議題</h1>
        <p className="mt-1 text-sm text-gray-500">
          填寫您希望在 Deep Learning 101 線上聚會中討論的議題。提交後您將收到一封含有
          <strong>專屬 Access Token</strong> 的信件，可隨時回來追蹤進度或修改申請。
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <TopicForm mode="submit" />
      </div>

      <p className="text-xs text-gray-400 text-center">
        您的公司名稱與信箱僅供 Deep Learning 101 核心成員審核使用，不會公開顯示。
      </p>
    </div>
  )
}
