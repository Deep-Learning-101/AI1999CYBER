import { prisma } from '@/lib/prisma'
import { EmbedView } from '@/components/EmbedView'
import type { TopicCardData } from '@/components/TopicCard'
import type { CandidateTopicData } from '@/components/HomeClient'

export const revalidate = 60

async function getPublicTopics(): Promise<TopicCardData[]> {
  const topics = await prisma.topic.findMany({
    where: { status: { in: ['APPROVED', 'SCHEDULED', 'COMPLETED'] } },
    orderBy: [{ meetingDate: 'asc' }, { createdAt: 'desc' }],
    take: 5,
    select: {
      id: true, title: true, summary: true, tags: true,
      meetingDate: true, meetingUrl: true,
      isPublic: true, allowRecording: true,
      status: true,
      participant: { select: { nickname: true } },
    },
  })
  return topics.map(({ participant, meetingDate, ...t }) => ({
    ...t,
    nickname:    participant.nickname,
    meetingDate: meetingDate?.toISOString() ?? null,
  }))
}

async function getCandidateTopics(): Promise<CandidateTopicData[]> {
  const topics = await prisma.topic.findMany({
    where: { status: { in: ['PENDING', 'REVIEWING'] } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, summary: true, tags: true, status: true,
      participant: { select: { nickname: true } },
    },
  })
  return topics.map(({ participant, ...t }) => ({
    ...t,
    nickname: participant.nickname,
  }))
}

export default async function EmbedPage() {
  const [topics, candidates] = await Promise.all([
    getPublicTopics(),
    getCandidateTopics(),
  ])

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://1999.twman.org'

  return (
    <EmbedView
      topics={topics}
      candidates={candidates}
      baseUrl={baseUrl}
    />
  )
}
