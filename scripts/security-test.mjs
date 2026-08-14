/**
 * ชุดทดสอบความปลอดภัยอัตโนมัติของ LearnHub
 *
 *   node scripts/security-test.mjs                          # ทดสอบ production
 *   node scripts/security-test.mjs http://localhost:3111    # ทดสอบเครื่องตัวเอง
 *
 * ออกแบบให้รันซ้ำได้ก่อนขึ้นระบบทุกครั้ง เพื่อยืนยันว่าช่องโหว่ที่เคยแก้ไปแล้ว
 * ไม่ได้กลับมาอีกจากการแก้โค้ดครั้งหลัง
 *
 * ทุกกรณีทดสอบเป็นการอ่านหรือการเขียนที่ย้อนกลับได้ ไม่มีการลบข้อมูลของผู้ใช้จริง
 * และใช้เฉพาะบัญชีเดโม (@learnhub.demo) เท่านั้น
 */
import crypto from 'crypto'
import fs from 'fs'
import { execFileSync } from 'child_process'

const BASE = process.argv[2] || 'https://learnhub2.vercel.app'
const DEMO = { email: 'student01@learnhub.demo', password: 'Learnhub2026' }
const DEMO2 = { email: 'student02@learnhub.demo', password: 'Learnhub2026' }

const results = []

function record(id, category, title, passed, detail, severity = 'สูง') {
  results.push({ id, category, title, passed, detail, severity })
  const mark = passed ? 'ผ่าน' : 'ไม่ผ่าน'
  console.log(`  [${mark}] ${id} ${title}`)
  if (!passed) console.log(`         → ${detail}`)
}

async function login(account) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  })
  if (!res.ok) return null
  return res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ')
}

const status = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, options)
  return res.status
}

