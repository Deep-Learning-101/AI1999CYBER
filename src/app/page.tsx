import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { HomeClient } from '@/components/HomeClient'
import type { TopicCardData } from '@/components/TopicCard'
import type { CandidateTopicData } from '@/components/HomeClient'

export const revalidate = 60 // ISR：每 60 秒重新驗證

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

export default async function HomePage() {
  const [topics, candidates] = await Promise.all([
    getPublicTopics(),
    getCandidateTopics(),
  ])

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center space-y-3 py-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          <a
            href="https://deep-learning-101.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 transition-colors"
          >
            Deep Learning 101
          </a>
        </h1>
        <a
          href="https://deep-learning-101.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-600 text-sm transition-colors"
        >
          deep-learning-101.github.io
        </a>
        <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
          社群提案、共同討論，聚焦在 AI／深度學習實務中遇到的技術難題與產業觀察。
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/submit" className="btn-primary">
            ＋ 提交我的議題
          </Link>
          <Link href="/track" className="btn-secondary">
            查詢申請進度
          </Link>
        </div>
      </section>

      <HomeClient topics={topics} candidates={candidates} />
    </div>
  )
}
