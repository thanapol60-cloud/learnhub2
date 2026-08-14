/**
 * สร้างนักเรียนตัวอย่างที่ "ใช้งานได้จริง": ล็อกอินได้ มีระดับ CEFR กระจายครบ
 * มีประวัติการทำแบบประเมิน และลงทะเบียนคอร์สในสถานะการชำระเงินหลายแบบ
 *
 *   node scripts/seed-students.mjs
 *
 * รันซ้ำได้: ลบบัญชีเดโม่เดิม (อีเมลลงท้าย @learnhub.demo) แล้วสร้างใหม่ทั้งชุด
 * ไม่แตะบัญชีจริงหรือการลงทะเบียนของผู้ใช้จริงเลย
 */
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_DOMAIN = '@learnhub.demo'
const DEMO_PASSWORD = 'Learnhub2026'

/** ต้องตรงกับ hashPassword ใน lib/auth.ts ไม่งั้นล็อกอินไม่ผ่าน */
function hashPassword(password) {
  return crypto.pbkdf2Sync(password, 'salt', 1000, 64, 'sha512').toString('hex')
}

function paymentRef(enrollmentId) {
  return `LH-${enrollmentId.slice(-6).toUpperCase()}`
}

const FIRST_NAMES = [
  'ธนพล', 'ปวีณา', 'ศิริพร', 'อนุชา', 'กมลชนก', 'ณัฐวุฒิ', 'พิมพ์ชนก', 'สุรศักดิ์',
  'ชลธิชา', 'ภาณุพงศ์', 'อารียา', 'วรเมธ', 'ณิชากร', 'ธีรภัทร', 'สุชาดา', 'กฤษณะ',
  'ปิยะดา', 'จิรายุ', 'เบญจวรรณ', 'อรรถพล', 'มนัสนันท์', 'พงศกร', 'ศศิธร', 'ธนกฤต',
  'รุ่งนภา', 'วิศรุต', 'กานต์ธิดา', 'สหรัฐ', 'ณัฐณิชา', 'ภูริช',
]

const LAST_NAMES = [
  'ทองดี', 'ศรีสุข', 'วงศ์คำ', 'ใจดี', 'บุญมี', 'แสงทอง', 'พรหมมา', 'อินทร์จันทร์',
  'สมบูรณ์', 'เกิดผล', 'ชูเกียรติ', 'มณีรัตน์', 'สายทอง', 'ปัญญาดี', 'ธรรมรักษ์',
]

/**
 * โควตาผู้เรียนต่อระดับ ให้เหมือนแพลตฟอร์มจริงคือกระจุกที่ระดับกลาง ๆ
 * และมีคนถึงระดับสูงไม่กี่คน
 */
const LEVEL_PLAN = [
  { level: 'A1', count: 6, accuracy: [18, 32] },
  { level: 'A2', count: 7, accuracy: [33, 48] },
  { level: 'B1', count: 6, accuracy: [50, 64] },
  { level: 'B2', count: 5, accuracy: [66, 76] },
  { level: 'C1', count: 4, accuracy: [78, 89] },
  { level: 'C2', count: 2, accuracy: [91, 97] },
]

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

// สุ่มแบบมี seed คงที่ เพื่อให้รันกี่ครั้งก็ได้ข้อมูลหน้าตาเดิม ตรวจสอบง่าย
let seed = 20260814
function random() {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}
const pick = (list) => list[Math.floor(random() * list.length)]
const between = (min, max) => Math.floor(random() * (max - min + 1)) + min

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