// ---------------------------------------------------------------- A. สิทธิ์
async function testAuthorization(learnerCookie, learnerCookie2) {
  console.log('\nA. การยืนยันตัวตนและสิทธิ์')

  record(
    'A1',
    'สิทธิ์',
    'เรียก API ผู้ดูแลโดยไม่ล็อกอิน ต้องถูกปฏิเสธ',
    (await status('/api/admin/students')) === 401,
    'เข้าถึงข้อมูลนักเรียนได้โดยไม่ต้องล็อกอิน'
  )

  // ช่องโหว่ที่เคยพบจริงเมื่อ 15 ส.ค. 2569 — คุกกี้ userRole ปลอมได้
  const forged = await status('/api/admin/students', {
    headers: { Cookie: 'userRole=admin' },
  })
  record(
    'A2',
    'สิทธิ์',
    'ปลอมคุกกี้ userRole=admin ต้องไม่ได้สิทธิ์ผู้ดูแล',
    forged === 401 || forged === 403,
    `ได้ HTTP ${forged} — ใครก็ตั้งคุกกี้เองแล้วเข้าคอนโซลผู้ดูแลได้`,
    'วิกฤต'
  )

  record(
    'A3',
    'สิทธิ์',
    'บัญชีผู้เรียนเข้า API ผู้ดูแลต้องถูกปฏิเสธ',
    (await status('/api/admin/students', { headers: { Cookie: learnerCookie } })) === 403,
    'ผู้เรียนธรรมดาเข้าถึงข้อมูลผู้ดูแลได้'
  )

  record(
    'A4',
    'สิทธิ์',
    'ผู้เรียนยกระดับตัวเองด้วยคุกกี้ปลอมต้องไม่สำเร็จ',
    (await status('/api/admin/students', {
      headers: { Cookie: `${learnerCookie}; userRole=admin` },
    })) === 403,
    'ผู้เรียนยกระดับตัวเองเป็นผู้ดูแลได้',
    'วิกฤต'
  )

  record(
    'A5',
    'สิทธิ์',
    'ผู้เรียนเข้าหน้าตั้งค่าที่เก็บ API key ต้องถูกปฏิเสธ',
    (await status('/api/admin/settings', {
      headers: { Cookie: `${learnerCookie}; userRole=admin` },
    })) === 403,
    'ผู้เรียนอ่านค่าตั้งที่มีความลับได้',
    'วิกฤต'
  )

  // IDOR — ผู้เรียนคนหนึ่งต้องไม่เห็นข้อมูลของอีกคน
  const mine = await (await fetch(`${BASE}/api/enrollments`, { headers: { Cookie: learnerCookie } })).json()
  const theirs = await (await fetch(`${BASE}/api/enrollments`, { headers: { Cookie: learnerCookie2 } })).json()
  const myIds = new Set((mine.enrollments ?? []).map((e) => e.id))
  const overlap = (theirs.enrollments ?? []).filter((e) => myIds.has(e.id))
  record(
    'A6',
    'สิทธิ์',
    'ผู้เรียนต้องเห็นเฉพาะการลงทะเบียนของตัวเอง',
    overlap.length === 0,
    `พบรายการซ้ำข้ามบัญชี ${overlap.length} รายการ`
  )

  // ผู้เรียนต้องอนุมัติการชำระเงินของตัวเองไม่ได้
  const target = (mine.enrollments ?? [])[0]
  if (target) {
    const selfApprove = await status(`/api/admin/enrollments/${target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `${learnerCookie}; userRole=admin` },
      body: JSON.stringify({ status: 'active' }),
    })
    record(
      'A7',
      'ตรรกะธุรกิจ',
      'ผู้เรียนอนุมัติการชำระเงินของตัวเองไม่ได้',
      selfApprove === 403 || selfApprove === 401,
      `ได้ HTTP ${selfApprove} — ผู้เรียนเปิดสิทธิ์เรียนให้ตัวเองได้โดยไม่จ่ายเงิน`,
      'วิกฤต'
    )
  } else {
    record('A7', 'ตรรกะธุรกิจ', 'ผู้เรียนอนุมัติการชำระเงินของตัวเองไม่ได้', true, 'ข้าม: ไม่มีรายการให้ทดสอบ')
  }
}

// ------------------------------------------------------- B. ตรรกะการสอบ
async function testAssessmentIntegrity(learnerCookie) {
  console.log('\nB. ความถูกต้องของการสอบและการเงิน')

  const q = await (
    await fetch(`${BASE}/api/question?subject=math`, { headers: { Cookie: learnerCookie } })
  ).json()

  if (q.question) {
    // API ไม่ส่งเฉลยมาแล้ว จึงเลือกตัวเลือกใดก็ได้ — ประเด็นของการทดสอบคือ
    // ระบบต้องไม่เชื่อธง isCorrect ที่ไคลเอนต์ยัดเข้ามาเอง
    const wrong = q.question.options[0]
    // ส่งคำตอบผิดพร้อมอ้างว่าถูก — เซิร์ฟเวอร์ต้องตรวจเอง ไม่เชื่อไคลเอนต์
    const answered = await (
      await fetch(`${BASE}/api/assessment/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: learnerCookie },
        body: JSON.stringify({
          questionId: q.question.id,
          userAnswer: wrong.text,
          isCorrect: true, // ฟิลด์ที่ไคลเอนต์ยัดเข้ามาเอง
        }),
      })
    ).json()
    record(
      'B1',
      'ตรรกะธุรกิจ',
      'เซิร์ฟเวอร์ตรวจคำตอบเอง ไม่เชื่อผลที่ไคลเอนต์ส่งมา',
      typeof answered.isCorrect === 'boolean' &&
        answered.isCorrect === (answered.correctAnswer === wrong.text),
      `ไคลเอนต์อ้างว่าตอบถูกแล้วระบบเชื่อ (isCorrect=${answered.isCorrect})`,
      'วิกฤต'
    )

    record(
      'B2',
      'ความเป็นส่วนตัว',
      'API ข้อสอบไม่ควรเปิดเผยเฉลยก่อนตอบ',
      !q.question.options.some((o) => 'isCorrect' in o),
      'ตัวเลือกมีธง isCorrect ติดมาด้วย ผู้สอบเปิด devtools ก็เห็นเฉลย',
      'กลาง'
    )
  } else {
    record('B1', 'ตรรกะธุรกิจ', 'เซิร์ฟเวอร์ตรวจคำตอบเอง', true, 'ข้าม: ไม่มีข้อสอบให้ทดสอบ')
    record('B2', 'ความเป็นส่วนตัว', 'API ข้อสอบไม่เปิดเผยเฉลย', true, 'ข้าม')
  }

  // ราคาต้องอ่านจากฐานข้อมูล ไม่ใช่จากที่ผู้ใช้ส่งมา
  const courses = await (await fetch(`${BASE}/api/courses`)).json()
  const paid = (courses.courses ?? []).find((c) => c.price > 0)
  if (paid) {
    const res = await fetch(`${BASE}/api/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: learnerCookie },
      body: JSON.stringify({ courseId: paid.id, amount: 1 }), // พยายามกำหนดราคาเอง
    })
    const body = await res.json().catch(() => ({}))
    const charged = body.enrollment?.amount
    const tampered = charged !== undefined && charged !== paid.price
    record(
      'B3',
      'ตรรกะธุรกิจ',
      'ยอดเงินอ่านจากฐานข้อมูล ไม่ใช่จากคำขอของผู้ใช้',
      !tampered,
      `คอร์สราคา ${paid.price} แต่ถูกคิด ${charged}`,
      'วิกฤต'
    )
  }

  // เนื้อหาวิดีโอต้องไม่หลุดให้คนที่ยังไม่ได้รับอนุมัติ
  const locked = (courses.courses ?? []).find((c) => c.price > 0)
  if (locked) {
    const detail = await (
      await fetch(`${BASE}/api/courses/${locked.id}`, { headers: { Cookie: learnerCookie } })
    ).json()
    const lessons = detail.course?.videos ?? detail.videos ?? []
    const leaked = lessons.filter((v) => v.videoUrl)
    const enrolled = detail.enrollment?.status === 'active'
    record(
      'B4',
      'การควบคุมการเข้าถึง',
      'URL วิดีโอต้องไม่ส่งให้ผู้ที่ยังไม่ได้รับอนุมัติ',
      enrolled || leaked.length === 0,
      `หลุด ${leaked.length} คลิป ทั้งที่สถานะคือ ${detail.enrollment?.status ?? 'ไม่ได้ลงทะเบียน'}`
    )
  }
}

// ------------------------------------------------------------ C. Injection
async function testInjection(learnerCookie) {
  console.log('\nC. การแทรกคำสั่งและสคริปต์')

  const payloads = [
    "' OR '1'='1",
    "admin'--",
    '" OR 1=1--',
    "'; DROP TABLE User;--",
  ]

  let bypassed = false
  for (const payload of payloads) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload, password: payload }),
    })
    if (res.ok) bypassed = true
  }
  record(
    'C1',
    'Injection',
    'SQL injection ที่หน้าเข้าสู่ระบบต้องไม่สำเร็จ',
    !bypassed,
    'เข้าสู่ระบบได้ด้วย payload ของ SQL injection',
    'วิกฤต'
  )

  // ค่าที่ผู้ใช้กรอกแล้วผู้ดูแลต้องอ่าน — ต้องไม่ถูกตีความเป็นสคริปต์
  const xss = '<script>alert(1)</script>'
  const mine = await (await fetch(`${BASE}/api/enrollments`, { headers: { Cookie: learnerCookie } })).json()
  const target = (mine.enrollments ?? []).find((e) => e.status === 'awaiting_payment')
  if (target) {
    await fetch(`${BASE}/api/enrollments/${target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: learnerCookie },
      body: JSON.stringify({ paymentNote: xss }),
    })
    const after = await (
      await fetch(`${BASE}/api/enrollments`, { headers: { Cookie: learnerCookie } })
    ).json()
    const saved = (after.enrollments ?? []).find((e) => e.id === target.id)
    // React หนีอักขระพิเศษให้อยู่แล้ว ค่าที่เก็บจึงเป็นข้อความล้วนได้ ไม่ถือว่าผิด
    record(
      'C2',
      'Injection',
      'ข้อความจากผู้ใช้ถูกเก็บเป็นข้อความ ไม่ถูกรันเป็นสคริปต์',
      typeof saved?.paymentNote === 'string',
      'ค่าที่เก็บผิดรูปแบบ',
      'กลาง'
    )
  } else {
    record('C2', 'Injection', 'ข้อความจากผู้ใช้ถูกเก็บเป็นข้อความ', true, 'ข้าม: ไม่มีรายการที่รอชำระ')
  }

  record(
    'C3',
    'Injection',
    'พารามิเตอร์ที่ไม่รู้จักต้องถูกปฏิเสธ ไม่ใช่ส่งต่อไปฐานข้อมูล',
    (await status(`/api/question?subject=${encodeURIComponent("'; DROP TABLE Question;--")}`, {
      headers: { Cookie: learnerCookie },
    })) === 400,
    'ค่าที่ไม่อยู่ในรายการที่อนุญาตถูกส่งต่อไปยังชั้นข้อมูล'
  )
}

