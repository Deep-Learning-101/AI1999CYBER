'use client'

import { useState } from 'react'

export function SubscribeButton({ topicId, onSuccess }: { topicId: string; onSuccess?: () => void }) {
  const [open, setOpen]     = useState(false)
  const [email, setEmail]   = useState('')
  const [state, setState]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrMsg('')

    const res  = await fetch(`/api/topics/${topicId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const json = await res.json()

    if (json.success) {
      setState('success')
      onSuccess?.()
    } else {
      setState('error')
      setErrMsg(json.error ?? '訂閱失敗，請稍後再試')
    }
  }

  if (state === 'success') {
    return (
      <span className="text-xs text-emerald-600 font-medium">
        ✓ 已訂閱，排程後將 Email 通知您
      </span>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-indigo-500 transition-colors"
      >
        🔔 追蹤此議題
      </button>
    )
  }

  return (
    <div className="space-y-1">
      <form onSubmit={handleSubmit} className="flex gap-1.5 items-center">
        <input
          type="email"
          required
          autoFocus
          className="input-base text-xs py-1 h-7 min-w-0 flex-1"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === 'loading'}
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="btn-primary text-xs px-2.5 py-1 h-7 shrink-0"
        >
          {state === 'loading' ? '…' : '訂閱'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setState('idle'); setErrMsg('') }}
          className="text-gray-400 hover:text-gray-600 text-sm shrink-0"
        >
          ✕
        </button>
      </form>
      {state === 'error' && (
        <p className="text-xs text-red-500">{errMsg}</p>
      )}
    </div>
  )
}
