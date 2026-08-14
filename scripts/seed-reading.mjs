/**
 * เพิ่มข้อสอบหมวด reading — บทความสั้นให้อ่านแล้วตอบคำถาม
 *
 *   node scripts/seed-reading.mjs
 *
 * บทความทุกชิ้นเขียนขึ้นใหม่สำหรับโปรเจกต์นี้ ไม่ได้คัดลอกจากหนังสือ ข้อสอบ
 * หรือเว็บใด ๆ ความยาวและความซับซ้อนไล่ตามระดับ CEFR:
 * A1 ~30 คำ ประโยคเดี่ยว present simple → C2 ~90 คำ ประโยคซ้อน นัยแฝง
 *
 * คำถามไล่จากจับใจความตรงตัว (A1-A2) ไปหาการตีความและน้ำเสียงผู้เขียน (C1-C2)
 * รันซ้ำได้: ข้ามข้อที่โจทย์ซ้ำกับที่มีอยู่แล้ว
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** p = บทความ, q = คำถาม, o = ตัวเลือก (ข้อแรกคือคำตอบถูก), e = คำอธิบายไทย */
const READING = {
  A1: {
    difficulty: 2,
    items: [
      {
        p: 'Anna lives in a small house near the sea. She has a black cat. Every morning she walks on the beach with her cat. She likes the sound of the water.',
        q: 'Where does Anna live?',
        o: ['Near the sea', 'In a big city', 'On a farm', 'In the mountains'],
        e: 'ประโยคแรกบอกว่า Anna lives in a small house near the sea',
      },
      {
        p: 'The shop opens at nine in the morning. It closes at six in the evening. On Sunday the shop is closed. Ben works there from Monday to Friday.',
        q: 'When is the shop closed all day?',
        o: ['On Sunday', 'On Monday', 'On Friday', 'At nine'],
        e: 'บทความระบุว่า On Sunday the shop is closed',
      },
      {
        p: 'Tom is ten years old. He has two sisters and one brother. His brother is very tall. Tom likes football, but his sisters like music.',
        q: 'How many sisters does Tom have?',
        o: ['Two', 'One', 'Three', 'None'],
        e: 'He has two sisters and one brother จึงมีพี่สาว/น้องสาว 2 คน',
      },
      {
        p: 'My name is Lin. I am a nurse. I work at night and sleep in the day. I drink tea before work. I do not drink coffee.',
        q: 'What does Lin drink before work?',
        o: ['Tea', 'Coffee', 'Milk', 'Water'],
        e: 'I drink tea before work และบอกชัดว่าไม่ดื่มกาแฟ',
      },
      {
        p: 'It is cold today. There is snow on the street. The children wear warm coats and hats. They are happy because there is no school.',
        q: 'Why are the children happy?',
        o: ['There is no school', 'It is very hot', 'They have new coats', 'They are at home alone'],
        e: 'ประโยคสุดท้ายบอกเหตุผลว่า because there is no school',
      },
    ],
  },
  A2: {
    difficulty: 4,
    items: [
      {
        p: 'Last summer Maria visited her grandmother in the countryside. She stayed for two weeks. Every afternoon they picked vegetables in the garden and cooked dinner together. Maria did not use her phone much because the signal was weak. She says it was the most relaxing holiday she has ever had.',
        q: 'Why did Maria use her phone less than usual?',
        o: ['The signal was weak', 'Her grandmother took it away', 'She lost it on the trip', 'She was too busy cooking'],
        e: 'บทความบอกเหตุผลตรง ๆ ว่า because the signal was weak',
      },
      {
        p: 'The city library moved to a new building in March. The new building has more space for children and a small café on the ground floor. Members can now borrow eight books at a time instead of five. However, the library now closes an hour earlier on weekdays.',
        q: 'What is one disadvantage of the new library?',
        o: ['It closes earlier on weekdays', 'It has less space for children', 'Members can borrow fewer books', 'There is no café'],
        e: 'คำว่า However นำเข้าสู่ข้อเสีย คือปิดเร็วขึ้นหนึ่งชั่วโมงในวันธรรมดา',
      },
      {
        p: 'Daniel wanted to learn to swim, but he was afraid of deep water. His friend suggested taking lessons in the shallow pool first. After six weeks, Daniel could swim across the small pool. He still does not swim in the sea, but he plans to try next year.',
        q: 'What can Daniel do now?',
        o: ['Swim across the small pool', 'Swim in the deep sea', 'Teach swimming lessons', 'Swim for one hour without stopping'],
        e: 'After six weeks, Daniel could swim across the small pool ส่วนทะเลยังไม่ได้ลอง',
      },
      {
        p: 'Our office started a new rule in January. Everyone works from home on Fridays. Most staff say they save time because they do not travel. A few people miss talking to their colleagues, so the manager organises a team lunch once a month.',
        q: 'Why does the manager organise a monthly lunch?',
        o: ['Because some staff miss seeing colleagues', 'Because the office is closed on Fridays', 'Because staff asked for free food', 'Because the rule will end soon'],
        e: 'ประโยคสุดท้ายเชื่อมด้วย so ว่าจัดมื้อกลางวันเพราะบางคนคิดถึงเพื่อนร่วมงาน',
      },
      {
        p: 'The train to the airport leaves every twenty minutes. The journey takes about forty minutes. Tickets are cheaper if you buy them online before the day of travel. On the train there is free water, but you must pay for food.',
        q: 'How can passengers pay less for a ticket?',
        o: ['By buying online in advance', 'By travelling after midnight', 'By booking at the station', 'By buying food on the train'],
        e: 'บทความระบุว่าตั๋วถูกลงถ้าซื้อออนไลน์ล่วงหน้าก่อนวันเดินทาง',
      },
    ],
  },
  B1: {
    difficulty: 5,
    items: [
      {
        p: 'When the factory closed, the small town lost nearly three hundred jobs in a single month. Many families expected to move away. Instead, a group of former workers used their savings to open a furniture workshop in the empty building. Five years later, the workshop employs sixty people and sells to customers across the country. The town is smaller than before, but it has stopped shrinking.',
        q: 'What does the passage suggest about the town today?',
        o: [
          'It is no longer losing population',
          'It has fully recovered the jobs it lost',
          'Most families eventually moved away',
          'The factory has reopened under new owners',
        ],
        e: 'ประโยคสุดท้ายบอกว่าเมืองเล็กลงกว่าเดิมแต่ "has stopped shrinking" คือหยุดหดตัวแล้ว',
      },
      {
        p: 'Sleep researchers often warn that going to bed at a different time every night can be as harmful as sleeping too few hours. In one study, people who kept an irregular schedule reported more difficulty concentrating than those who slept slightly less but at consistent times. The researchers argue that the body relies on regular signals to prepare for rest.',
        q: 'What is the main point of the passage?',
        o: [
          'Consistency of sleep timing matters, not only total hours',
          'Most adults need far more sleep than they get',
          'Concentration problems are usually caused by illness',
          'Naps during the day improve night-time sleep',
        ],
        e: 'ใจความหลักคือความสม่ำเสมอของเวลานอนสำคัญไม่แพ้จำนวนชั่วโมง',
      },
      {
        p: 'The council offered free tree seedlings to anyone willing to plant them along the river. The response was far greater than expected, and the seedlings ran out within two days. Officials admitted they had underestimated public interest and promised a second round in the autumn.',
        q: 'Why did the seedlings run out so quickly?',
        o: [
          'Far more people wanted them than officials predicted',
          'Only a small number of seedlings were produced by mistake',
          'A storm destroyed most of the supply',
          'The council gave them to one organisation',
        ],
        e: 'The response was far greater than expected และเจ้าหน้าที่ยอมรับว่าประเมินความสนใจต่ำไป',
      },
      {
        p: 'Elena had applied for twelve jobs before she was invited to a single interview. She later said the waiting had been harder than the rejections, because silence gave her nothing to learn from. When she finally received detailed feedback from one company, she rewrote her application entirely and was offered a position the following month.',
        q: 'What did Elena find most difficult?',
        o: [
          'Not hearing anything back',
          'Being told she was unsuitable',
          'Rewriting her application',
          'Attending the interview itself'],
        e: 'เธอบอกว่าการรอเงียบ ๆ ยากกว่าการถูกปฏิเสธ เพราะไม่ได้เรียนรู้อะไรเลย',
      },
      {
        p: 'Cycling to work sounds simple until you consider the route. A journey that looks short on a map may involve three busy junctions with no cycle lane. Cities that have increased cycling most have not simply told people to cycle; they have rebuilt the streets so that the safest route is also the most direct one.',
        q: 'According to the passage, what makes cities successful at increasing cycling?',
        o: [
          'Changing the streets so safe routes are also direct',
          'Encouraging people through advertising campaigns',
          'Reducing the number of cars allowed on the road',
          'Providing free bicycles to residents'],
        e: 'ประโยคสุดท้ายชี้ว่าเมืองที่สำเร็จลงมือแก้ถนน ไม่ใช่แค่รณรงค์ให้คนปั่น',
      },
    ],
  },
  B2: {
    difficulty: 7,
    items: [
      {
        p: 'For decades the museum displayed its collection in strict chronological order, a decision that seemed neutral at the time. A recent redesign grouped objects by theme instead, placing a medieval bowl beside a modern one. Visitor numbers rose sharply, though a minority of scholars complained that removing the timeline obscured how techniques had developed. The curators responded that the old arrangement had implied a single line of progress that the evidence does not support.',
        q: "What is the curators' defence of the new arrangement?",
        o: [
          'The old order suggested a progression the evidence does not justify',
          'The thematic layout was cheaper to build and maintain',
          'Scholars had never made use of the chronological display',
          'Visitor numbers are the only meaningful measure of success'],
        e: 'ภัณฑารักษ์แย้งว่าการเรียงตามเวลาสื่อเป็นนัยว่ามีเส้นทางพัฒนาเส้นเดียว ซึ่งหลักฐานไม่รองรับ',
      },
      {
        p: 'The company announced that it would no longer require degrees for most roles. Critics called the move symbolic, noting that job adverts still listed years of experience that only graduates typically accumulate. Within a year, however, the proportion of new hires without degrees had doubled — from a very low base. Whether that represents genuine change or careful accounting remains contested.',
        q: 'What does the final sentence imply?',
        o: [
          'The improvement may be less significant than the figure suggests',
          'The company deliberately falsified its hiring records',
          'Critics have now accepted that the policy worked',
          'Most new hires at the company lack degrees'],
        e: 'ประโยคสุดท้ายทิ้งข้อสงสัยไว้ว่าตัวเลขที่เพิ่มเท่าตัวจากฐานที่ต่ำมาก อาจไม่ได้แปลว่าเปลี่ยนจริง',
      },
      {
        p: 'Translators of poetry face a choice that cannot be avoided. Preserve the literal meaning and the rhythm collapses; preserve the music and the sense drifts. Some argue the only honest solution is to publish the original alongside the translation, admitting that what the reader holds is a commentary rather than a substitute.',
        q: 'What is the writer\'s view of a poetry translation?',
        o: [
          'It functions more as a commentary than as a replacement',
          'It should always prioritise rhythm over meaning',
          'It is impossible and should not be attempted',
          'It succeeds only when the languages are closely related'],
        e: 'ผู้เขียนอ้างข้อเสนอว่าคำแปลคือ commentary ไม่ใช่ substitute ของต้นฉบับ',
      },
      {
        p: 'The trial results were widely reported as proof that the drug worked. Reading the paper itself gives a more measured picture: the benefit appeared only in patients under fifty, the study ran for eight weeks, and the authors themselves called for longer trials before any change in practice.',
        q: 'What is the main criticism made in the passage?',
        o: [
          'The reporting overstated what the study actually showed',
          'The researchers concealed the limitations of their work',
          'The drug was shown to be unsafe for older patients',
          'Eight-week studies are never worth publishing'],
        e: 'ผู้เขียนชี้ว่าข่าวรายงานเกินกว่าที่งานวิจัยแสดง ขณะที่ผู้วิจัยเองยังขอให้ศึกษาต่อ',
      },
      {
        p: 'Remote work was expected to spread jobs evenly across the country. In practice, the highest-paid remote roles have concentrated in the same few cities as before, because employers still recruit through networks built on proximity. The technology removed the requirement to commute without removing the advantage of already being known.',
        q: 'Why has remote work not spread jobs more evenly?',
        o: [
          'Hiring still depends on existing networks tied to certain places',
          'Employees prefer to live in large cities regardless of work',
          'The technology has proved unreliable outside major cities',
          'Companies were legally required to keep local offices'],
        e: 'เหตุผลคือการจ้างงานยังพึ่งเครือข่ายที่สร้างจากความใกล้ชิดเชิงพื้นที่',
      },
    ],
  },
  C1: {
    difficulty: 8,
    items: [
      {
        p: 'The proposal to fund the arts through a levy on ticket sales has an appealing symmetry: those who attend pay for what they attend. Its weakness is demographic rather than economic. Audiences for subsidised work are already narrower than the population that funds it through general taxation, and a levy would tie the survival of a programme to the tastes of whoever currently buys tickets — precisely the constituency that subsidy exists to widen.',
        q: "What is the author's central objection to the levy?",
        o: [
          'It would entrench the preferences of the existing audience',
          'It would raise substantially less money than taxation does',
          'It places an unfair administrative burden on venues',
          'It has never been attempted successfully elsewhere'],
        e: 'ข้อคัดค้านหลักคือมันผูกความอยู่รอดของโครงการไว้กับรสนิยมของผู้ชมกลุ่มเดิม ซึ่งขัดกับเป้าหมายของการอุดหนุน',
      },
      {
        p: 'Historians once treated the diary as an unusually reliable source, on the assumption that a private text has no audience to flatter. The assumption has not survived closer reading. Diarists revise, omit and rehearse; some wrote with publication in mind, others with the expectation of being read after death. The genre is not less valuable for this, but its value lies in what the writer chose to record, not in any special access to the truth.',
        q: 'What is the passage arguing about diaries as historical sources?',
        o: [
          'Their worth lies in the writer\'s choices rather than in unmediated honesty',
          'They should be treated with the same suspicion as public speeches',
          'Only diaries written without hope of publication are useful',
          'Historians were right to consider them the most reliable evidence'],
        e: 'ผู้เขียนสรุปว่าคุณค่าอยู่ที่สิ่งที่ผู้เขียนเลือกบันทึก ไม่ใช่ความจริงที่เข้าถึงได้แบบพิเศษ',
      },
      {
        p: 'It is often said that the reforms failed. A fairer verdict is that they were never attempted at the scale their designers specified. Funding arrived two years late and at roughly half the level modelled; the pilot regions were chosen for political convenience rather than comparability. What the episode demonstrates is the difficulty of evaluating a policy that exists mainly on paper.',
        q: "What is the writer's attitude to the claim that the reforms failed?",
        o: [
          'Sceptical, because the reforms were never properly implemented',
          'Supportive, since the evidence of failure is overwhelming',
          'Neutral, as the outcome cannot be judged either way for decades',
          'Critical of the designers for specifying an unrealistic scale'],
        e: 'ผู้เขียนไม่เห็นด้วยกับคำตัดสินนั้น เพราะการปฏิรูปไม่เคยถูกทำจริงในระดับที่ออกแบบไว้',
      },
      {
        p: 'Automation has historically destroyed tasks rather than occupations. The bank teller survived the cash machine because the job absorbed new duties as the old ones vanished. Whether that pattern holds now is an empirical question, not a matter for confidence in either direction: what is different this time is the speed, and speed determines whether the absorption has room to happen.',
        q: 'What position does the writer take on automation today?',
        o: [
          'The outcome is uncertain, and the pace of change is the decisive factor',
          'History shows clearly that employment will adjust as before',
          'Occupations will disappear faster than new duties can be invented',
          'The comparison with cash machines is entirely misleading'],
        e: 'ผู้เขียนบอกว่าเป็นคำถามเชิงประจักษ์ ไม่ควรมั่นใจทางใดทางหนึ่ง และตัวแปรชี้ขาดคือความเร็ว',
      },
      {
        p: 'Her second novel was received politely, which is to say it was buried. Reviewers praised its "quiet competence" and moved on. Only after the third book won a major prize did critics return to the second, discovering in it the themes they had failed to notice, and describing as understated what they had previously found merely flat.',
        q: 'What does the passage suggest about critical judgement?',
        o: [
          'It can be revised retrospectively once an author gains recognition',
          'Reviewers deliberately ignore the work of unknown writers',
          'The second novel was genuinely weaker than the third',
          'Prizes are awarded to compensate for earlier neglect'],
        e: 'ข้อความชี้ว่าคำวิจารณ์ถูกทบทวนย้อนหลังเมื่อผู้เขียนมีชื่อเสียง คำเดิมที่ว่าจืดกลายเป็น "สำรวม"',
      },
    ],
  },
  C2: {
    difficulty: 10,
    items: [
      {
        p: 'The committee\'s report is a model of a certain kind of prose. Responsibility is distributed so evenly across its two hundred pages that it settles nowhere; failures are described as having occurred, in the manner of weather. No individual is named in connection with any decision, though the decisions were, of course, taken by individuals. The effect is not to conceal so much as to make concealment unnecessary.',
        q: 'What is the writer\'s criticism of the report?',
        o: [
          'Its style dissolves accountability without appearing to hide anything',
          'It names individuals unfairly and without sufficient evidence',
          'It is too short to address the failures it describes',
          'It contradicts the findings of earlier investigations'],
        e: 'ผู้เขียนชี้ว่าสำนวนของรายงานทำให้ความรับผิดชอบสลายไป จนไม่ต้องปกปิดอะไรอีกเลย',
      },
      {
        p: 'That the exhibition sold out is not in dispute. What is disputed is the inference drawn from it. Popularity has been offered as vindication, as though the crowds settled a question about quality that the crowds were never asked. One may hold, without inconsistency, that the show deserved its audience and that its audience proves nothing about its merits.',
        q: 'What logical point is the writer making?',
        o: [
          'Commercial success and artistic merit are separate claims',
          'The exhibition was overrated by an uncritical public',
          'Sales figures are usually manipulated by organisers',
          'Critics should defer to public taste more often'],
        e: 'ประเด็นคือความนิยมไม่ได้ตอบคำถามเรื่องคุณภาพ ซึ่งเป็นคนละข้อกล่าวอ้าง',
      },
      {
        p: 'For all the confidence of its conclusions, the study rests on a sample assembled from volunteers who responded to an online advertisement. The authors acknowledge this in a footnote and proceed as if the acknowledgement had cured it. A limitation named is not a limitation addressed, and the generalisations that follow are not licensed by the data that precede them.',
        q: 'What does the phrase "as if the acknowledgement had cured it" convey?',
        o: [
          'Admitting a flaw does not remove its effect on the conclusions',
          'The authors were unaware of the problem with their sample',
          'Footnotes are an inappropriate place for methodological detail',
          'The study should have used a larger number of volunteers'],
        e: 'วลีนี้เสียดสีว่าการยอมรับข้อจำกัดไม่ได้แก้ข้อจำกัดนั้น ข้อสรุปจึงยังไม่มีน้ำหนัก',
      },
      {
        p: 'He is often described as ahead of his time, a compliment that flatters us more than him. It implies that his contemporaries were merely slow, when in fact they understood him well enough and disagreed. To call the disagreement a failure of comprehension is to spare ourselves the harder task of explaining why intelligent people, in possession of the same evidence, reached the opposite conclusion.',
        q: 'Why does the writer object to the phrase "ahead of his time"?',
        o: [
          'It recasts genuine disagreement as a failure to understand',
          'It exaggerates the originality of his actual contribution',
          'It suggests his ideas were never accepted at all',
          'It implies his contemporaries lacked access to the evidence'],
        e: 'ผู้เขียนค้านว่าวลีนี้เปลี่ยนความไม่เห็นด้วยที่แท้จริงให้กลายเป็นเรื่องคนอื่นตามไม่ทัน',
      },
      {
        p: 'The distinction between a translation and an adaptation has always been more administrative than real; it tells you which contract was signed, not what happened to the text. Every rendering makes choices that the original did not authorise, and the question worth asking is not whether liberties were taken but whether the ones taken were the interesting ones.',
        q: 'What does the writer conclude about the translation/adaptation distinction?',
        o: [
          'It reflects legal categories rather than what occurs to the text',
          'Adaptations are consistently more faithful than translations',
          'Translators should be granted the freedoms adapters enjoy',
          'The distinction matters most for works still in copyright'],
        e: 'ผู้เขียนบอกว่าเส้นแบ่งนี้เป็นเรื่องสัญญา/ธุรการ ไม่ได้สะท้อนสิ่งที่เกิดขึ้นกับตัวบทจริง ๆ',
      },
    ],
  },
}

