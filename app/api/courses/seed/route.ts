import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, requireAdmin } from '@/lib/auth-middleware'

const SEED_COURSES = [
  {
    title: 'Basic English Fundamentals',
    description:
      'Learn the basics of English including pronunciation, simple greetings, and basic vocabulary.',
    minCefrLevel: 'A1',
    maxCefrLevel: 'A1',
    instructorName: 'Sarah Johnson',
    duration: 20,
    learningOutcomes: [
      'Alphabet and pronunciation',
      'Basic greetings',
      'Numbers and colors',
      'Simple nouns and verbs',
    ],
  },
  {
    title: 'Elementary English Communication',
    description:
      'Develop your ability to communicate in simple sentences and understand basic conversations.',
    minCefrLevel: 'A2',
    maxCefrLevel: 'A2',
    instructorName: 'Michael Smith',
    duration: 30,
    learningOutcomes: [
      'Present simple tense',
      'Personal information questions',
      'Food and drink vocabulary',
      'Basic dialogues',
    ],
  },
  {
    title: 'Intermediate English Conversation',
    description:
      'Improve your conversational skills and ability to discuss familiar topics in more detail.',
    minCefrLevel: 'B1',
    maxCefrLevel: 'B1',
    instructorName: 'Emma Wilson',
    duration: 40,
    learningOutcomes: [
      'Past and present tenses',
      'Expressing opinions',
      'Descriptive language',
      'Telephone conversations',
    ],
  },
  {
    title: 'Upper Intermediate Business English',
    description:
      'Master professional English for business communication, meetings, and presentations.',
    minCefrLevel: 'B2',
    maxCefrLevel: 'B2',
    instructorName: 'David Brown',
    duration: 45,
    learningOutcomes: [
      'Business vocabulary',
      'Email writing',
      'Presentation skills',
      'Meeting discussions',
    ],
  },
  {
    title: 'Advanced English Literature and Writing',
    description:
      'Explore literature, improve advanced writing skills, and master complex language structures.',
    minCefrLevel: 'C1',
    maxCefrLevel: 'C1',
    instructorName: 'Jennifer Davis',
    duration: 50,
    learningOutcomes: [
      'Literary analysis',
      'Academic writing',
      'Advanced grammar',
      'Essay composition',
    ],
  },
  {
    title: 'Proficiency English Mastery',
    description:
      'Achieve mastery of English with advanced topics, nuances, and cultural understanding.',
    minCefrLevel: 'C2',
    maxCefrLevel: 'C2',
    instructorName: 'Robert Taylor',
    duration: 60,
    learningOutcomes: [
      'Idiomatic expressions',
      'Debate and argumentation',
      'Specialized vocabulary',
      'Native-level fluency',
    ],
  },
]

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingCount = await prisma.course.count()
    if (existingCount > 0) {
      return NextResponse.json(
        { message: 'Courses already exist', count: existingCount },
        { status: 200 }
      )
    }

    for (const course of SEED_COURSES) {
      await prisma.course.create({
        data: {
          ...course,
          createdById: user.id,
          content: { chapters: [] },
        },
      })
    }

    return NextResponse.json({
      message: 'Courses seeded successfully',
      count: SEED_COURSES.length,
    })
  } catch (error) {
    console.error('Failed to seed courses:', error)
    return NextResponse.json(
      { error: 'Failed to seed courses' },
      { status: 500 }
    )
  }
}
