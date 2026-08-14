/**
 * ติดแท็กหัวข้อให้ข้อสอบทุกข้อ
 *
 *   node scripts/tag-question-topics.mjs [--dry]
 *
 * ระบบเดิมรู้แค่ "ระดับ" กับ "หมวดกว้าง ๆ" (grammar/vocabulary/reading) ซึ่งบอกไม่ได้ว่า
 * ผู้เรียนพลาดเรื่องอะไร แท็กหัวข้อคือตัวเชื่อมระหว่างข้อที่ตอบผิดกับคอร์สที่สอนเรื่องนั้น
 *
 * จับหัวข้อด้วยกฎ (กติกาแรกที่ตรงชนะ) จากทั้งโจทย์ ตัวเลือก และคำอธิบาย
 * รันซ้ำได้ และมี --dry ให้ดูผลก่อนเขียนจริง
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes('--dry')

/** หัวข้อทั้งหมดที่ระบบรู้จัก — ต้องตรงกับ topics ของคอร์ส */
export const TOPICS = {
  'verb-to-be': 'Verb to be',
  articles: 'Articles (a/an/the)',
  plurals: 'คำนามพหูพจน์',
  'pronouns-possessives': 'สรรพนามและการแสดงความเป็นเจ้าของ',
  'present-simple': 'Present simple',
  'present-continuous': 'Present continuous',
  'past-simple': 'Past simple',
  'wh-questions': 'การตั้งคำถาม',
  prepositions: 'คำบุพบท',
  comparatives: 'การเปรียบเทียบ',
  quantifiers: 'ปริมาณ (some/any/much/many)',
  'modals-basic': 'Modal verbs พื้นฐาน',
  future: 'การพูดถึงอนาคต',
  'adjectives-adverbs': 'คำคุณศัพท์และคำวิเศษณ์',
  'present-perfect': 'Present perfect',
  'past-perfect': 'Past perfect',
  conditionals: 'ประโยคเงื่อนไข',
  passive: 'Passive voice',
  'reported-speech': 'การเล่าความ',
  'relative-clauses': 'Relative clauses',
  'gerund-infinitive': 'Gerund และ Infinitive',
  'modals-advanced': 'Modal verbs ขั้นสูง',
  'used-to': 'used to / be used to',
  inversion: 'Inversion',
  'phrasal-verbs': 'Phrasal verbs',
  collocations: 'คำที่ใช้คู่กัน (collocations)',
  'linking-words': 'คำเชื่อมและการขัดแย้ง',
  subjunctive: 'Subjunctive',
  'participle-clauses': 'Participle clauses',
  idioms: 'สำนวน',
  'register-nuance': 'ระดับภาษาและนัยของคำ',
  'vocabulary-precision': 'การเลือกใช้คำให้แม่น',
  'reading-detail': 'อ่านจับใจความ: รายละเอียด',
  'reading-main-idea': 'อ่านจับใจความ: ใจความหลัก',
  'reading-inference': 'อ่านจับใจความ: ตีความและน้ำเสียง',
  'word-order': 'ลำดับคำในประโยค',
  'word-formation': 'การสร้างคำ (นาม/คุณศัพท์/กริยา)',
}

/**
 * กฎจับหัวข้อ เรียงจากเฉพาะเจาะจงไปกว้าง — กติกาแรกที่ตรงเป็นผู้ชนะ
 * ตรวจกับข้อความรวม (โจทย์ + ตัวเลือก + คำอธิบาย) ที่แปลงเป็นตัวพิมพ์เล็กแล้ว
 */
