/**
 * สร้างคอร์สย่อยแบบเจาะหัวข้อ เพื่อรองรับ "จุดที่ผู้เรียนตอบผิด"
 *
 *   node scripts/seed-focused-courses.mjs
 *
 * คอร์สประจำระดับ 6 ตัวเดิมกว้างเกินกว่าจะแนะนำจากผลสอบได้ — ผู้เรียนที่พลาดเฉพาะ
 * เรื่อง conditionals ไม่ควรถูกส่งไปเรียนคอร์ส B1 ทั้งคอร์ส คอร์สในไฟล์นี้จับคู่
 * 1 คอร์ส = 1–2 หัวข้อ ตรงกับ Question.topic ที่ติดแท็กไว้แล้ว
 *
 * รันซ้ำได้: อัปเดตคอร์สที่มีชื่อเดิมแทนการสร้างซ้ำ
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** คลิปตัวอย่างที่ตรวจแล้วว่าเล็กและเล่นได้ (ดู scripts/seed-demo.mjs) */
const CLIPS = [
  'https://mdn.github.io/shared-assets/videos/flower.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
  'https://media.w3.org/2010/05/video/movie_300.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
]

const PRICE_BY_LEVEL = { A1: 190, A2: 190, B1: 290, B2: 290, C1: 390, C2: 390 }

/**
 * คอร์สเจาะหัวข้อ: level กำหนดราคาและเกณฑ์แนะนำ, topics ต้องตรงกับแท็กในคลังข้อสอบ,
 * lessons คือชื่อบทเรียน (สร้างเป็น Video ผูกกับคอร์ส)
 */
