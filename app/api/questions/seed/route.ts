import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const SEED_QUESTIONS = [
  // A1 Level
  {
    question: 'What is "Hello" in Thai?',
    options: [
      { text: 'สวัสดี', isCorrect: true },
      { text: 'ขอบคุณ', isCorrect: false },
      { text: 'สุขสวัสดี', isCorrect: false },
      { text: 'เสียใจ', isCorrect: false },
    ],
    correctAnswer: 'สวัสดี',
    explanation: 'Hello is translated to "สวัสดี" (Sawasdee) in Thai.',
    difficulty: 1,
    cefrLevel: 'A1',
    category: 'vocabulary',
  },
  {
    question: 'Which is correct?',
    options: [
      { text: 'I am student', isCorrect: false },
      { text: 'I am a student', isCorrect: true },
      { text: 'I is student', isCorrect: false },
      { text: 'Am I student', isCorrect: false },
    ],
    correctAnswer: 'I am a student',
    explanation: 'We need to use "a" before a singular noun. The correct form is "I am a student".',
    difficulty: 2,
    cefrLevel: 'A1',
    category: 'grammar',
  },
  {
    question: 'Choose the correct spelling:',
    options: [
      { text: 'tomorow', isCorrect: false },
      { text: 'tommorow', isCorrect: false },
      { text: 'tomorrow', isCorrect: true },
      { text: 'tomarrow', isCorrect: false },
    ],
    correctAnswer: 'tomorrow',
    explanation: 'The correct spelling is "tomorrow" - the day after today.',
    difficulty: 1,
    cefrLevel: 'A1',
    category: 'vocabulary',
  },
  // A2 Level
  {
    question: 'Complete: "She _____ to school every day."',
    options: [
      { text: 'go', isCorrect: false },
      { text: 'goes', isCorrect: true },
      { text: 'going', isCorrect: false },
      { text: 'went', isCorrect: false },
    ],
    correctAnswer: 'goes',
    explanation: 'For third person singular (she), we add "s" to the verb in present simple tense.',
    difficulty: 3,
    cefrLevel: 'A2',
    category: 'grammar',
  },
  {
    question: 'What does "excuse me" mean?',
    options: [
      { text: 'ขออภัย', isCorrect: true },
      { text: 'ยินดี', isCorrect: false },
      { text: 'รอสักครู่', isCorrect: false },
      { text: 'ทำไม', isCorrect: false },
    ],
    correctAnswer: 'ขออภัย',
    explanation: '"Excuse me" is used to politely get someone\'s attention or apologize slightly. It means "ขออภัย".',
    difficulty: 2,
    cefrLevel: 'A2',
    category: 'vocabulary',
  },
  {
    question: 'Where is the bathroom?',
    options: [
      { text: 'ห้องน้ำอยู่ที่ไหน', isCorrect: true },
      { text: 'ห้องครัวอยู่ที่ไหน', isCorrect: false },
      { text: 'ห้องนั่งเล่นอยู่ที่ไหน', isCorrect: false },
      { text: 'ห้องนอนอยู่ที่ไหน', isCorrect: false },
    ],
    correctAnswer: 'ห้องน้ำอยู่ที่ไหน',
    explanation: 'The bathroom in Thai is "ห้องน้ำ" and "where" is "ที่ไหน".',
    difficulty: 2,
    cefrLevel: 'A2',
    category: 'vocabulary',
  },
  // B1 Level
  {
    question: 'Which sentence is correct?',
    options: [
      { text: 'If I was you, I would study harder.', isCorrect: false },
      { text: 'If I were you, I would study harder.', isCorrect: true },
      { text: 'If I am you, I would study harder.', isCorrect: false },
      { text: 'If I had been you, I study harder.', isCorrect: false },
    ],
    correctAnswer: 'If I were you, I would study harder.',
    explanation: 'In conditional sentences, we use "were" instead of "was" after "if" in hypothetical situations.',
    difficulty: 5,
    cefrLevel: 'B1',
    category: 'grammar',
  },
  {
    question: 'What is "procrastination"?',
    options: [
      { text: 'การชักช้า', isCorrect: true },
      { text: 'การวางแผน', isCorrect: false },
      { text: 'การเร่งรีบ', isCorrect: false },
      { text: 'การลังเล', isCorrect: false },
    ],
    correctAnswer: 'การชักช้า',
    explanation: 'Procrastination means delaying or postponing something, or "การชักช้า" in Thai.',
    difficulty: 4,
    cefrLevel: 'B1',
    category: 'vocabulary',
  },
  {
    question: 'Choose the best preposition: "I\'m interested _____ learning new languages."',
    options: [
      { text: 'at', isCorrect: false },
      { text: 'in', isCorrect: true },
      { text: 'on', isCorrect: false },
      { text: 'from', isCorrect: false },
    ],
    correctAnswer: 'in',
    explanation: 'The phrase "be interested in" is the correct collocation.',
    difficulty: 4,
    cefrLevel: 'B1',
    category: 'grammar',
  },
  // B2 Level
  {
    question: 'Choose the most appropriate word: "The_____ of the building is impressive."',
    options: [
      { text: 'architecture', isCorrect: true },
      { text: 'construct', isCorrect: false },
      { text: 'building', isCorrect: false },
      { text: 'structure design', isCorrect: false },
    ],
    correctAnswer: 'architecture',
    explanation: 'Architecture refers to the design and style of buildings. It is the most appropriate choice.',
    difficulty: 6,
    cefrLevel: 'B2',
    category: 'vocabulary',
  },
  {
    question: 'Which is the best way to express disagreement politely?',
    options: [
      { text: 'You are completely wrong.', isCorrect: false },
      { text: 'I see your point, but I have a different perspective.', isCorrect: true },
      { text: 'That\'s stupid.', isCorrect: false },
      { text: 'No way, that\'s not right.', isCorrect: false },
    ],
    correctAnswer: 'I see your point, but I have a different perspective.',
    explanation: 'Polite disagreement acknowledges the other person\'s view while expressing a different opinion.',
    difficulty: 7,
    cefrLevel: 'B2',
    category: 'vocabulary',
  },
  {
    question: 'Complete: "Despite her illness, she _____ to complete the project."',
    options: [
      { text: 'managed', isCorrect: true },
      { text: 'managed to', isCorrect: false },
      { text: 'could', isCorrect: false },
      { text: 'was able to', isCorrect: false },
    ],
    correctAnswer: 'managed',
    explanation: '"Managed" is already followed by "to", so we just need "managed" here.',
    difficulty: 6,
    cefrLevel: 'B2',
    category: 'grammar',
  },
  // C1 Level
  {
    question: 'Complete: "The company\'s _____ to adapt to market changes proved to be their downfall."',
    options: [
      { text: 'reluctance', isCorrect: true },
      { text: 'reluctant', isCorrect: false },
      { text: 'reluctantly', isCorrect: false },
      { text: 'reluctance to', isCorrect: false },
    ],
    correctAnswer: 'reluctance',
    explanation: 'Reluctance is a noun meaning unwillingness or disinclination. Here it fits perfectly.',
    difficulty: 8,
    cefrLevel: 'C1',
    category: 'grammar',
  },
  {
    question: 'What does "ephemeral" mean?',
    options: [
      { text: 'lasting only a short time', isCorrect: true },
      { text: 'extremely rare', isCorrect: false },
      { text: 'very beautiful', isCorrect: false },
      { text: 'strange and unusual', isCorrect: false },
    ],
    correctAnswer: 'lasting only a short time',
    explanation: 'Ephemeral means lasting only a very short time; temporary. Like "short-lived".',
    difficulty: 8,
    cefrLevel: 'C1',
    category: 'vocabulary',
  },
]

export async function POST(request: NextRequest) {
  try {
    // Check if questions already exist
    const existingCount = await prisma.question.count()
    if (existingCount > 0) {
      return NextResponse.json(
        { message: 'Questions already exist', count: existingCount },
        { status: 200 }
      )
    }

    // Seed questions
    for (const q of SEED_QUESTIONS) {
      await prisma.question.create({
        data: q,
      })
    }

    return NextResponse.json({
      message: 'Questions seeded successfully',
      count: SEED_QUESTIONS.length,
    })
  } catch (error) {
    console.error('Failed to seed questions:', error)
    return NextResponse.json(
      { error: 'Failed to seed questions' },
      { status: 500 }
    )
  }
}
