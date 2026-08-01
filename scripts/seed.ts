import { PrismaClient } from '@prisma/client'
import { SEED_QUESTIONS, SEED_COURSES } from '../lib/seed-data'

const prisma = new PrismaClient()

async function seedQuestions() {
  await prisma.question.deleteMany()
  await prisma.question.createMany({ data: SEED_QUESTIONS })

  const byLevel = await prisma.question.groupBy({
    by: ['cefrLevel'],
    _count: { _all: true },
  })

  console.log(`Questions seeded: ${SEED_QUESTIONS.length}`)
  for (const row of byLevel.sort((a, b) => a.cefrLevel.localeCompare(b.cefrLevel))) {
    console.log(`  ${row.cefrLevel}: ${row._count._all}`)
  }
}

async function seedCourses() {
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
  if (!admin) {
    console.error('No admin user found. Register an admin account first.')
    return
  }

  await prisma.video.deleteMany()
  await prisma.course.deleteMany()

  let videoCount = 0

  for (const seed of SEED_COURSES) {
    const course = await prisma.course.create({
      data: {
        title: seed.title,
        description: seed.description,
        minCefrLevel: seed.cefrLevel,
        maxCefrLevel: seed.cefrLevel,
        instructorName: seed.instructorName,
        duration: seed.duration,
        learningOutcomes: seed.learningOutcomes,
        createdById: admin.id,
        content: { chapters: [] },
      },
    })

    await prisma.video.createMany({
      data: seed.videos.map((video) => ({
        title: video.title,
        description: video.description,
        videoUrl: `https://example.com/learnhub/${seed.cefrLevel.toLowerCase()}/${video.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')}`,
        duration: video.minutes * 60,
        uploadedById: admin.id,
        suggestedLevel: seed.cefrLevel,
        adminLevel: seed.cefrLevel,
        analyzed: true,
        analysisSummary: `ตัวอย่างสำหรับทดสอบระบบ กำหนดระดับ ${seed.cefrLevel} ไว้ล่วงหน้า`,
        courseId: course.id,
      })),
    })

    videoCount += seed.videos.length
    console.log(`  ${seed.cefrLevel}  ${seed.title} (${seed.videos.length} clips)`)
  }

  console.log(`Courses seeded: ${SEED_COURSES.length}, videos: ${videoCount}`)
}

async function main() {
  await seedQuestions()
  await seedCourses()
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
