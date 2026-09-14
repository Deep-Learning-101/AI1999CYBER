import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fireWebhook } from '@/lib/gas-webhook'
import { validateTopicSubmission } from '@/lib/validators'

export async function POST(req: NextRequest) {
  // 解析 body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: '請求 body 必須為合法的 JSON' },
      { status: 400 },
    )
  }

  // 欄位校驗
  const validation = validateTopicSubmission(body)
  if (!validation.ok) {
    return NextResponse.json(
      { success: false, error: validation.message },
      { status: 422 },
    )
  }

  const {
    nickname,
    companyName,
    companyEmail,
    title,
    summary,
    tags,
    meetingDate,
    meetingUrl,
    isPublic,
    allowRecording,
    preferredWeekdays,
  } = body as Record<string, unknown>

  // 建立 Participant + Topic（transaction 確保原子性）
  let participant: { id: string; accessToken: string; nickname: string; companyEmail: string }
  let topic: { id: string; title: string }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 若同一信箱已存在則複用（避免重複建立帳號），但仍新增議題
      const p = await tx.participant.upsert({
        where: { companyEmail: (companyEmail as string).trim().toLowerCase() },
        update: { nickname: (nickname as string).trim() },
        create: {
          nickname:     (nickname as string).trim(),
          companyName:  (companyName as string).trim(),
          companyEmail: (companyEmail as string).trim().toLowerCase(),
        },
        select: { id: true, accessToken: true, nickname: true, companyEmail: true },
      })

      const t = await tx.topic.create({
        data: {
          title:        (title as string).trim(),
          summary:      (summary as string).trim(),
          tags:         Array.isArray(tags) ? (tags as string[]).map((s) => s.trim()) : [],
          meetingDate:    meetingDate ? new Date(meetingDate as string) : null,
          meetingUrl:     meetingUrl ? (meetingUrl as string).trim() : null,
          isPublic:          typeof isPublic === 'boolean' ? isPublic : true,
          allowRecording:    typeof allowRecording === 'boolean' ? allowRecording : true,
          preferredWeekdays: Array.isArray(preferredWeekdays)
            ? (preferredWeekdays as unknown[]).filter((d) => typeof d === 'number' && d >= 1 && d <= 5) as number[]
            : [],
          participantId: p.id,
          statusLogs: {
            create: { toStatus: 'PENDING' },
          },
        },
        select: { id: true, title: true },
      })

      return { participant: p, topic: t }
    })

    participant = result.participant
    topic = result.topic
  } catch (err) {
    console.error('[POST /api/topics] DB 錯誤:', err)
    return NextResponse.json(
      { success: false, error: '儲存失敗，請稍後重試' },
      { status: 500 },
    )
  }

  // 非同步觸發 GAS Webhook（不阻塞回應）
  const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get('host')}`
  const editUrl  = `${baseUrl}/edit?token=${participant.accessToken}`
  const trackUrl = `${baseUrl}/track?token=${participant.accessToken}`

  fireWebhook({
    event:        'topic_submitted',
    topicId:      topic.id,
    topicTitle:   topic.title,
    nickname:     participant.nickname,
    companyEmail: participant.companyEmail,
    accessToken:  participant.accessToken,
    status:       'PENDING',
    editUrl,
    trackUrl,
  })

  return NextResponse.json(
    {
      success: true,
      data: {
        topicId:     topic.id,
        accessToken: participant.accessToken,
        editUrl,
        message:     '議題已提交，請查收驗證信以取得編輯連結',
      },
    },
    { status: 201 },
  )
}
