import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/topics/:id
// 申請者憑 accessToken 更新自己的議題內容（僅限 PENDING / REVIEWING 狀態）
export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id: topicId } = await context.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: '請求 body 必須為合法的 JSON' },
      { status: 400 },
    )
  }

  const { token, title, summary, tags, meetingDate, meetingUrl, isPublic, allowRecording } =
    (body ?? {}) as Record<string, unknown>

  if (typeof token !== 'string' || !token) {
    return NextResponse.json(
      { success: false, error: '缺少 token，無法驗證身份' },
      { status: 401 },
    )
  }

  // 查詢議題並驗證 token 歸屬
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: {
      status: true,
      participant: { select: { accessToken: true } },
    },
  })

  if (!topic) {
    return NextResponse.json(
      { success: false, error: '找不到指定議題' },
      { status: 404 },
    )
  }

  if (topic.participant.accessToken !== token) {
    return NextResponse.json(
      { success: false, error: '無權限修改此議題' },
      { status: 403 },
    )
  }

  if (!['PENDING', 'REVIEWING'].includes(topic.status)) {
    return NextResponse.json(
      { success: false, error: `議題目前狀態（${topic.status}）已進入後期，不可修改` },
      { status: 409 },
    )
  }

  // 僅更新有提供的欄位
  const updated = await prisma.topic.update({
    where: { id: topicId },
    data: {
      ...(typeof title   === 'string' && title.trim()   && { title:   title.trim()   }),
      ...(typeof summary === 'string' && summary.trim() && { summary: summary.trim() }),
      ...(Array.isArray(tags) && {
        tags: (tags as unknown[]).filter((t) => typeof t === 'string').map((t) => (t as string).trim()),
      }),
      ...(meetingDate !== undefined && {
        meetingDate: meetingDate ? new Date(meetingDate as string) : null,
      }),
      ...(meetingUrl !== undefined && {
        meetingUrl: typeof meetingUrl === 'string' && meetingUrl.trim() ? meetingUrl.trim() : null,
      }),
      ...(typeof isPublic === 'boolean' && { isPublic }),
      ...(typeof allowRecording === 'boolean' && { allowRecording }),
    },
    select: { id: true, title: true, summary: true, tags: true, meetingDate: true, meetingUrl: true, updatedAt: true },
  })

  return NextResponse.json({ success: true, data: updated })
}