function buildRecord(level, item, difficulty) {
  const [correct, ...rest] = item.o
  const position = item.q.length % item.o.length
  const options = [...rest]
  options.splice(position, 0, correct)

  return {
    passage: item.p,
    question: item.q,
    options: options.map((text) => ({ text, isCorrect: text === correct })),
    correctAnswer: correct,
    explanation: item.e,
    difficulty,
    cefrLevel: level,
    category: 'reading',
  }
}

function validate(record) {
  const problems = []
  if (!record.passage || record.passage.trim().split(/\s+/).length < 20) problems.push('บทความสั้นเกินไป')
  if (record.options.length !== 4) problems.push('ตัวเลือกไม่ครบ 4')
  const correct = record.options.filter((o) => o.isCorrect)
  if (correct.length !== 1) problems.push(`มีข้อถูก ${correct.length} ข้อ`)
  if (correct[0]?.text !== record.correctAnswer) problems.push('correctAnswer ไม่ตรงกับตัวเลือกที่ถูก')
  if (new Set(record.options.map((o) => o.text.trim().toLowerCase())).size !== 4) problems.push('ตัวเลือกซ้ำ')
  if (!/[฀-๿]/.test(record.explanation)) problems.push('คำอธิบายไม่ใช่ภาษาไทย')
  return problems
}