const FOCUSED = [
  {
    title: 'Verb to be ให้แม่นใน 2 ชั่วโมง',
    level: 'A1',
    topics: ['verb-to-be'],
    description: 'ปูพื้น am / is / are ให้ใช้ถูกทุกประธาน ทั้งประโยคบอกเล่า ปฏิเสธ และคำถาม',
    outcomes: ['เลือก am/is/are ตามประธานได้ถูก', 'แต่งประโยคปฏิเสธและคำถามได้', 'แยก verb to be กับกริยาทั่วไป'],
    lessons: ['am / is / are กับประธานแต่ละแบบ', 'ปฏิเสธและคำถามด้วย verb to be'],
  },
  {
    title: 'A / An / The ใช้ยังไงไม่ให้พลาด',
    level: 'A1',
    topics: ['articles'],
    description: 'เจาะเรื่อง articles ที่คนไทยพลาดบ่อยที่สุด เพราะภาษาไทยไม่มีคำนำหน้านาม',
    outcomes: ['เลือก a หรือ an จากเสียงไม่ใช่ตัวสะกด', 'รู้ว่าเมื่อไรใช้ the', 'รู้ว่าเมื่อไรไม่ต้องใส่อะไรเลย'],
    lessons: ['a กับ an ต่างกันที่เสียง', 'the และกรณีที่ไม่ต้องใช้ article'],
  },
  {
    title: 'คำนามพหูพจน์และลำดับคำในประโยค',
    level: 'A1',
    topics: ['plurals', 'word-order'],
    description: 'รูปพหูพจน์ที่ผิดรูป และการเรียงคำในประโยคบอกเล่าให้ถูกตำแหน่ง',
    outcomes: ['เปลี่ยนคำนามเป็นพหูพจน์ได้รวมถึงรูปผิดปกติ', 'วางคำวิเศษณ์ในตำแหน่งที่ถูก', 'เรียงประโยคพื้นฐานได้ถูกลำดับ'],
    lessons: ['พหูพจน์ปกติและผิดรูป', 'ลำดับคำ: ประธาน กริยา กรรม และคำขยาย'],
  },
  {
    title: 'Present Simple ใช้จริงในชีวิตประจำวัน',
    level: 'A1',
    topics: ['present-simple'],
    description: 'เล่ากิจวัตรและความจริงทั่วไป พร้อมกฎเติม -s ที่ประธานเอกพจน์',
    outcomes: ['เติม -s ให้ถูกกับประธานบุรุษที่สาม', 'ใช้ do/does ในประโยคปฏิเสธและคำถาม', 'เล่ากิจวัตรประจำวันได้'],
    lessons: ['กฎเติม -s และข้อยกเว้น', 'do / does ในคำถามและปฏิเสธ'],
  },
  {
    title: 'ตั้งคำถามด้วย Wh- ให้ถูกรูป',
    level: 'A1',
    topics: ['wh-questions'],
    description: 'What / Where / When / Who / How much / How many และลำดับคำในประโยคคำถาม',
    outcomes: ['เลือกคำถาม Wh- ให้ตรงกับคำตอบที่ต้องการ', 'เรียงลำดับคำในคำถามได้ถูก', 'ถามราคาและจำนวนได้'],
    lessons: ['Wh- แต่ละตัวใช้ถามอะไร', 'ลำดับคำในประโยคคำถาม'],
  },
  {
    title: 'คำบุพบทบอกเวลาและสถานที่',
    level: 'A1',
    topics: ['prepositions'],
    description: 'in / on / at และคู่คำที่ต้องจำ เช่น good at, interested in',
    outcomes: ['ใช้ in/on/at กับเวลาได้ถูก', 'ใช้ in/on/at กับสถานที่ได้ถูก', 'จำคู่คำกริยา+บุพบทที่ใช้บ่อย'],
    lessons: ['in / on / at กับเวลาและสถานที่', 'คู่คำที่ต้องใช้บุพบทเฉพาะ'],
  },
  {
    title: 'Some / Any / Much / Many และการบอกปริมาณ',
    level: 'A1',
    topics: ['quantifiers'],
    description: 'แยกคำนามนับได้กับนับไม่ได้ แล้วเลือกคำบอกปริมาณให้ถูกบริบท',
    outcomes: ['แยกคำนามนับได้กับนับไม่ได้', 'เลือก some/any ตามชนิดประโยค', 'ใช้ much/many/how many ได้ถูก'],
    lessons: ['นับได้กับนับไม่ได้ ต่างกันตรงไหน', 'some / any / much / many ในแต่ละบริบท'],
  },
  {
    title: 'สรรพนามและการแสดงความเป็นเจ้าของ',
    level: 'A1',
    topics: ['pronouns-possessives'],
    description: 'I/me/my/mine และการบอกว่าของสิ่งนั้นเป็นของใคร',
    outcomes: ['แยกสรรพนามประธานกับกรรม', 'ใช้ my/your/his ได้ถูกตำแหน่ง', 'ใช้ mine/yours แทนคำนามได้'],
    lessons: ['สรรพนามประธานและกรรม', 'คำแสดงความเป็นเจ้าของ'],
  },
  {
    title: 'Past Simple เล่าเรื่องที่ผ่านมา',
    level: 'A2',
    topics: ['past-simple'],
    description: 'กริยาช่องสองทั้งแบบเติม -ed และกริยาผิดรูปที่ใช้บ่อยที่สุด',
    outcomes: ['ผันกริยาช่องสองได้ทั้งปกติและผิดรูป', 'ใช้ did ในคำถามและปฏิเสธ', 'เล่าเหตุการณ์ในอดีตได้ต่อเนื่อง'],
    lessons: ['กริยาช่องสอง: ปกติและผิดรูป', 'did ในคำถามและประโยคปฏิเสธ'],
  },
  {
    title: 'Present Continuous กับเหตุการณ์ที่กำลังเกิด',
    level: 'A2',
    topics: ['present-continuous'],
    description: 'แยกให้ออกระหว่างสิ่งที่ทำอยู่ตอนนี้กับสิ่งที่ทำเป็นประจำ',
    outcomes: ['สร้างรูป be + V-ing ได้ถูก', 'แยก present simple กับ continuous', 'ใช้ past continuous เล่าฉากหลังได้'],
    lessons: ['be + V-ing และคำบอกเวลาที่มากับมัน', 'เทียบกับ present simple'],
  },
  {
    title: 'การเปรียบเทียบ: -er, more, the most',
    level: 'A2',
    topics: ['comparatives'],
    description: 'เปรียบเทียบสองสิ่งและขั้นสูงสุด รวมถึงรูปผิดปกติอย่าง good/better/best',
    outcomes: ['เลือกใช้ -er หรือ more ได้ถูก', 'ใช้ than ในการเปรียบเทียบ', 'ใช้ขั้นสูงสุดพร้อม the'],
    lessons: ['-er / more และการใช้ than', 'ขั้นสูงสุดและรูปผิดปกติ'],
  },
  {
    title: 'Modal Verbs พื้นฐาน: can, must, should, have to',
    level: 'A2',
    topics: ['modals-basic'],
    description: 'บอกความสามารถ ความจำเป็น ข้อห้าม และคำแนะนำ ให้ตรงระดับความหนักแน่น',
    outcomes: ['แยก must กับ have to', "แยก mustn't (ห้าม) กับ don't have to (ไม่จำเป็น)", 'ใช้ should ให้คำแนะนำ'],
    lessons: ['can / could และ must / have to', "mustn't กับ don't have to ที่คนสับสนที่สุด"],
  },
  {
    title: 'พูดถึงอนาคต: will, going to, present continuous',
    level: 'A2',
    topics: ['future'],
    description: 'สามวิธีพูดถึงอนาคตที่ความหมายไม่เหมือนกัน และเลือกใช้ให้ตรงสถานการณ์',
    outcomes: ['ใช้ will กับการตัดสินใจตอนนั้น', 'ใช้ going to กับแผนที่วางไว้', 'ใช้ present continuous กับนัดหมาย'],
    lessons: ['will กับ going to ต่างกันอย่างไร', 'present continuous สำหรับนัดหมาย'],
  },
  {
    title: 'คำคุณศัพท์และคำวิเศษณ์ -ed / -ing',
    level: 'A2',
    topics: ['adjectives-adverbs'],
    description: 'boring หรือ bored, good หรือ well — เลือกให้ถูกทั้งรูปและตำแหน่ง',
    outcomes: ['แยก -ed (รู้สึก) กับ -ing (ทำให้รู้สึก)', 'เปลี่ยนคำคุณศัพท์เป็นคำวิเศษณ์', 'วางคำวิเศษณ์ในตำแหน่งที่ถูก'],
    lessons: ['-ed กับ -ing ใช้ต่างกันตรงไหน', 'good / well และตำแหน่งคำวิเศษณ์'],
  },
  {
    title: 'Present Perfect ที่ใช้ได้จริง',
    level: 'B1',
    topics: ['present-perfect'],
    description: 'have/has + ช่อง 3 กับ for, since, ever, never และเส้นแบ่งกับ past simple',
    outcomes: ['แยก for กับ since', 'เลือกระหว่าง present perfect กับ past simple', 'ใช้ ever/never/already/yet ได้ถูก'],
    lessons: ['for / since และคำบอกเวลาอื่น', 'เทียบกับ past simple: เลือกอันไหนดี'],
  },
  {
    title: 'Past Perfect และการเรียงลำดับเหตุการณ์',
    level: 'B1',
    topics: ['past-perfect'],
    description: 'เล่าเรื่องที่มีสองเหตุการณ์ในอดีต ให้ผู้ฟังรู้ว่าอะไรเกิดก่อน',
    outcomes: ['ใช้ had + ช่อง 3 กับเหตุการณ์ที่เกิดก่อน', 'ใช้ by the time / before / after', 'ใช้ past perfect continuous กับช่วงเวลา'],
    lessons: ['had + ช่อง 3 กับลำดับเหตุการณ์', 'past perfect continuous'],
  },
  {
    title: 'ประโยคเงื่อนไขครบทุกแบบ',
    level: 'B1',
    topics: ['conditionals'],
    description: 'เงื่อนไขแบบที่ 0–3 และแบบสลับรูป (Had I known…) ที่เจอในข้อสอบระดับสูง',
    outcomes: ['แยกเงื่อนไขทั้งสี่แบบ', 'ใช้เงื่อนไขแบบที่ 3 พูดถึงสิ่งที่ไม่ได้เกิด', 'อ่านรูปสลับ Had/Were ออก'],
    lessons: ['เงื่อนไขแบบที่ 0 ถึง 2', 'แบบที่ 3 และรูปสลับ Had / Were'],
  },
  {
    title: 'Passive Voice ทุกกาล',
    level: 'B1',
    topics: ['passive'],
    description: 'เปลี่ยนประโยคให้เน้นสิ่งที่ถูกกระทำ ใช้ได้ทั้งในรายงานและงานเขียนทางการ',
    outcomes: ['สร้าง passive ได้ทุกกาลหลัก', 'รู้ว่าเมื่อไรควรใช้ passive', 'ใช้ passive แบบกำลังดำเนินอยู่'],
    lessons: ['be + ช่อง 3 ในแต่ละกาล', 'เมื่อไรควรใช้ passive มากกว่า active'],
  },
  {
    title: 'Relative Clauses และการขยายคำนาม',
    level: 'B1',
    topics: ['relative-clauses'],
    description: 'who / which / that / whose และความต่างของอนุประโยคแบบมีคอมมากับไม่มี',
    outcomes: ['เลือก who/which/that ได้ถูก', 'แยกอนุประโยคแบบจำกัดความกับให้ข้อมูลเสริม', 'ใช้ whose และ where ได้'],
    lessons: ['who / which / that เลือกอย่างไร', 'อนุประโยคแบบมีคอมมา'],
  },
  {
    title: 'Gerund กับ Infinitive เลือกให้ถูก',
    level: 'B1',
    topics: ['gerund-infinitive'],
    description: 'หลังกริยาหรือบุพบทตัวไหนต้องตามด้วย -ing และตัวไหนต้องตามด้วย to',
    outcomes: ['จำกลุ่มกริยาที่ตามด้วย gerund', 'จำกลุ่มกริยาที่ตามด้วย to + V1', 'รู้ว่า to ที่เป็นบุพบทต้องตามด้วย -ing'],
    lessons: ['กริยาที่ตามด้วย -ing', 'to + V1 และกับดัก look forward to'],
  },
  {
    title: 'Reported Speech และ used to',
    level: 'B1',
    topics: ['reported-speech', 'used-to'],
    description: 'เล่าสิ่งที่คนอื่นพูดโดยเลื่อนกาลให้ถูก และเล่านิสัยในอดีตด้วย used to',
    outcomes: ['เลื่อนกาลในประโยคเล่าความได้ถูก', 'เปลี่ยนคำถามเป็นประโยคเล่าความ', 'แยก used to กับ be used to'],
    lessons: ['กฎการเลื่อนกาล', 'used to / be used to / get used to'],
  },
  {
    title: 'Modal Verbs ขั้นสูง: must have, should have, could have',
    level: 'B2',
    topics: ['modals-advanced'],
    description: 'คาดเดาเรื่องในอดีตและพูดถึงสิ่งที่น่าจะทำแต่ไม่ได้ทำ',
    outcomes: ['ใช้ must have คาดเดาอย่างมั่นใจ', 'ใช้ should have พูดถึงสิ่งที่ควรทำ', 'ใช้ could have / might have บอกความเป็นไปได้'],
    lessons: ['must have / can’t have สำหรับการคาดเดา', 'should have และ could have'],
  },
  {
    title: 'Phrasal Verbs ที่ใช้บ่อยในที่ทำงาน',
    level: 'B2',
    topics: ['phrasal-verbs'],
    description: 'call off, put off, take on, come up with และการแยกกรรมออกจากกริยา',
    outcomes: ['เข้าใจ phrasal verbs ที่ใช้บ่อยในอีเมลและการประชุม', 'รู้ว่าตัวไหนแยกกรรมได้', 'เดาความหมายจากบริบทได้'],
    lessons: ['phrasal verbs ในการทำงาน', 'แยกกรรมได้หรือไม่ได้'],
  },
  {
    title: 'คำเชื่อมและการแสดงความขัดแย้ง',
    level: 'B2',
    topics: ['linking-words'],
    description: 'although, despite, however, albeit — เลือกให้ถูกทั้งความหมายและโครงสร้างที่ตามหลัง',
    outcomes: ['แยก although กับ despite ที่ตามด้วยคนละรูป', 'ใช้ however เชื่อมสองประโยค', 'ร้อยเรียงเหตุผลในย่อหน้าได้'],
    lessons: ['although / though / despite / in spite of', 'however / nevertheless / albeit'],
  },
  {
    title: 'Collocations และการสร้างคำ',
    level: 'B2',
    topics: ['collocations', 'word-formation'],
    description: 'คำที่ต้องใช้คู่กัน เช่น cast doubt, consistent with และการเปลี่ยนรูปคำให้ตรงหน้าที่',
    outcomes: ['จำคู่คำที่เจ้าของภาษาใช้จริง', 'เปลี่ยนกริยาเป็นคำนามได้ถูกรูป', 'เลือกรูปคำให้ตรงตำแหน่งในประโยค'],
    lessons: ['collocations ที่พบบ่อยในงานเขียน', 'การสร้างคำ: นาม คุณศัพท์ กริยา'],
  },
  {
    title: 'Inversion และการเน้นความ',
    level: 'C1',
    topics: ['inversion'],
    description: 'Hardly had…, Not only…, Under no circumstances… โครงสร้างที่ต้องสลับกริยาช่วยมาหน้าประธาน',
    outcomes: ['รู้ว่าคำขึ้นต้นแบบไหนบังคับให้สลับกริยา', 'เขียนประโยค inversion ได้ถูกรูป', 'ใช้ inversion เน้นความในงานเขียนทางการ'],
    lessons: ['คำขึ้นต้นเชิงปฏิเสธที่บังคับ inversion', 'So / Such และ inversion แบบเน้น'],
  },
  {
    title: 'Participle Clauses และ Subjunctive',
    level: 'C1',
    topics: ['participle-clauses', 'subjunctive'],
    description: 'ย่อประโยคด้วย -ing / -ed และรูป subjunctive หลัง recommend, insist, demand',
    outcomes: ['ย่ออนุประโยคด้วย participle ได้', 'ใช้รูปถูกกระทำขึ้นต้นประโยค', 'ใช้กริยารูปฐานหลังกริยาแสดงข้อเสนอ'],
    lessons: ['participle clause แบบทำและถูกกระทำ', 'subjunctive หลัง recommend / insist'],
  },
  {
    title: 'สำนวนอังกฤษที่เจ้าของภาษาใช้จริง',
    level: 'C2',
    topics: ['idioms'],
    description: 'สำนวนที่แปลตรงตัวไม่ได้ และมักโผล่ในบทความและการประชุมระดับสูง',
    outcomes: ['เข้าใจสำนวนจากบริบทแทนการแปลตรงตัว', 'ใช้สำนวนได้ถูกสถานการณ์', 'อ่านบทความที่มีสำนวนได้ลื่นขึ้น'],
    lessons: ['สำนวนในการทำงานและการเจรจา', 'สำนวนในบทความและข่าว'],
  },
  {
    title: 'ระดับภาษาและนัยของคำ',
    level: 'C2',
    topics: ['register-nuance', 'vocabulary-precision'],
    description: 'เลือกคำให้ตรงน้ำหนักและระดับความเป็นทางการ ต่างกันแค่คำเดียวความหมายเปลี่ยน',
    outcomes: ['แยกระดับทางการ กลาง และไม่ทางการ', 'เลือกคำที่ตรงน้ำหนักความหมาย', 'อ่านน้ำเสียงของผู้เขียนออก'],
    lessons: ['ระดับภาษาในงานเขียนและการพูด', 'คำใกล้เคียงที่ความหมายไม่เท่ากัน'],
  },
  {
    title: 'อ่านจับใจความ: หาข้อมูลและใจความหลัก',
    level: 'B1',
    topics: ['reading-detail', 'reading-main-idea'],
    description: 'เทคนิคกวาดหาข้อมูลเฉพาะจุด และสรุปใจความหลักของย่อหน้าให้ไว',
    outcomes: ['หาข้อมูลเฉพาะจุดในบทความได้เร็ว', 'สรุปใจความหลักของย่อหน้าได้', 'แยกใจความหลักออกจากรายละเอียดประกอบ'],
    lessons: ['scanning: กวาดหาข้อมูลเฉพาะจุด', 'skimming: จับใจความหลัก'],
  },
  {
    title: 'อ่านจับใจความ: ตีความและจับน้ำเสียงผู้เขียน',
    level: 'C1',
    topics: ['reading-inference'],
    description: 'อ่านสิ่งที่ผู้เขียนไม่ได้พูดตรง ๆ ทั้งจุดยืน ข้อสงสัย และการเสียดสี',
    outcomes: ['สรุปจุดยืนของผู้เขียนจากคำที่เลือกใช้', 'จับการเสียดสีและการประชด', 'แยกข้อเท็จจริงออกจากความเห็น'],
    lessons: ['อ่านจุดยืนและน้ำเสียง', 'ตีความสิ่งที่ผู้เขียนบอกเป็นนัย'],
  },
]

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
  if (!admin) {
    console.log('ยังไม่มีบัญชีผู้ดูแลระบบ — สร้างก่อนแล้วค่อยรันสคริปต์นี้')
    return
  }

  let created = 0
  let updated = 0
  let clipIndex = 0

  for (const item of FOCUSED) {
    const price = PRICE_BY_LEVEL[item.level]
    const duration = item.lessons.length * 2

    const data = {
      title: item.title,
      description: item.description,
      minCefrLevel: item.level,
      instructorName: 'ทีมวิชาการ LearnHub',
      duration,
      price,
      topics: item.topics,
      isFocused: true,
      learningOutcomes: item.outcomes,
      createdById: admin.id,
      content: { chapters: [] },
    }

    const existing = await prisma.course.findFirst({ where: { title: item.title } })
    let course
    if (existing) {
      course = await prisma.course.update({ where: { id: existing.id }, data })
      updated += 1
      // ล้างบทเรียนเดิมก่อนสร้างใหม่ เพื่อให้รันซ้ำแล้วไม่มีบทซ้อน
      await prisma.video.deleteMany({ where: { courseId: course.id } })
    } else {
      course = await prisma.course.create({ data })
      created += 1
    }

    for (const lesson of item.lessons) {
      await prisma.video.create({
        data: {
          title: lesson,
          description: `บทเรียนในคอร์ส "${item.title}"`,
          videoUrl: CLIPS[clipIndex % CLIPS.length],
          duration: 600 + (clipIndex % 5) * 120,
          uploadedById: admin.id,
          courseId: course.id,
          adminLevel: item.level,
          suggestedLevel: item.level,
          analyzed: true,
          analysisSummary: `เนื้อหาระดับ ${item.level} หัวข้อ ${item.topics.join(', ')}`,
        },
      })
      clipIndex += 1
    }
  }

  console.log(`คอร์สเจาะหัวข้อ: สร้างใหม่ ${created} · อัปเดต ${updated}`)

  // ตรวจว่าทุกหัวข้อในคลังข้อสอบมีคอร์สรองรับ ไม่งั้นแนะนำไม่ได้เมื่อผู้เรียนพลาดหัวข้อนั้น
  const questionTopics = await prisma.question.groupBy({ by: ['topic'], _count: true })
  const courses = await prisma.course.findMany({ select: { topics: true } })
  const covered = new Set(courses.flatMap((c) => (Array.isArray(c.topics) ? c.topics : [])))
  const missing = questionTopics
    .filter((t) => t.topic && !covered.has(t.topic))
    .sort((a, b) => b._count - a._count)

  console.log(`\nหัวข้อในคลังข้อสอบ ${questionTopics.length} หัวข้อ · มีคอร์สรองรับ ${questionTopics.length - missing.length}`)
  if (missing.length) {
    console.log('ยังไม่มีคอร์สรองรับ:')
    missing.forEach((t) => console.log(`  ${t.topic} (${t._count} ข้อ)`))
  }

  console.log(`\nคอร์สทั้งหมดในระบบ ${await prisma.course.count()} คอร์ส (เจาะหัวข้อ ${await prisma.course.count({ where: { isFocused: true } })})`)
}

main()
  .catch((error) => {
    console.error('seed-focused-courses failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
