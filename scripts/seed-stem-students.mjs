/**
 * ผู้เรียนตัวอย่างของวิชาคณิตศาสตร์และวิทยาศาสตร์
 *
 *   node scripts/seed-stem-students.mjs
 *
 * ทำสองอย่าง
 *   1) ให้ผู้เรียนเดโมเดิม (@learnhub.demo) มีระดับคณิต/วิทย์ด้วย ไม่ใช่มีแต่ภาษาอังกฤษ
 *   2) สร้างผู้เรียนสายวิทย์-คณิตเพิ่ม (@stem.learnhub.demo) ที่ลงคอร์สของสองวิชานี้
 *
 * ทุกคนล็อกอินได้จริงด้วยรหัสผ่านเดียวกับชุดเดิม
 * รันซ้ำได้: ลบเฉพาะบัญชี @stem.learnhub.demo แล้วเขียนความคืบหน้ารายวิชาใหม่ทั้งหมด
 */
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_DOMAIN = '@learnhub.demo'
const STEM_DOMAIN = '@stem.learnhub.demo'
const DEMO_PASSWORD = 'Learnhub2026'

/** ต้องตรงกับ hashPassword ใน lib/auth.ts ไม่งั้นล็อกอินไม่ผ่าน */
function hashPassword(password) {
  return crypto.pbkdf2Sync(password, 'salt', 1000, 64, 'sha512').toString('hex')
}

const paymentRef = (id) => `LH-${id.slice(-6).toUpperCase()}`

const FIRST_NAMES = [
  'ปรัชญา', 'ศุภกร', 'ธัญชนก', 'อภิสิทธิ์', 'นภัสสร', 'วรินทร', 'กิตติพงศ์', 'ชนากานต์',
  'ตรีทศ', 'พัชรพล', 'สิริกร', 'ณภัทร', 'อธิชา', 'ภูมิรพี', 'ปาริชาต', 'ธนดล',
  'ญาณิศา', 'ชยพล', 'เขมิกา', 'รวิศุทธ์',
]

const LAST_NAMES = [
  'เรืองวิทย์', 'คำนวณ', 'พิสิฐกุล', 'ตรีเวช', 'สุวรรณชาติ', 'อนันตชัย', 'ชัยมงคล',
  'ธนาคม', 'ปทุมมาศ', 'วิทยาคม', 'ศักดิ์สิทธิ์', 'เจริญผล',
]

/**
 * โควตาผู้เรียนต่อระดับของแต่ละวิชา ให้กระจุกที่ระดับกลางเหมือนแพลตฟอร์มจริง
 * accuracy คือช่วงความแม่นยำที่สมเหตุสมผลกับระดับนั้น
 */
const PLANS = {
  math: [
    { level: 'M1', count: 4, accuracy: [20, 34] },
    { level: 'M2', count: 5, accuracy: [35, 49] },
    { level: 'M3', count: 6, accuracy: [50, 63] },
    { level: 'M4', count: 5, accuracy: [64, 75] },
    { level: 'M5', count: 3, accuracy: [77, 88] },
    { level: 'M6', count: 2, accuracy: [90, 97] },
  ],
  science: [
    { level: 'S1', count: 4, accuracy: [21, 35] },
    { level: 'S2', count: 5, accuracy: [36, 50] },
    { level: 'S3', count: 6, accuracy: [51, 64] },
    { level: 'S4', count: 5, accuracy: [65, 76] },
    { level: 'S5', count: 3, accuracy: [78, 89] },
    { level: 'S6', count: 2, accuracy: [91, 97] },
  ],
}

const LEVEL_ORDER = {
  math: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
  science: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
}

/** จำนวนผู้เรียนสายวิทย์-คณิตที่สร้างใหม่ */
const STEM_STUDENTS = 18

// สุ่มแบบกำหนดค่าเริ่มต้น เพื่อให้รันกี่ครั้งก็ได้ข้อมูลชุดเดิม
let seed = 20260815
function random() {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}
const pick = (list) => list[Math.floor(random() * list.length)]
const between = (min, max) => Math.floor(random() * (max - min + 1)) + min
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

/** แจกระดับตามโควตาให้ครบจำนวนคนที่ต้องการ วนซ้ำถ้าคนมากกว่าโควตา */
function levelPlanFor(subject, size) {
  const expanded = []
  for (const plan of PLANS[subject]) {
    for (let i = 0; i < plan.count; i += 1) expanded.push(plan)
  }
  const out = []
  for (let i = 0; i < size; i += 1) out.push(expanded[i % expanded.length])
  return out
}

