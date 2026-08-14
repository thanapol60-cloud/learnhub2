/**
 * สร้าง Sourcecode.zip สำหรับส่งงาน
 *
 *   node scripts/package-source.mjs
 *
 * รวมเฉพาะไฟล์ที่ git ติดตามอยู่ จึงได้ผลลัพธ์เหมือนกันทุกครั้งและ
 * ไม่มีทางหลุด .env, node_modules หรือ .next เข้าไปโดยไม่ตั้งใจ
 *
 * ก่อนบีบอัดจะสแกนหาความลับที่อาจปนมา ถ้าเจอจะหยุดทันทีและไม่สร้างไฟล์
 */
import { execFileSync } from 'child_process'
import fs from 'fs'

const OUTPUT = 'Sourcecode.zip'

/**
 * รูปแบบของความลับที่ต้องไม่หลุดออกไปกับซอร์สโค้ด
 * ตรวจจากเนื้อไฟล์จริง ไม่ใช่แค่ชื่อไฟล์ เพราะคีย์อาจถูกวางไว้ในโค้ดโดยไม่ตั้งใจ
 */
const SECRET_PATTERNS = [
  { name: 'Anthropic API key', re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: 'OpenAI API key', re: /sk-[A-Za-z0-9]{32,}/ },
  // ยกเว้นค่าตัวอย่างที่ชี้ไป localhost หรือใช้คำว่า password ตรง ๆ ซึ่งเป็น placeholder
  {
    name: 'สตริงเชื่อมต่อฐานข้อมูลพร้อมรหัสผ่าน',
    re: /mysql:\/\/[^:\s"']+:[^@\s"']+@[^\s"']+/,
    // ตัวอย่างในเอกสารใช้วงเล็บเหลี่ยม/มุม หรือชี้ไป localhost ซึ่งไม่ใช่ค่าจริง
    ignore: /[\[<]|mysql:\/\/[^:\s"']+:(password|pass|xxx+|your[-_]?password)@|@localhost/i,
  },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'private key', re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
]

/**
 * ไฟล์ที่ต้องไม่อยู่ในแพ็กเกจไม่ว่ากรณีใด
 * .env.example เป็นไฟล์ตัวอย่างที่มีแต่ placeholder จึงต้องอยู่ในแพ็กเกจ
 * เพราะเป็นเอกสารบอกว่าระบบต้องใช้ตัวแปรอะไรบ้าง
 */
const ALLOWED_ENV = /^\.env\.(example|sample|template)$/
const FORBIDDEN = [/^\.env/, /^node_modules\//, /^\.next\//]
const isForbidden = (file) =>
  !ALLOWED_ENV.test(file) && FORBIDDEN.some((re) => re.test(file))

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function main() {
  // ไฟล์ที่ git ติดตาม = ไฟล์ที่ตั้งใจเผยแพร่ ทุกอย่างใน .gitignore จึงถูกกันออกโดยอัตโนมัติ
  let files
  try {
    files = run('git', ['ls-files']).split('\n').map((f) => f.trim()).filter(Boolean)
  } catch {
    console.error('ต้องรันในโฟลเดอร์ที่เป็น git repository')
    process.exitCode = 1
    return
  }

  if (!files.length) {
    console.error('ไม่พบไฟล์ที่ git ติดตาม')
    process.exitCode = 1
    return
  }

  // ด่านที่ 1 — ไฟล์ต้องห้าม
  const forbidden = files.filter(isForbidden)
  if (forbidden.length) {
    console.error('พบไฟล์ที่ห้ามรวมในแพ็กเกจ (git ติดตามไฟล์เหล่านี้อยู่ ต้องเอาออกก่อน):')
    forbidden.forEach((f) => console.error('  -', f))
    process.exitCode = 1
    return
  }

  // ด่านที่ 2 — สแกนเนื้อไฟล์หาความลับ
  const findings = []
  for (const file of files) {
    let content
    try {
      const stat = fs.statSync(file)
      if (stat.size > 2 * 1024 * 1024) continue // ข้ามไฟล์ใหญ่ ซึ่งไม่ใช่ซอร์สโค้ด
      content = fs.readFileSync(file, 'utf8')
    } catch {
      continue // ไฟล์ไบนารีหรืออ่านไม่ได้
    }
    for (const pattern of SECRET_PATTERNS) {
      const match = content.match(pattern.re)
      if (match && !(pattern.ignore && pattern.ignore.test(match[0]))) {
        const line = content.slice(0, match.index).split('\n').length
        findings.push(`${file}:${line} — ${pattern.name}`)
      }
    }
  }

  if (findings.length) {
    console.error('พบข้อมูลที่อาจเป็นความลับในซอร์สโค้ด จึงไม่สร้างไฟล์ zip:')
    findings.forEach((f) => console.error('  -', f))
    console.error('\nนำออกจากโค้ดแล้วย้ายไปไว้ใน environment variable ก่อนรันใหม่')
    process.exitCode = 1
    return
  }

  // ใช้ git archive บีบอัด เพราะรักษาโครงสร้างโฟลเดอร์ไว้ครบ
  // (Compress-Archive ของ PowerShell แบนไฟล์มาไว้ระดับบนสุด ทำให้ไฟล์ชื่อซ้ำอย่าง
  //  page.tsx ในหลายโฟลเดอร์ทับกันจนหายไป)
  // git archive ทำงานกับ commit ล่าสุด จึงต้องเตือนถ้ายังมีงานค้างไม่ได้ commit
  const dirty = run('git', ['status', '--porcelain']).trim()
  if (dirty) {
    console.warn('⚠️  มีไฟล์ที่ยังไม่ได้ commit — zip จะสะท้อนเฉพาะสิ่งที่ commit แล้ว:')
    dirty
      .split('\n')
      .slice(0, 10)
      .forEach((line) => console.warn('   ', line.trim()))
    console.warn('    commit ก่อนแล้วรันใหม่ ถ้าต้องการให้การเปลี่ยนแปลงเหล่านี้อยู่ในแพ็กเกจ\n')
  }

  if (fs.existsSync(OUTPUT)) fs.unlinkSync(OUTPUT)

  try {
    run('git', ['archive', '--format=zip', '-o', OUTPUT, 'HEAD'])
  } catch (error) {
    console.error('บีบอัดไม่สำเร็จ:', error.message)
    process.exitCode = 1
    return
  }

  const size = fs.statSync(OUTPUT).size
  console.log(`สร้าง ${OUTPUT} สำเร็จ`)
  console.log(`  ไฟล์ทั้งหมด ${files.length} ไฟล์ · ขนาด ${(size / 1024 / 1024).toFixed(2)} MB`)
  console.log('  ผ่านการตรวจ: ไม่มี .env / node_modules / .next และไม่พบความลับในเนื้อไฟล์')
}

main()