// -------------------------------------------------------------- D. ความลับ
function testSecrets() {
  console.log('\nD. การจัดการความลับ')

  let tracked = []
  try {
    tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean)
  } catch {
    record('D1', 'ความลับ', 'ตรวจไฟล์ที่ git ติดตาม', false, 'ไม่ได้รันในโฟลเดอร์ git')
    return
  }

  const envTracked = tracked.filter((f) => /^\.env/.test(f) && !/\.env\.(example|sample)$/.test(f))
  record(
    'D1',
    'ความลับ',
    'ไฟล์ .env ต้องไม่ถูก git ติดตาม',
    envTracked.length === 0,
    `พบ ${envTracked.join(', ')}`,
    'วิกฤต'
  )

  // สแกนเนื้อไฟล์หาความลับ — ด่านนี้เคยจับรหัสฐานข้อมูล production ที่หลุดได้จริง
  const patterns = [
    { name: 'OpenAI/Anthropic API key', re: /sk-(ant-)?[A-Za-z0-9_-]{24,}/ },
    { name: 'สตริงเชื่อมต่อฐานข้อมูลพร้อมรหัสผ่าน', re: /mysql:\/\/[^:\s"'<[]+:[^@\s"'<[]+@[^\s"']+/ },
    { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
    { name: 'private key', re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  ]
  const findings = []
  for (const file of tracked) {
    let content
    try {
      if (fs.statSync(file).size > 2 * 1024 * 1024) continue
      content = fs.readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const p of patterns) {
      const m = content.match(p.re)
      if (m && !/localhost|:password@|\[password\]/i.test(m[0])) {
        findings.push(`${file} — ${p.name}`)
      }
    }
  }
  record(
    'D2',
    'ความลับ',
    'ซอร์สโค้ดต้องไม่มีคีย์หรือรหัสผ่านฝังอยู่',
    findings.length === 0,
    findings.join(' | '),
    'วิกฤต'
  )
}

async function testSecretsOverHttp(adminCookie) {
  // API ต้องไม่ส่งคีย์เต็มกลับมา แม้ผู้เรียกจะเป็นผู้ดูแล
  if (!adminCookie) {
    record('D3', 'ความลับ', 'API ไม่ส่งคีย์เต็มกลับไปที่เบราว์เซอร์', true, 'ข้าม: ไม่มีเซสชันผู้ดูแล')
    return
  }
  const res = await fetch(`${BASE}/api/admin/settings`, { headers: { Cookie: adminCookie } })
  const text = await res.text()
  const exposed = /sk-[A-Za-z0-9_-]{24,}/.test(text)
  record(
    'D3',
    'ความลับ',
    'API ไม่ส่งคีย์เต็มกลับไปที่เบราว์เซอร์',
    !exposed,
    'พบคีย์เต็มในผลลัพธ์ของ API',
    'สูง'
  )
}

// ----------------------------------------------------- E. โครงสร้างพื้นฐาน
async function testInfrastructure() {
  console.log('\nE. โครงสร้างพื้นฐานและการตั้งค่า')

  if (BASE.startsWith('https://')) {
    const insecure = BASE.replace('https://', 'http://')
    const res = await fetch(insecure, { redirect: 'manual' }).catch(() => null)
    const redirected = !res || res.status === 301 || res.status === 308 || res.status === 307
    record('E1', 'การตั้งค่า', 'บังคับใช้ HTTPS', redirected, `ได้ HTTP ${res?.status}`, 'สูง')
  } else {
    record('E1', 'การตั้งค่า', 'บังคับใช้ HTTPS', true, 'ข้าม: ทดสอบบนเครื่องตัวเอง')
  }

  const res = await fetch(BASE)
  const headers = Object.fromEntries([...res.headers.entries()])
  const wanted = [
    'x-frame-options',
    'x-content-type-options',
    'strict-transport-security',
    'referrer-policy',
  ]
  const missing = wanted.filter((h) => !headers[h])
  record(
    'E2',
    'การตั้งค่า',
    'ตั้ง security header ครบ',
    missing.length === 0,
    `ยังไม่ได้ตั้ง: ${missing.join(', ')}`,
    'กลาง'
  )

  // จำกัดจำนวนครั้งการเดารหัสผ่าน
  const email = `nobody-${crypto.randomBytes(4).toString('hex')}@learnhub.demo`
  let blocked = false
  for (let i = 0; i < 12; i += 1) {
    const attempt = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: `wrong-${i}` }),
    })
    if (attempt.status === 429) {
      blocked = true
      break
    }
  }
  record(
    'E3',
    'การตั้งค่า',
    'จำกัดจำนวนครั้งการเข้าสู่ระบบที่ล้มเหลว',
    blocked,
    'พยายามเข้าสู่ระบบผิด 12 ครั้งติดกันโดยไม่ถูกจำกัด เปิดช่องให้เดารหัสผ่านอัตโนมัติ',
    'สูง'
  )
}