/**
 * เขียนความคืบหน้าของวิชาหนึ่งให้ผู้เรียนหนึ่งคน
 * พร้อมบันทึกการตอบจริง เพื่อให้หน้าผลสอบและการแนะนำคอร์สมีข้อมูลใช้งาน
 */
async function writeProgress(user, subject, plan, questionsBySubject, startedAt) {
  const accuracy = between(plan.accuracy[0], plan.accuracy[1])
  const total = between(14, 25)
  const correct = Math.round((accuracy / 100) * total)

  await prisma.subjectProgress.upsert({
    where: { userId_subject: { userId: user.id, subject } },
    create: {
      userId: user.id,
      subject,
      currentLevel: plan.level,
      correctAnswers: correct,
      wrongAnswers: total - correct,
      assessmentStartedAt: startedAt,
    },
    update: {
      currentLevel: plan.level,
      correctAnswers: correct,
      wrongAnswers: total - correct,
      assessmentStartedAt: startedAt,
    },
  })

  // เลือกข้อจากระดับของผู้เรียนก่อน ถ้าไม่พอค่อยใช้ทั้งคลังของวิชานั้น
  const pool = questionsBySubject[subject]
  const atLevel = pool.filter((q) => q.cefrLevel === plan.level)
  const source = atLevel.length >= 5 ? atLevel : pool
  const used = new Set()
  let records = 0

  for (let n = 0; n < Math.min(total, source.length); n += 1) {
    const question = source[Math.floor(random() * source.length)]
    if (used.has(question.id)) continue
    used.add(question.id)
    await prisma.assessmentRecord.create({
      data: {
        userId: user.id,
        questionId: question.id,
        userAnswer: 'demo',
        isCorrect: random() * 100 < accuracy,
        currentLevel: plan.level,
        createdAt: new Date(startedAt.getTime() + n * 60000),
      },
    })
    records += 1
  }

  return { records, level: plan.level }
}

/** ลงทะเบียนคอร์สของวิชานั้นในระดับที่ไม่เกินระดับของผู้เรียน */
async function enrol(user, subject, level, courses, joined, summary) {
  const order = LEVEL_ORDER[subject]
  const eligible = courses.filter(
    (course) =>
      course.subject === subject &&
      order.indexOf(course.minCefrLevel) >= 0 &&
      order.indexOf(course.minCefrLevel) <= order.indexOf(level)
  )
  if (!eligible.length) return

  const wanted = Math.min(eligible.length, between(1, 2))
  const chosen = [...eligible].sort(() => random() - 0.5).slice(0, wanted)

  for (const course of chosen) {
    const existing = await prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    })
    if (existing) continue

    // กระจายทุกสถานะการชำระเงิน เพื่อให้หน้าแอดมินมีของให้กดอนุมัติจริง
    const roll = random()
    const status =
      course.price === 0
        ? 'active'
        : roll < 0.55
          ? 'active'
          : roll < 0.78
            ? 'pending_review'
            : roll < 0.93
              ? 'awaiting_payment'
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
        paidAt:
          status === 'pending_review' || status === 'active' || status === 'rejected'
            ? new Date(enrolledAt.getTime() + 3600000)
            : null,
        paymentNote:
          status === 'pending_review'
            ? `โอนเวลา ${between(9, 20)}:${String(between(0, 59)).padStart(2, '0')} ธนาคารกรุงไทย`
            : null,
        reviewedAt:
          status === 'active' || status === 'rejected'
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