async function main() {
  const removed = await prisma.user.deleteMany({
    where: { email: { endsWith: DEMO_DOMAIN } },
  })
  if (removed.count) console.log(`ลบบัญชีเดโม่เดิม ${removed.count} บัญชี`)

  // เฉพาะคอร์สภาษาอังกฤษ — ระดับของวิชาอื่น (M1–M6, S1–S6) ไม่อยู่ใน LEVEL_ORDER
  // ถ้าไม่กรอง indexOf จะคืน -1 แล้วคอร์สคณิต/วิทย์จะผ่านเงื่อนไขความเหมาะสมของระดับทั้งหมด
  const courses = await prisma.course.findMany({
    where: { subject: 'english' },
    orderBy: { minCefrLevel: 'asc' },
    select: { id: true, title: true, minCefrLevel: true, price: true },
  })
  if (!courses.length) {
    console.log('ยังไม่มีคอร์สในระบบ — รัน seed-demo.mjs ก่อน')
    return
  }

  const questions = await prisma.question.findMany({
    where: { subject: 'english' },
    select: { id: true, cefrLevel: true },
  })
  const password = hashPassword(DEMO_PASSWORD)

  let index = 0
  const summary = { students: 0, records: 0, enrollments: {} }

  for (const plan of LEVEL_PLAN) {
    for (let i = 0; i < plan.count; i += 1) {
      index += 1
      const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
      const accuracy = between(plan.accuracy[0], plan.accuracy[1])
      const total = between(15, 45)
      const correct = Math.round((accuracy / 100) * total)
      const joined = daysAgo(between(1, 75))

      const user = await prisma.user.create({
        data: {
          email: `student${String(index).padStart(2, '0')}${DEMO_DOMAIN}`,
          password,
          name,
          role: 'user',
          currentLevel: plan.level,
          assessmentCompleted: true,
          assessmentStartedAt: joined,
          correctAnswers: correct,
          wrongAnswers: total - correct,
          createdAt: joined,
        },
      })
      summary.students += 1

      // ประวัติการตอบ 15 ข้อล่าสุด เพื่อให้หน้าแดชบอร์ดของผู้เรียนมีข้อมูลจริง
      const pool = questions.filter((q) => q.cefrLevel === plan.level)
      const source = pool.length >= 5 ? pool : questions
      for (let n = 0; n < Math.min(15, source.length); n += 1) {
        const question = source[Math.floor(random() * source.length)]
        await prisma.assessmentRecord.create({
          data: {
            userId: user.id,
            questionId: question.id,
            userAnswer: 'demo',
            isCorrect: random() * 100 < accuracy,
            currentLevel: plan.level,
            createdAt: new Date(joined.getTime() + n * 60000),
          },
        })
        summary.records += 1
      }

      // ลงทะเบียนคอร์สที่ระดับไม่เกินระดับของผู้เรียน
      const eligible = courses.filter(
        (course) => LEVEL_ORDER.indexOf(course.minCefrLevel) <= LEVEL_ORDER.indexOf(plan.level)
      )
      const wanted = Math.min(eligible.length, between(1, 2))
      const chosen = [...eligible].sort(() => random() - 0.5).slice(0, wanted)

      for (const course of chosen) {
        // คอร์สฟรีเปิดสิทธิ์ทันที ส่วนคอร์สที่มีราคาให้กระจายทุกสถานะเพื่อทดสอบหน้าแอดมิน
        const roll = random()
        const status = course.price === 0
          ? 'active'
          : roll < 0.55 ? 'active'
          : roll < 0.78 ? 'pending_review'
          : roll < 0.93 ? 'awaiting_payment'
          : 'rejected'

        const enrolledAt = new Date(joined.getTime() + between(1, 5) * 86400000)
        const created = await prisma.courseEnrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            amount: course.price,
            status,
            enrolledAt,
            progress: status === 'active' ? between(0, 100) : 0,
            paidAt: status === 'pending_review' || status === 'active' || status === 'rejected'
              ? new Date(enrolledAt.getTime() + 3600000)
              : null,
            paymentNote: status === 'pending_review'
              ? `โอนเวลา ${between(9, 20)}:${String(between(0, 59)).padStart(2, '0')} ธนาคารกสิกรไทย`
              : null,
            reviewedAt: status === 'active' || status === 'rejected'
              ? new Date(enrolledAt.getTime() + 7200000)
              : null,
          },
        })
        await prisma.courseEnrollment.update({
          where: { id: created.id },
          data: { paymentRef: paymentRef(created.id) },
        })
        summary.enrollments[status] = (summary.enrollments[status] || 0) + 1
      }
    }
  }

  console.log(`\nสร้างนักเรียน ${summary.students} คน · บันทึกการตอบ ${summary.records} ข้อ`)
  console.log('การลงทะเบียนตามสถานะ:', summary.enrollments)
  console.log(`\nล็อกอินได้ทุกบัญชีด้วยรหัสผ่าน: ${DEMO_PASSWORD}`)
  console.log(`ตัวอย่างอีเมล: student01${DEMO_DOMAIN} … student${String(summary.students).padStart(2, '0')}${DEMO_DOMAIN}`)
}

main()
  .catch((error) => {
    console.error('seed-students failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