const RULES = [
  // อ่านจับใจความ แยกตามชนิดคำถาม ต้องมาก่อนกฎไวยากรณ์ทั้งหมด
  { topic: 'reading-main-idea', reading: true, test: (t) => /main point|main idea|passage arguing|central|ใจความหลัก/.test(t) },
  { topic: 'reading-inference', reading: true, test: (t) => /suggest|imply|implies|attitude|view of|convey|writer'?s|objection|conclude|position|criticism|point is|ตีความ|เสียดสี|นัย|จุดยืน/.test(t) },
  { topic: 'reading-detail', reading: true, test: () => true },

  // ไวยากรณ์เฉพาะโครงสร้าง
  // inversion ตรวจที่ "ต้นโจทย์" เท่านั้น — ถ้าตรวจทั้งก้อน คำว่า rarely ที่บังเอิญอยู่ใน
  // ตัวเลือกของข้อคำศัพท์จะถูกจับมาเป็น inversion ด้วย (เคยจับเกิน 4 ข้อ)
  {
    topic: 'inversion',
    stem: true,
    test: (t) => /^(hardly|no sooner|rarely|little d|not only|under no circumstances|only after|only in retrospect|so convincing|so thoroughly|such |not for a moment)/.test(t),
  },
  { topic: 'subjunctive', test: (t) => /\b(recommended that|insisted that|demand that|suggest that)\b|subjunctive|กริยารูปฐาน/.test(t) },
  { topic: 'participle-clauses', test: (t) => /participle|constructed in the|rarely encountered|ขยายคำนาม.*ช่องที่ 3/.test(t) },
  // เงื่อนไขแบบสลับรูป (Were the proposal…, Had she known…) นับเป็น conditionals ไม่ใช่ inversion
  { topic: 'conditionals', test: (t) => /\bif i (were|had)\b|\bif it (rains|had)\b|conditional|เงื่อนไข|were it not for|had she known|had the warnings|wish i|would have (passed|been)|were the (evidence|proposal)|were .* ever to/.test(t) },
  { topic: 'passive', test: (t) => /passive|was built|being considered|is being|ถูกกระทำ|was completed|ถูกสร้าง/.test(t) },
  { topic: 'reported-speech', test: (t) => /reported speech|asked me where|said he|เล่าความ|เลื่อนกาล/.test(t) },
  { topic: 'relative-clauses', test: (t) => /relative|\bwho lives\b|\bi borrowed\b|which was published|อนุประโยคขยาย|the man ___ lives|it was his persistence/.test(t) },
  { topic: 'word-order', stem: true, test: (t) => /correct word order|correct sentence|ลำดับคำ/.test(t) },
  { topic: 'used-to', test: (t) => /used to|be used to|เคยทำในอดีต|คุ้นเคยกับ/.test(t) },
  { topic: 'present-perfect', test: (t) => /present perfect|have lived|has been working|have never been|since \d|for (three|six) years|ever been/.test(t) },
  { topic: 'past-perfect', test: (t) => /past perfect|had already started|had been working|by the time we arrived|เกิดก่อนอีกเหตุการณ์/.test(t) },
  { topic: 'modals-advanced', test: (t) => /must have|should have|could have|have told me|คาดเดาเรื่องในอดีต|น่าจะทำแต่ไม่ได้ทำ/.test(t) },
  { topic: 'gerund-infinitive', test: (t) => /gerund|infinitive|look forward to|enjoys? |denied |objected to|worth |managed to|would rather|far from|stop short of|ตามด้วย -ing|ตามด้วย gerund/.test(t) },
  { topic: 'future', test: (t) => /\bgoing to\b|will have completed|future perfect|by this time next year|พูดถึงอนาคต|นัดหมายที่วางไว้/.test(t) },
  { topic: 'comparatives', test: (t) => /\b(taller|bigger|better|best|than)\b|comparative|superlative|เปรียบเทียบ/.test(t) },
  { topic: 'quantifiers', test: (t) => /\b(some|any|much|many|how many)\b|นับได้|นับไม่ได้|quantifier/.test(t) },
  { topic: 'modals-basic', test: (t) => /\b(can|could|must|mustn'?t|should|have to|need)\b|ความจำเป็น|ห้าม/.test(t) },
  { topic: 'present-continuous', test: (t) => /present continuous|am watching|were you doing|กำลังเกิด|past continuous/.test(t) },
  { topic: 'past-simple', test: (t) => /past simple|yesterday|last (weekend|week|summer)|\bwent\b|อดีตจบแล้ว/.test(t) },
  { topic: 'present-simple', test: (t) => /present simple|every (day|morning)|drinks? coffee|เติม -s|ประธานเอกพจน์/.test(t) },
  { topic: 'verb-to-be', test: (t) => /verb to be|\b(am|is|are)\b.*(correct|student|sister|friends)|ประธานพหูพจน์.*are/.test(t) },
  { topic: 'articles', test: (t) => /\b(a|an|the)\b.*(apple|engineer|article)|articles?\b|เสียงสระ จึงใช้ an/.test(t) },
  { topic: 'plurals', test: (t) => /plural|children|พหูพจน์/.test(t) },
  { topic: 'wh-questions', test: (t) => /\b(what|where|when|who|how much|how many)\b.*\?|คำถาม/.test(t) },
  { topic: 'pronouns-possessives', test: (t) => /possessive|belongs to me|\bmy\b|สรรพนาม|ความเป็นเจ้าของ/.test(t) },
  { topic: 'prepositions', test: (t) => /preposition|\b(under|on sunday|at 7|interested in|good at)\b|บุพบท/.test(t) },
  { topic: 'linking-words', test: (t) => /\b(although|despite|however|albeit|so |because)\b|คำเชื่อม|ขัดแย้ง/.test(t) },
  { topic: 'phrasal-verbs', test: (t) => /phrasal|take off|called off|put off|come into effect|เลื่อนออกไป|ยกเลิก/.test(t) },
  { topic: 'adjectives-adverbs', test: (t) => /\b(boring|bored|confusing|well|good at)\b|คำวิเศษณ์|คำคุณศัพท์/.test(t) },

  // คำศัพท์และการใช้ภาษาระดับสูง
  { topic: 'idioms', test: (t) => /idiom|grain of salt|hold forth|loggerheads|pyrrhic|damn with faint praise|สำนวน/.test(t) },
  { topic: 'register-nuance', test: (t) => /register|formal|understatement|tone|perfunctory|economical with the truth|ระดับภาษา|น้ำเสียง/.test(t) },
  { topic: 'collocations', test: (t) => /collocation|cast doubt|consistent with|in effect|ใช้คู่กัน|สำนวนคงที่/.test(t) },
  { topic: 'word-formation', test: (t) => /company'?s ___ to adapt|noun form|สร้างคำ|รูปคำนามจากกริยา/.test(t) },
]

function detectTopic(question) {
  const options = Array.isArray(question.options)
    ? question.options.map((o) => o.text).join(' ')
    : ''
  const haystack = `${question.question} ${options} ${question.explanation}`.toLowerCase()
  const stem = question.question.trim().toLowerCase()
  const isReading = question.category === 'reading'

  for (const rule of RULES) {
    if (rule.reading && !isReading) continue
    if (!rule.reading && isReading) continue
    if (rule.test(rule.stem ? stem : haystack)) return rule.topic
  }
  // ข้อคำศัพท์ที่ไม่เข้ากฎไหนเลย ถือเป็นการเลือกใช้คำ
  return question.category === 'vocabulary' ? 'vocabulary-precision' : null
}

async function main() {
  const questions = await prisma.question.findMany()
  const counts = {}
  const untagged = []
  let updated = 0

  for (const question of questions) {
    const topic = detectTopic(question)
    if (!topic) {
      untagged.push(question)
      continue
    }
    counts[topic] = (counts[topic] || 0) + 1
    if (!DRY_RUN && question.topic !== topic) {
      await prisma.question.update({ where: { id: question.id }, data: { topic } })
      updated += 1
    }
  }

  console.log(`ข้อสอบทั้งหมด ${questions.length} ข้อ · ติดแท็กได้ ${questions.length - untagged.length} ข้อ · ไม่เข้ากฎ ${untagged.length} ข้อ`)
  if (!DRY_RUN) console.log(`อัปเดตในฐานข้อมูล ${updated} ข้อ`)

  console.log('\nจำนวนข้อต่อหัวข้อ:')
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([topic, count]) => {
      console.log(`  ${String(count).padStart(3)}  ${topic}  (${TOPICS[topic] ?? '??'})`)
    })

  if (untagged.length) {
    console.log('\nข้อที่ยังไม่เข้ากฎ (ต้องเพิ่มกฎ):')
    untagged.slice(0, 15).forEach((q) => console.log(`  [${q.cefrLevel}/${q.category}] ${q.question.slice(0, 70)}`))
  }
}

main()
  .catch((error) => {
    console.error('tag-question-topics failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
