import type { TopicStatus } from '@prisma/client'

interface WebhookTopicPayload {
  event: 'topic_submitted' | 'status_updated'
  topicId: string
  topicTitle: string
  nickname: string
  companyEmail: string
  accessToken?: string
  status?: TopicStatus
  editUrl?: string
  trackUrl?: string
  meetingDate?: string | null
  meetingUrl?: string | null
  subscriberEmails?: string[]
}

// 狀態中文對照
const STATUS_LABEL: Record<TopicStatus, string> = {
  PENDING:   '等待審核',
  REVIEWING: '審核中',
  APPROVED:  '已核准',
  SCHEDULED: '已排入議程',
  COMPLETED: '已完成',
  REJECTED:  '已拒絕',
}

/**
 * 非同步觸發 GAS Webhook，不阻塞主回應。
 * 任何網路錯誤僅記錄 log，不向使用者拋出。
 */
export function fireWebhook(payload: WebhookTopicPayload): void {
  const url = process.env.GAS_WEBHOOK_URL
  if (!url) {
    console.warn('[GAS] GAS_WEBHOOK_URL 未設定，略過 Webhook 觸發')
    return
  }

  const body = {
    ...payload,
    statusLabel: payload.status ? STATUS_LABEL[payload.status] : undefined,
    timestamp: new Date().toISOString(),
  }

  // fire-and-forget：不 await，不阻塞 API 回應
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text()
        console.error(`[GAS] Webhook 回應錯誤 ${res.status}: ${text}`)
      }
    })
    .catch((err) => {
      console.error('[GAS] Webhook 發送失敗:', err)
    })
}
