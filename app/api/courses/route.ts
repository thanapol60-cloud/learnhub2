import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Seed courses data
const seedCourses = async () => {
  const existingCourses = await prisma.course.count()

  if (existingCourses > 0) return

  const coursesData = [
    {
      title: 'Basic English Fundamentals',
      description: 'Learn the basics of English including pronunciation, simple greetings, and basic vocabulary.',
      minCefrLevel: 'A1',
      maxCefrLevel: 'A1',
      instructorName: 'Sarah Johnson',
      duration: 20,
      learningOutcomes: ['Alphabet and pronunciation', 'Basic greetings', 'Numbers and colors', 'Simple nouns and verbs'],
    },
    {
      title: 'Elementary English Communication',
      description: 'Develop your ability to communicate in simple sentences and understand basic conversations.',
      minCefrLevel: 'A2',
      maxCefrLevel: 'A2',
      instructorName: 'Michael Smith',
      duration: 30,
      learningOutcomes: ['Present simple tense', 'Personal information questions', 'Food and drink vocabulary', 'Basic dialogues'],
    },
    {
      title: 'Intermediate English Conversation',
      description: 'Improve your conversational skills and ability to discuss familiar topics in more detail.',
      minCefrLevel: 'B1',
      maxCefrLevel: 'B1',
      instructorName: 'Emma Wilson',
      duration: 40,
      learningOutcomes: ['Past and present tenses', 'Expressing opinions', 'Descriptive language', 'Telephone conversations'],
    },
    {
      title: 'Upper Intermediate Business English',
      description: 'Master professional English for business communication, meetings, and presentations.',
      minCefrLevel: 'B2',
      maxCefrLevel: 'B2',
      instructorName: 'David Brown',
      duration: 45,
      learningOutcomes: ['Business vocabulary', 'Email writing', 'Presentation skills', 'Meeting discussions'],
    },
    {
      title: 'Advanced English Literature and Writing',
      description: 'Explore literature, improve advanced writing skills, and master complex language structures.',
      minCefrLevel: 'C1',
      maxCefrLevel: 'C1',
      instructorName: 'Jennifer Davis',
      duration: 50,
      learningOutcomes: ['Literary analysis', 'Academic writing', 'Advanced grammar', 'Essay composition'],
    },
    {
      title: 'Proficiency English Mastery',
      description: 'Achieve mastery of English with advanced topics, nuances, and cultural understanding.',
      minCefrLevel: 'C2',
      maxCefrLevel: 'C2',
      instructorName: 'Robert Taylor',
      duration: 60,
      learningOutcomes: ['Idiomatic expressions', 'Debate and argumentation', 'Specialized vocabulary', 'Native-level fluency'],
    },
  ]

  for (const course of coursesData) {
    await prisma.course.create({
      data: {
        ...course,
        content: { chapters: [] },
        learningOutcomes: course.learningOutcomes,
      },
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Seed courses if they don't exist
    await seedCourses()

    const courses = await prisma.course.findMany({
      orderBy: { minCefrLevel: 'asc' },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Failed to get courses:', error)
    return NextResponse.json(
      { error: 'Failed to get courses' },
      { status: 500 }
    )
  }
}
