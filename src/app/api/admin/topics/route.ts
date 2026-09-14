import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function isAuthorized(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key')
  const secret = process.env.ADMIN_SECRET_KEY
  if (!secret) return false
  return key === secret
}

// GET /api/admin/topics — 列出所有議題（含完整個資，僅管理員可存取）
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: '未授權' },
      { status: 401 },
    )
  }

  const topics = await prisma.topic.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, summary: true, tags: true,
      meetingDate: true, meetingUrl: true,
      isPublic: true, allowRecording: true, preferredWeekdays: true,
      status: true, createdAt: true, updatedAt: true,
      participant: {
        select: {
          id: true, nickname: true, companyName: true, companyEmail: true,
        },
      },
      statusLogs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { note: true, createdAt: true },
      },
    },
  })

  return NextResponse.json({ success: true, data: topics })
}
