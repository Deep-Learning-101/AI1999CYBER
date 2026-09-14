import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function isAuthorized(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key')
  const secret = process.env.ADMIN_SECRET_KEY
  if (!secret) return false
  return key === secret
}

interface RouteContext {
  params: Promise<{ id: string }>
}

// DELETE /api/admin/topics/:id — 刪除議題（Cascade 連帶刪除 StatusLog）
export async function DELETE(req: NextRequest, context: RouteContext) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: '未授權' }, { status: 401 })
  }

  const { id: topicId } = await context.params

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, title: true },
  })

  if (!topic) {
    return NextResponse.json({ success: false, error: '找不到指定議題' }, { status: 404 })
  }

  await prisma.topic.delete({ where: { id: topicId } })

  return NextResponse.json({
    success: true,
    data: { message: `議題「${topic.title}」已刪除` },
  })
}
