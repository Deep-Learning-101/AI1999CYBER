'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const WEEKDAYS = [
  { label: '週一', value: 1 },
  { label: '週二', value: 2 },
  { label: '週三', value: 3 },
  { label: '週四', value: 4 },
  { label: '週五', value: 5 },
]

interface FormValues {
  nickname: string
  companyName: string
  companyEmail: string
  title: string
  summary: string
  tags: string       // 逗號分隔字串，提交前解析
  meetingDate: string
  meetingUrl: string
  isPublic: boolean
  allowRecording: boolean
  preferredWeekdays: number[]
}

interface TopicFormProps {
  /** 編輯模式：帶入現有資料與 topicId */
  initialData?: Partial<FormValues>
  topicId?: string
  accessToken?: string
  mode: 'submit' | 'edit'
}

export function TopicForm({ initialData, topicId, accessToken, mode }: TopicFormProps) {
  const router = useRouter()

  const [values, setValues] = useState<FormValues>({
    nickname:     initialData?.nickname     ?? '',
    companyName:  initialData?.companyName  ?? '',
    companyEmail: initialData?.companyEmail ?? '',
    title:        initialData?.title        ?? '',
    summary:      initialData?.summary      ?? '',
    tags:         initialData?.tags         ?? '',
    meetingDate:     initialData?.meetingDate     ?? '',
    meetingUrl:      initialData?.meetingUrl      ?? '',
    isPublic:          initialData?.isPublic          ?? true,
    allowRecording:    initialData?.allowRecording    ?? true,
    preferredWeekdays: initialData?.preferredWeekdays ?? [],
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [resultToken, setResultToken] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  function set(field: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      setErrors((err) => ({ ...err, [field]: undefined }))
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormValues, string>> = {}

    if (!values.title.trim())        newErrors.title        = '議題標題為必填'
    if (!values.summary.trim())      newErrors.summary      = '問題摘要為必填'

    if (mode === 'submit') {
      if (!values.nickname.trim())     newErrors.nickname     = '暱稱為必填'
      if (!values.companyName.trim())  newErrors.companyName  = '公司名稱為必填'
      if (!values.companyEmail.trim()) newErrors.companyEmail = '公司信箱為必填'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.companyEmail.trim()))
        newErrors.companyEmail = '信箱格式不正確'
    }

    if (values.meetingUrl && !/^https?:\/\/.+/.test(values.meetingUrl.trim()))
      newErrors.meetingUrl = '會議連結須以 http:// 或 https:// 開頭'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setStatus('loading')
    setServerError(null)

    const tags = values.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      let res: Response

      if (mode === 'submit') {
        res = await fetch('/api/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname:        values.nickname.trim(),
            companyName:     values.companyName.trim(),
            companyEmail:    values.companyEmail.trim(),
            title:           values.title.trim(),
            summary:         values.summary.trim(),
            tags,
            meetingDate:     values.meetingDate || undefined,
            meetingUrl:      values.meetingUrl.trim() || undefined,
            isPublic:          values.isPublic,
            allowRecording:    values.allowRecording,
            preferredWeekdays: values.preferredWeekdays,
          }),
        })
      } else {
        res = await fetch(`/api/topics/${topicId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token:           accessToken,
            title:           values.title.trim(),
            summary:         values.summary.trim(),
            tags,
            meetingDate:     values.meetingDate || undefined,
            meetingUrl:      values.meetingUrl.trim() || undefined,
            isPublic:        values.isPublic,
            allowRecording:  values.allowRecording,
          }),
        })
      }

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? '未知錯誤')

      if (mode === 'submit') setResultToken(json.data.accessToken)
      setStatus('success')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '發生錯誤，請稍後再試')
      setStatus('error')
    }
  }

  // ── 成功畫面 ────────────────────────────────────────────────────
  if (status === 'success' && mode === 'submit' && resultToken) {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎉</span>
          <div>
            <h2 className="font-bold text-lg text-gray-900">議題提交成功！</h2>
            <p className="text-sm text-gray-600">請查收您的信箱，我們已寄出包含編輯連結的確認信</p>
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2">
          <p className="text-xs text-gray-500 font-medium">您的專屬存取 Token（請妥善保存）</p>
          <code className="block text-sm font-mono text-indigo-700 break-all select-all">{resultToken}</code>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => router.push(`/track?token=${resultToken}`)}
            className="btn-primary"
          >
            查看進度
          </button>
          <button
            onClick={() => router.push(`/edit?token=${resultToken}`)}
            className="btn-secondary"
          >
            編輯議題
          </button>
        </div>
      </div>
    )
  }

  if (status === 'success' && mode === 'edit') {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 p-6 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <p className="text-gray-800 font-medium">議題已更新成功！</p>
      </div>
    )
  }

  // ── 表單 ────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* 提交模式才顯示個人資訊欄位 */}
      {mode === 'submit' && (
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-gray-700 mb-1">個人資訊（不公開）</legend>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="暱稱 *" error={errors.nickname}>
              <input type="text" className="input-base" placeholder="公開顯示的暱稱"
                value={values.nickname} onChange={set('nickname')} />
            </Field>
            <Field label="公司名稱 *" error={errors.companyName}>
              <input type="text" className="input-base" placeholder="您任職的公司"
                value={values.companyName} onChange={set('companyName')} />
            </Field>
          </div>
          <Field label="公司信箱 *" error={errors.companyEmail}>
            <input type="email" className="input-base" placeholder="用於接收 Access Token 信件"
              value={values.companyEmail} onChange={set('companyEmail')} />
          </Field>
        </fieldset>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 mb-1">議題內容（公開）</legend>
        <Field label="議題標題 *" error={errors.title}>
          <input type="text" className="input-base" placeholder="您希望深入討論的主題"
            value={values.title} onChange={set('title')} />
        </Field>
        <Field label="問題摘要 *" error={errors.summary}>
          <textarea rows={4} className="input-base resize-none"
            placeholder="詳細描述您遇到的問題或想探討的方向"
            value={values.summary} onChange={set('summary')} />
        </Field>
        <Field label="標籤（以逗號分隔）" error={errors.tags}>
          <input type="text" className="input-base" placeholder="例：AI, 後端, 系統設計"
            value={values.tags} onChange={set('tags')} />
        </Field>
      </fieldset>

      {/* 編輯模式才顯示聚會資訊（由管理員排程後填入） */}
      {mode === 'edit' && (
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-gray-700 mb-1">聚會資訊（管理員排程後填入）</legend>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="聚會日期" error={errors.meetingDate}>
              <input type="datetime-local" className="input-base"
                value={values.meetingDate} onChange={set('meetingDate')} />
            </Field>
            <Field label="線上會議連結" error={errors.meetingUrl}>
              <input type="url" className="input-base" placeholder="https://meet.google.com/..."
                value={values.meetingUrl} onChange={set('meetingUrl')} />
            </Field>
          </div>
        </fieldset>
      )}

      {/* 提交模式：告知申請者日期與連結由主辦方安排 */}
      {mode === 'submit' && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          📅 聚會日期與線上會議連結將由社群主辦方在議題通過審核後安排，並以 Email 通知您。
        </div>
      )}

      {/* 偏好聚會日 */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-700">
          偏好聚會日
          <span className="ml-2 text-xs font-normal text-gray-400">可複選，時間固定晚上 8 點</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map(({ label, value }) => {
            const checked = values.preferredWeekdays.includes(value)
            return (
              <label
                key={value}
                className={`flex items-center gap-1.5 cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors select-none
                  ${checked
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() =>
                    setValues((v) => ({
                      ...v,
                      preferredWeekdays: checked
                        ? v.preferredWeekdays.filter((d) => d !== value)
                        : [...v.preferredWeekdays, value].sort(),
                    }))
                  }
                />
                {checked ? '✓ ' : ''}{label}
              </label>
            )
          })}
        </div>
        {values.preferredWeekdays.length === 0 && (
          <p className="text-xs text-gray-400">未選擇代表無特別偏好</p>
        )}
      </fieldset>

      {/* 參與設定 */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-700">參與設定</legend>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            checked={values.isPublic}
            onChange={(e) => setValues((v) => ({ ...v, isPublic: e.target.checked }))}
          />
          <span className="text-sm text-gray-700">
            <span className="font-medium">開放社群成員參與</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              勾選後會議連結將公開顯示；不勾選則僅顯示「已排定」，連結不公開
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            checked={values.allowRecording}
            onChange={(e) => setValues((v) => ({ ...v, allowRecording: e.target.checked }))}
          />
          <span className="text-sm text-gray-700">
            <span className="font-medium">同意錄影供日後觀看</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              勾選後卡片上會顯示「可觀看錄影」標籤
            </span>
          </span>
        </label>
      </fieldset>

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <button type="submit" className="btn-primary w-full py-2.5" disabled={status === 'loading'}>
        {status === 'loading'
          ? '處理中...'
          : mode === 'submit' ? '提交申請' : '更新議題'}
      </button>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="label-base">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
