import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/topics/:id/subscribe
// 訪客留 email 訂閱候選議題，排程後收通知
export async function POST(req: NextRequest, context: RouteContext) {
  const { id: topicId } = await context.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: '請求格式錯誤' }, { status: 400 })
  }

  const { email } = (body ?? {}) as Record<string, unknown>

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ success: false, error: '請提供有效的 Email' }, { status: 422 })
  }

  // 確認議題存在且尚未排程（SCHEDULED/COMPLETED/REJECTED 不受理）
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, status: true },
  })

  if (!topic) {
    return NextResponse.json({ success: false, error: '找不到此議題' }, { status: 404 })
  }

  if (['SCHEDULED', 'COMPLETED', 'REJECTED'].includes(topic.status)) {
    return NextResponse.json(
      { success: false, error: '此議題已排程或結束，無法訂閱' },
      { status: 409 },
    )
  }

  // upsert：重複訂閱不報錯，靜默成功
  await prisma.topicSubscription.upsert({
    where: { topicId_email: { topicId, email: email.trim().toLowerCase() } },
    create: { topicId, email: email.trim().toLowerCase() },
    update: {},
  })

  return NextResponse.json({ success: true, data: { message: '訂閱成功' } })
}
