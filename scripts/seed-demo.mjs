/**
 * เติมข้อมูลตัวอย่างให้ระบบครบวงจร: คอร์สมีราคา วิดีโอเล่นได้จริง และระดับ CEFR กำกับครบ
 *
 *   node scripts/seed-demo.mjs
 *
 * รันซ้ำได้ (idempotent) — อัปเดตทับของเดิม ไม่สร้างซ้ำ และไม่แตะข้อมูลผู้เรียน/การชำระเงิน
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ราคาต่อระดับ (บาท) — A1 ปล่อยฟรีไว้ เพื่อให้ทดสอบเส้นทาง "ลงทะเบียนแล้วเรียนได้ทันที" ได้ด้วย
const PRICE_BY_LEVEL = {
  A1: 0,
  A2: 490,
  B1: 690,
  B2: 990,
  C1: 1290,
  C2: 1490,
}

/**
 * คลิปตัวอย่างที่เปิดให้ใช้ได้เสรี (CC0 / CC-BY) และเสิร์ฟตรงเป็น video/mp4
 * ใช้แทนวิดีโอบทเรียนจริงเพื่อให้กดเล่นได้ครบทุกบทตอนสาธิต
 *
 * ทุกไฟล์ต้อง "เล็ก" (ไม่เกินไม่กี่ MB) — ก่อนหน้านี้เคยใส่ไฟล์ 238 MB ยาว 10 นาที
 * ผลคือเครื่องเล่นขึ้นจอดำค้างเพราะโหลดไม่จบ ทั้งที่ลิงก์ตอบ 200 ปกติ
 */
const DEMO_CLIPS = [
  'https://mdn.github.io/shared-assets/videos/flower.mp4',                              // 1.1 MB
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', // 0.9 MB
  'https://media.w3.org/2010/05/video/movie_300.mp4',                                   // 2.6 MB
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',    // 1.0 MB
  'https://media.w3.org/2010/05/sintel/trailer.mp4',                                    // 4.2 MB
  'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',          // 1.0 MB
]

async function main() {
  const courses = await prisma.course.findMany({
    orderBy: { minCefrLevel: 'asc' },
    include: { videos: { orderBy: { createdAt: 'asc' } } },
  })

  if (courses.length === 0) {
    console.log('ยังไม่มีคอร์สในระบบ — สร้างคอร์สก่อนแล้วค่อยรันสคริปต์นี้')
    return
  }

  let clipIndex = 0

  for (const course of courses) {
    const price = PRICE_BY_LEVEL[course.minCefrLevel] ?? 0

    await prisma.course.update({
      where: { id: course.id },
      data: { price },
    })

    for (const video of course.videos) {
      await prisma.video.update({
        where: { id: video.id },
        data: {
          videoUrl: DEMO_CLIPS[clipIndex % DEMO_CLIPS.length],
          // ระดับที่ผู้ดูแลกำหนดคือค่าที่ระบบใช้แนะนำคอร์ส จึงต้องมีครบทุกคลิป
          adminLevel: video.adminLevel || course.minCefrLevel,
          suggestedLevel: video.suggestedLevel || course.minCefrLevel,
          analyzed: true,
          analysisSummary:
            video.analysisSummary ||
            `เนื้อหาระดับ ${course.minCefrLevel} — คำศัพท์และโครงสร้างประโยคสอดคล้องกับคอร์ส "${course.title}"`,
        },
      })
      clipIndex += 1
    }

    console.log(
      `${course.minCefrLevel} · ${course.title} — ราคา ${price.toLocaleString('th-TH')} บาท · ${course.videos.length} บทเรียน`
    )
  }

  const totals = await prisma.video.count({ where: { videoUrl: { startsWith: 'http' } } })
  console.log(`\nเสร็จแล้ว: ${courses.length} คอร์ส · ${totals} วิดีโอที่มีลิงก์เล่นได้`)
}

main()
  .catch((error) => {
    console.error('seed-demo failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