async function main() {
  const removed = await prisma.user.deleteMany({
    where: { email: { endsWith: STEM_DOMAIN } },
  })
  if (removed.count) console.log(`ลบบัญชีสายวิทย์-คณิตเดิม ${removed.count} บัญชี`)

  const courses = await prisma.course.findMany({
    where: { subject: { in: ['math', 'science'] } },
    select: { id: true, subject: true, minCefrLevel: true, price: true },
  })
  if (!courses.length) {
    console.log('ยังไม่มีคอร์สคณิต/วิทย์ — รัน seed-stem-courses.mjs ก่อน')
    process.exitCode = 1
    return
  }

  const questionsBySubject = {}
  for (const subject of ['math', 'science']) {
    questionsBySubject[subject] = await prisma.question.findMany({
      where: { subject },
      select: { id: true, cefrLevel: true },
    })
    if (!questionsBySubject[subject].length) {
      console.log(`ยังไม่มีข้อสอบวิชา ${subject} — รัน seed-${subject}.mjs ก่อน`)
      process.exitCode = 1
      return
    }
  }

  const summary = { newStudents: 0, updated: 0, records: 0, enrollments: {} }

  // ---- 1) เติมระดับคณิต/วิทย์ให้ผู้เรียนเดโมเดิม ----
  const existing = await prisma.user.findMany({
    where: { email: { endsWith: DEMO_DOMAIN }, role: 'user' },
    orderBy: { email: 'asc' },
    select: { id: true, email: true, createdAt: true },
  })

  const mathPlans = levelPlanFor('math', existing.length)
  const sciencePlans = levelPlanFor('science', existing.length)

  for (let i = 0; i < existing.length; i += 1) {
    const user = existing[i]
    const startedAt = daysAgo(between(1, 40))
    // ไม่ให้ทุกคนสอบครบทั้งสองวิชา จะได้เหมือนการใช้งานจริงที่บางคนสอบวิชาเดียว
    const roll = random()
    if (roll < 0.75) {
      const r = await writeProgress(user, 'math', mathPlans[i], questionsBySubject, startedAt)
      summary.records += r.records
      await enrol(user, 'math', r.level, courses, startedAt, summary)
    }
    if (roll > 0.35) {
      const r = await writeProgress(user, 'science', sciencePlans[i], questionsBySubject, startedAt)
      summary.records += r.records
      await enrol(user, 'science', r.level, courses, startedAt, summary)
    }
    summary.updated += 1
  }

  // ---- 2) ผู้เรียนสายวิทย์-คณิตชุดใหม่ ----
  const password = hashPassword(DEMO_PASSWORD)
  const newMathPlans = levelPlanFor('math', STEM_STUDENTS)
  const newSciencePlans = levelPlanFor('science', STEM_STUDENTS)

  for (let i = 0; i < STEM_STUDENTS; i += 1) {
    const joined = daysAgo(between(2, 80))
    const user = await prisma.user.create({
      data: {
        email: `stem${String(i + 1).padStart(2, '0')}${STEM_DOMAIN}`,
        password,
        name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        role: 'user',
        // ยังไม่ได้สอบภาษาอังกฤษ จึงคงค่าเริ่มต้นและไม่นับเข้าสถิติวิชานั้น
        currentLevel: 'A1',
        assessmentCompleted: false,
        correctAnswers: 0,
        wrongAnswers: 0,
        createdAt: joined,
      },
    })
    summary.newStudents += 1

    const mathResult = await writeProgress(user, 'math', newMathPlans[i], questionsBySubject, joined)
    summary.records += mathResult.records
    await enrol(user, 'math', mathResult.level, courses, joined, summary)

    const scienceResult = await writeProgress(
      user,
      'science',
      newSciencePlans[i],
      questionsBySubject,
      joined
    )
    summary.records += scienceResult.records
    await enrol(user, 'science', scienceResult.level, courses, joined, summary)
  }

  console.log(
    `\nสร้างผู้เรียนใหม่ ${summary.newStudents} คน · เติมวิชาให้ผู้เรียนเดิม ${summary.updated} คน · บันทึกการตอบ ${summary.records} ข้อ`
  )
  console.log('การลงทะเบียนตามสถานะ:', summary.enrollments)

  // ตรวจผลที่ได้จริงจากฐานข้อมูล
  for (const subject of ['math', 'science']) {
    const rows = await prisma.subjectProgress.groupBy({
      by: ['currentLevel'],
      where: { subject },
      _count: true,
    })
    rows.sort((a, b) => a.currentLevel.localeCompare(b.currentLevel))
    console.log(
      `${subject}: ${rows.reduce((sum, r) => sum + r._count, 0)} คน · ` +
        rows.map((r) => `${r.currentLevel}=${r._count}`).join(' ')
    )
  }

  console.log(`\nล็อกอินได้ทุกบัญชีด้วยรหัสผ่าน: ${DEMO_PASSWORD}`)
  console.log(`บัญชีใหม่: stem01${STEM_DOMAIN} … stem${String(STEM_STUDENTS).padStart(2, '0')}${STEM_DOMAIN}`)
}

main()
  .catch((error) => {
    console.error('seed-stem-students failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