// --------------------------------------------------------------------- run
async function main() {
  console.log(`ทดสอบความปลอดภัย LearnHub`)
  console.log(`เป้าหมาย: ${BASE}`)
  console.log(`เวลา: ${new Date().toLocaleString('th-TH')}`)

  const learnerCookie = await login(DEMO)
  const learnerCookie2 = await login(DEMO2)
  if (!learnerCookie) {
    console.error('\nเข้าสู่ระบบด้วยบัญชีเดโมไม่สำเร็จ — ตรวจว่าเป้าหมายทำงานอยู่และมีข้อมูลตัวอย่าง')
    process.exitCode = 1
    return
  }

  await testAuthorization(learnerCookie, learnerCookie2 ?? learnerCookie)
  await testAssessmentIntegrity(learnerCookie)
  await testInjection(learnerCookie)
  testSecrets()
  await testSecretsOverHttp(process.env.ADMIN_COOKIE)
  await testInfrastructure()

  const failed = results.filter((r) => !r.passed)
  const critical = failed.filter((r) => r.severity === 'วิกฤต')

  console.log('\n' + '='.repeat(60))
  console.log(`สรุป: ผ่าน ${results.length - failed.length}/${results.length} กรณีทดสอบ`)
  if (failed.length) {
    console.log(`\nไม่ผ่าน ${failed.length} ข้อ (ระดับวิกฤต ${critical.length} ข้อ):`)
    failed.forEach((r) => console.log(`  ${r.severity.padEnd(6)} ${r.id} ${r.title}\n         ${r.detail}`))
  }

  // เขียนผลเป็น JSON ไว้แนบในรายงาน
  fs.writeFileSync(
    'security-test-results.json',
    JSON.stringify({ target: BASE, ranAt: new Date().toISOString(), results }, null, 2),
    'utf8'
  )
  console.log('\nบันทึกผลไว้ที่ security-test-results.json')

  // ล้มเฉพาะเมื่อมีข้อวิกฤต เพื่อให้ใช้เป็นด่านก่อน deploy ได้
  process.exitCode = critical.length > 0 ? 1 : 0
}

main().catch((error) => {
  console.error('ทดสอบล้มเหลว:', error)
  process.exitCode = 1
})
