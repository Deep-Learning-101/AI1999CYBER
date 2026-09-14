import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fireWebhook } from '@/lib/gas-webhook'
import { isValidStatus } from '@/lib/validators'
import type { TopicStatus } from '@prisma/client'

// 管理員 Key 驗證
function isAuthorized(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key')
  const secret = process.env.ADMIN_SECRET_KEY
  if (!secret) {
    console.error('[Admin] ADMIN_SECRET_KEY 未設定')
    return false
  }
  return key === secret
}

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: '未授權，請提供有效的 x-admin-key' },
      { status: 401 },
    )
  }

  const { id: topicId } = await context.params

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

  const { status: newStatus, note, meetingDate, meetingUrl } = (body ?? {}) as Record<string, unknown>

  if (!isValidStatus(newStatus)) {
    return NextResponse.json(
      {
        success: false,
        error: `status 欄位無效，允許值：PENDING | REVIEWING | APPROVED | SCHEDULED | COMPLETED | REJECTED`,
      },
      { status: 422 },
    )
  }

  // 讀取現有議題（含申請者 Email 以便通知）
  const existing = await prisma.topic.findUnique({
    where: { id: topicId },
    select: {
      id:     true,
      title:  true,
      status: true,
      subscriptions: { select: { email: true } },
      participant: {
        select: { nickname: true, companyEmail: true, accessToken: true },
      },
    },
  })

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '找不到指定議題' },
      { status: 404 },
    )
  }

  const fromStatus: TopicStatus = existing.status

  // 若狀態未改變，直接回傳（避免產生無意義的 StatusLog）
  if (fromStatus === newStatus) {
    return NextResponse.json({
      success: true,
      data: { message: '狀態未變更', status: fromStatus },
    })
  }

  // 更新狀態並寫入歷程（transaction）
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.topic.update({
        where: { id: topicId },
        data: {
          status: newStatus as TopicStatus,
          ...(meetingDate !== undefined && {
            meetingDate: meetingDate ? new Date(meetingDate as string) : null,
          }),
          ...(meetingUrl !== undefined && {
            meetingUrl: typeof meetingUrl === 'string' && meetingUrl.trim() ? meetingUrl.trim() : null,
          }),
        },
        select: { id: true, title: true, status: true, meetingDate: true, meetingUrl: true, updatedAt: true },
      })

      await tx.statusLog.create({
        data: {
          topicId,
          fromStatus,
          toStatus: newStatus as TopicStatus,
          note: typeof note === 'string' ? note.trim() : null,
        },
      })

      return t
    })

    // 非同步觸發 GAS Webhook 通知申請者
    const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get('host')}`
    // 排程時一併通知已訂閱的訪客
    const subscriberEmails = (newStatus === 'SCHEDULED')
      ? existing.subscriptions.map((s) => s.email)
      : undefined

    fireWebhook({
      event:           'status_updated',
      topicId:         existing.id,
      topicTitle:      existing.title,
      nickname:        existing.participant.nickname,
      companyEmail:    existing.participant.companyEmail,
      accessToken:     existing.participant.accessToken,
      status:          newStatus as TopicStatus,
      trackUrl:        `${baseUrl}/track?token=${existing.participant.accessToken}`,
      meetingDate:     updated.meetingDate?.toISOString() ?? null,
      meetingUrl:      updated.meetingUrl ?? null,
      subscriberEmails,
    })

    return NextResponse.json({
      success: true,
      data: {
        id:        updated.id,
        status:    updated.status,
        updatedAt: updated.updatedAt,
        message:   '狀態更新成功，已觸發通知',
      },
    })
  } catch (err) {
    console.error('[PATCH /api/admin/topics/[id]/status] DB 錯誤:', err)
    return NextResponse.json(
      { success: false, error: '更新失敗，請稍後重試' },
      { status: 500 },
    )
  }
}
