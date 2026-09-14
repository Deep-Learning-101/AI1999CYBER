import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/topics/my?token=<uuid>
// 申請者憑 accessToken 查看自己的議題（含個資與狀態歷程）
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json(
      { success: false, error: '缺少 token 參數' },
      { status: 400 },
    )
  }

  const participant = await prisma.participant.findUnique({
    where: { accessToken: token },
    select: {
      id:           true,
      nickname:     true,
      companyName:  true,
      companyEmail: true,
      topics: {
        orderBy: { createdAt: 'desc' },
        select: {
          id:          true,
          title:       true,
          summary:     true,
          tags:        true,
          meetingDate: true,
          meetingUrl:  true,
          status:      true,
          createdAt:   true,
          updatedAt:   true,
          statusLogs: {
            orderBy: { createdAt: 'asc' },
            select: {
              id:         true,
              fromStatus: true,
              toStatus:   true,
              note:       true,
              createdAt:  true,
            },
          },
        },
      },
    },
  })

  if (!participant) {
    return NextResponse.json(
      { success: false, error: '無效的 Token' },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, data: participant })
}