async function main() {
  const existing = await prisma.question.findMany({ select: { question: true } })
  const seen = new Set(existing.map((q) => q.question.trim().toLowerCase()))

  const records = []
  const failures = []

  for (const [level, group] of Object.entries(READING)) {
    for (const item of group.items) {
      const record = buildRecord(level, item, group.difficulty)
      const problems = validate(record)
      if (problems.length) failures.push(`${level} · ${item.q.slice(0, 40)} → ${problems.join(', ')}`)
      else records.push(record)
    }
  }

  if (failures.length) {
    console.error('ข้อสอบไม่ผ่านการตรวจ จึงไม่ลงฐานข้อมูล:')
    failures.forEach((f) => console.error('  -', f))
    process.exitCode = 1
    return
  }

  let added = 0
  let skipped = 0
  for (const record of records) {
    if (seen.has(record.question.trim().toLowerCase())) {
      skipped += 1
      continue
    }
    await prisma.question.create({ data: record })
    seen.add(record.question.trim().toLowerCase())
    added += 1
  }

  console.log(`ตรวจผ่าน ${records.length} ข้อ · เพิ่มใหม่ ${added} ข้อ · ข้ามเพราะมีอยู่แล้ว ${skipped} ข้อ`)

  const byCategory = await prisma.question.groupBy({ by: ['category'], _count: true })
  const byLevel = await prisma.question.groupBy({ by: ['cefrLevel'], _count: true })
  console.log('\nคลังข้อสอบตามหมวด:')
  byCategory.forEach((c) => console.log(`  ${c.category}: ${c._count} ข้อ`))
  console.log('ตามระดับ:')
  byLevel.sort((a, b) => a.cefrLevel.localeCompare(b.cefrLevel)).forEach((l) => console.log(`  ${l.cefrLevel}: ${l._count} ข้อ`))
  console.log(`  รวม ${await prisma.question.count()} ข้อ`)
}

main()
  .catch((error) => {
    console.error('seed-reading failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
