import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 公開端點：僅回傳已核准以上的議題，嚴格隱藏個資
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      where: {
        status: {
          in: ['APPROVED', 'SCHEDULED', 'COMPLETED'],
        },
      },
      orderBy: [
        { meetingDate: 'asc' },
        { createdAt: 'desc' },
      ],
      select: {
        id:             true,
        title:          true,
        summary:        true,
        tags:           true,
        meetingDate:    true,
        meetingUrl:     true,
        isPublic:       true,
        allowRecording: true,
        status:         true,
        createdAt:      true,
        // 只取暱稱，不取 companyName / companyEmail / accessToken
        participant: {
          select: { nickname: true },
        },
      },
    })

    // 展平 participant，讓回傳結構更扁平
    const data = topics.map(({ participant, ...t }) => ({
      ...t,
      nickname: participant.nickname,
    }))

    return NextResponse.json({ success: true, data }, { headers: CORS_HEADERS })
  } catch (err) {
    console.error('[GET /api/topics/public] DB 錯誤:', err)
    return NextResponse.json(
      { success: false, error: '讀取失敗，請稍後重試' },
      { status: 500 },
    )
  }
}
