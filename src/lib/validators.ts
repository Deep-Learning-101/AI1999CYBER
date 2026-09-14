// 簡易欄位校驗工具，避免引入額外 schema 驗證套件

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string }

export function validateTopicSubmission(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, message: '請求 body 必須為 JSON 物件' }
  }

  const b = body as Record<string, unknown>

  const requiredStrings: [string, string][] = [
    ['nickname',     '暱稱'],
    ['companyName',  '公司名稱'],
    ['companyEmail', '公司信箱'],
    ['title',        '議題標題'],
    ['summary',      '問題摘要'],
  ]

  for (const [field, label] of requiredStrings) {
    if (typeof b[field] !== 'string' || (b[field] as string).trim() === '') {
      return { ok: false, message: `${label}（${field}）為必填欄位` }
    }
  }

  // 信箱格式
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test((b.companyEmail as string).trim())) {
    return { ok: false, message: '公司信箱格式不正確' }
  }

  // 標籤陣列（選填，若有則須為字串陣列）
  if (b.tags !== undefined) {
    if (
      !Array.isArray(b.tags) ||
      (b.tags as unknown[]).some((t) => typeof t !== 'string')
    ) {
      return { ok: false, message: 'tags 必須為字串陣列' }
    }
  }

  // 聚會日期（選填，若有則須為合法 ISO 日期字串）
  if (b.meetingDate !== undefined && b.meetingDate !== null) {
    if (typeof b.meetingDate !== 'string' || isNaN(Date.parse(b.meetingDate))) {
      return { ok: false, message: 'meetingDate 必須為合法的 ISO 日期字串' }
    }
  }

  // 會議連結（選填，若有則須以 http 開頭）
  if (b.meetingUrl !== undefined && b.meetingUrl !== null) {
    if (
      typeof b.meetingUrl !== 'string' ||
      !/^https?:\/\/.+/.test(b.meetingUrl.trim())
    ) {
      return { ok: false, message: 'meetingUrl 必須為合法的 http(s) URL' }
    }
  }

  return { ok: true }
}

export const VALID_STATUSES = [
  'PENDING',
  'REVIEWING',
  'APPROVED',
  'SCHEDULED',
  'COMPLETED',
  'REJECTED',
] as const

export type ValidStatus = (typeof VALID_STATUSES)[number]

export function isValidStatus(value: unknown): value is ValidStatus {
  return VALID_STATUSES.includes(value as ValidStatus)
}
