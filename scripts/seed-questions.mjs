/**
 * ขยายคลังข้อสอบให้พอกับการประเมิน 15 ข้อ/ครั้งแบบไม่ซ้ำ
 *
 *   node scripts/seed-questions.mjs
 *
 * ข้อสอบทุกข้อเขียนขึ้นเองโดยอิง "เกณฑ์ไวยากรณ์รายระดับ CEFR" ที่เผยแพร่เป็นสาธารณะ
 * (A1 be/articles/plurals → B1 conditionals/passive/present perfect → C1-C2 inversion/
 * subjunctive/นัยของคำ) ไม่ได้คัดลอกตัวข้อสอบจากคลังของผู้ให้บริการทดสอบรายใด
 * เพราะข้อสอบที่เผยแพร่มีลิขสิทธิ์ และระบบนี้เก็บค่าเรียนจริง
 *
 * รันซ้ำได้: ข้ามข้อที่มีโจทย์ซ้ำกับในฐานข้อมูลอยู่แล้ว
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** q = โจทย์, o = ตัวเลือก (ข้อแรกคือคำตอบที่ถูก), e = คำอธิบายภาษาไทย, c = หมวด */
const BANK = {
  A1: {
    difficulty: [1, 2],
    items: [
      { q: 'They ___ my friends.', o: ['are', 'is', 'am', 'be'], e: 'ประธานพหูพจน์ they ใช้ verb to be รูป are', c: 'grammar' },
      { q: 'Choose the correct plural of "child".', o: ['children', 'childs', 'childes', 'child'], e: 'child เป็นคำนามพหูพจน์ผิดรูป เปลี่ยนเป็น children', c: 'grammar' },
      { q: 'The cat is ___ the table.', o: ['under', 'of', 'to', 'from'], e: 'under = อยู่ใต้ เป็นคำบุพบทบอกตำแหน่ง', c: 'grammar' },
      { q: 'I ___ coffee every morning.', o: ['drink', 'drinks', 'drinking', 'am drink'], e: 'ประธาน I ใช้กริยารูปธรรมดาใน present simple', c: 'grammar' },
      { q: '___ you speak Thai?', o: ['Do', 'Does', 'Is', 'Are'], e: 'คำถาม present simple กับประธาน you ใช้ Do ขึ้นต้น', c: 'grammar' },
      { q: 'This is ___ book. It belongs to me.', o: ['my', 'me', 'I', 'mine book'], e: 'ใช้ my เป็นคำแสดงความเป็นเจ้าของนำหน้าคำนาม', c: 'grammar' },
      { q: 'She ___ a car. She walks to work.', o: ["doesn't have", "don't have", 'not have', 'no have'], e: 'ประธานเอกพจน์ she ใช้ doesn’t + กริยาช่องที่ 1', c: 'grammar' },
      { q: 'There are ___ apples on the table.', o: ['some', 'a', 'much', 'any'], e: 'ประโยคบอกเล่ากับคำนามนับได้พหูพจน์ใช้ some', c: 'grammar' },
      { q: 'What time ___ the shop open?', o: ['does', 'do', 'is', 'are'], e: 'ประธานเอกพจน์ the shop ใช้ does ในประโยคคำถาม', c: 'grammar' },
      { q: 'He is ___ engineer.', o: ['an', 'a', 'the some', 'any'], e: 'engineer ขึ้นต้นด้วยเสียงสระ จึงใช้ an', c: 'grammar' },
      { q: 'Which word means the opposite of "big"?', o: ['small', 'tall', 'long', 'wide'], e: 'small = เล็ก เป็นคำตรงข้ามของ big', c: 'vocabulary' },
      { q: 'You eat breakfast in the ___.', o: ['morning', 'night', 'evening', 'afternoon'], e: 'อาหารเช้ารับประทานตอนเช้า = morning', c: 'vocabulary' },
      { q: 'Which one is a day of the week?', o: ['Tuesday', 'August', 'Summer', 'January'], e: 'Tuesday เป็นวันในสัปดาห์ ส่วนตัวเลือกอื่นเป็นเดือนหรือฤดู', c: 'vocabulary' },
      { q: 'Where do you buy bread?', o: ['At a bakery', 'At a bank', 'At a garage', 'At a library'], e: 'bakery = ร้านขนมปัง', c: 'vocabulary' },
      { q: 'How much ___ this shirt?', o: ['is', 'are', 'do', 'have'], e: 'ประธานเอกพจน์ this shirt ใช้ is', c: 'grammar' },
      { q: 'My brother is ___ than me.', o: ['taller', 'tall', 'more tall', 'tallest'], e: 'เปรียบเทียบสองสิ่งกับ than ใช้รูป -er คือ taller', c: 'grammar' },
      { q: 'I ___ TV now.', o: ['am watching', 'watch', 'watches', 'watched'], e: 'now บอกเหตุการณ์ที่กำลังเกิด ใช้ present continuous', c: 'grammar' },
      { q: 'Choose the correct sentence.', o: ['She likes music.', 'She like music.', 'She liking music.', 'She do like music.'], e: 'ประธานเอกพจน์บุรุษที่สามเติม -s ที่กริยา', c: 'grammar' },
      { q: 'A doctor works in a ___.', o: ['hospital', 'kitchen', 'school', 'farm'], e: 'หมอทำงานที่โรงพยาบาล = hospital', c: 'vocabulary' },
      { q: 'Choose the correct question for the answer "I am from Japan."', o: ['Where are you from?', 'What are you from?', 'Who are you from?', 'When are you from?'], e: 'ถามที่มาของบุคคลใช้ Where ... from', c: 'grammar' },
    ],
  },
  A2: {
    difficulty: [3, 4],
    items: [
      { q: 'Last weekend we ___ to the mountains.', o: ['went', 'go', 'have gone', 'going'], e: 'last weekend เป็นอดีตจบแล้ว ใช้ past simple: go → went', c: 'grammar' },
      { q: 'I am going to visit my aunt ___ Sunday.', o: ['on', 'in', 'at', 'to'], e: 'ใช้ on กับวันในสัปดาห์', c: 'grammar' },
      { q: 'She is the ___ student in the class.', o: ['best', 'better', 'goodest', 'more good'], e: 'เปรียบเทียบขั้นสูงสุดของ good คือ best', c: 'grammar' },
      { q: 'There isn’t ___ milk in the fridge.', o: ['any', 'some', 'many', 'a'], e: 'ประโยคปฏิเสธกับคำนามนับไม่ได้ใช้ any', c: 'grammar' },
      { q: 'We ___ leave now or we will miss the bus.', o: ['have to', 'having to', 'has to', 'must to'], e: 'ประธาน we ใช้ have to แสดงความจำเป็น', c: 'grammar' },
      { q: 'He was tired, ___ he went to bed early.', o: ['so', 'because', 'although', 'but'], e: 'so ใช้เชื่อมเหตุไปหาผล', c: 'grammar' },
      { q: 'I ___ never been to Japan.', o: ['have', 'has', 'am', 'did'], e: 'ประธาน I ใช้ have + ช่องที่ 3 ใน present perfect', c: 'grammar' },
      { q: 'What ___ you doing when I called?', o: ['were', 'was', 'are', 'did'], e: 'past continuous กับประธาน you ใช้ were', c: 'grammar' },
      { q: 'If it rains, we ___ the picnic.', o: ['will cancel', 'cancelled', 'would cancel', 'cancel'], e: 'เงื่อนไขแบบที่ 1: if + present simple, will + กริยาช่อง 1', c: 'grammar' },
      { q: 'She enjoys ___ to music.', o: ['listening', 'listen', 'to listen', 'listened'], e: 'หลัง enjoy ตามด้วย gerund (-ing)', c: 'grammar' },
      { q: 'Please ___ your shoes before entering.', o: ['take off', 'take on', 'take up', 'take in'], e: 'take off = ถอด (เสื้อผ้า/รองเท้า)', c: 'vocabulary' },
      { q: 'The film was really ___. I fell asleep.', o: ['boring', 'bored', 'boredom', 'bore'], e: 'บรรยายสิ่งที่ทำให้รู้สึกใช้รูป -ing คือ boring', c: 'grammar' },
      { q: 'Which word means "not expensive"?', o: ['cheap', 'rich', 'costly', 'valuable'], e: 'cheap = ราคาถูก', c: 'vocabulary' },
      { q: 'I have lived here ___ three years.', o: ['for', 'since', 'from', 'during'], e: 'for ใช้กับช่วงระยะเวลา ส่วน since ใช้กับจุดเริ่มต้น', c: 'grammar' },
      { q: 'He is good ___ playing football.', o: ['at', 'in', 'on', 'for'], e: 'good at = เก่งในเรื่อง', c: 'grammar' },
      { q: 'You ___ smoke here. It is not allowed.', o: ["mustn't", "don't have to", 'may not to', 'need'], e: "mustn't = ห้าม ส่วน don't have to = ไม่จำเป็น", c: 'grammar' },
      { q: 'Choose the correct sentence about the future.', o: ['I am meeting John tomorrow.', 'I meet John tomorrow.', 'I met John tomorrow.', 'I have met John tomorrow.'], e: 'present continuous ใช้พูดถึงนัดหมายที่วางไว้แล้วในอนาคต', c: 'grammar' },
      { q: 'The opposite of "arrive" is:', o: ['leave', 'stay', 'enter', 'reach'], e: 'leave = ออกจาก ตรงข้ามกับ arrive = มาถึง', c: 'vocabulary' },
      { q: 'She speaks English very ___.', o: ['well', 'good', 'better', 'best'], e: 'ขยายกริยา speak ต้องใช้คำวิเศษณ์ well', c: 'grammar' },
      { q: 'How ___ people came to the party?', o: ['many', 'much', 'long', 'often'], e: 'people เป็นคำนามนับได้ ใช้ how many', c: 'grammar' },
    ],
  },
  B1: {
    difficulty: [5, 6],
    items: [
      { q: 'By the time we arrived, the film ___.', o: ['had already started', 'has already started', 'already started', 'was already starting'], e: 'เหตุการณ์ที่เกิดก่อนอีกเหตุการณ์ในอดีต ใช้ past perfect', c: 'grammar' },
      { q: 'This bridge ___ in 1998.', o: ['was built', 'built', 'has built', 'is building'], e: 'ประธานถูกกระทำในอดีต ใช้ passive: was + ช่องที่ 3', c: 'grammar' },
      { q: 'I ___ play the piano when I was younger.', o: ['used to', 'use to', 'am used to', 'was used'], e: 'used to + กริยาช่อง 1 = เคยทำในอดีตแต่ตอนนี้ไม่แล้ว', c: 'grammar' },
      { q: 'She asked me where I ___.', o: ['lived', 'live', 'am living', 'do live'], e: 'ประโยคเล่าความ (reported speech) เลื่อนกาลจาก live เป็น lived', c: 'grammar' },
      { q: 'He must ___ the train. He is never this late.', o: ['have missed', 'missed', 'miss', 'be missed'], e: 'must have + ช่องที่ 3 ใช้คาดเดาเรื่องในอดีตอย่างมั่นใจ', c: 'grammar' },
      { q: 'The book ___ I borrowed was excellent.', o: ['that', 'who', 'whose', 'what'], e: 'ขยายสิ่งของใช้ that หรือ which ส่วน who ใช้กับคน', c: 'grammar' },
      { q: 'If I had more time, I ___ a language course.', o: ['would take', 'will take', 'would have taken', 'take'], e: 'เงื่อนไขแบบที่ 2 สมมติปัจจุบัน: would + กริยาช่อง 1', c: 'grammar' },
      { q: 'I look forward to ___ you next week.', o: ['seeing', 'see', 'have seen', 'be seen'], e: 'to ใน look forward to เป็นบุพบท จึงตามด้วย gerund', c: 'grammar' },
      { q: 'You ___ have told me. I would have helped.', o: ['should', 'must', 'can', 'will'], e: 'should have + ช่องที่ 3 = น่าจะทำแต่ไม่ได้ทำ', c: 'grammar' },
      { q: 'We managed ___ the deadline despite the problems.', o: ['to meet', 'meeting', 'meet', 'met'], e: 'manage ตามด้วย to + กริยาช่อง 1', c: 'grammar' },
      { q: '"To postpone" most nearly means:', o: ['to delay to a later time', 'to cancel completely', 'to finish early', 'to repeat again'], e: 'postpone = เลื่อนออกไปเป็นเวลาภายหลัง', c: 'vocabulary' },
      { q: 'She ___ working here for six months before she was promoted.', o: ['had been', 'has been', 'was', 'is'], e: 'past perfect continuous ใช้กับช่วงเวลาที่ต่อเนื่องก่อนเหตุการณ์ในอดีต', c: 'grammar' },
      { q: 'Choose the sentence with correct word order.', o: ['I have never seen such a beautiful view.', 'I never have seen such a beautiful view.', 'I have seen never such a beautiful view.', 'Never I have seen such a beautiful view.'], e: 'never วางระหว่างกริยาช่วยกับกริยาหลัก', c: 'grammar' },
      { q: 'The meeting was ___ because the manager was ill.', o: ['called off', 'called on', 'called up', 'called for'], e: 'call off = ยกเลิก', c: 'vocabulary' },
      { q: 'It is worth ___ the museum while you are here.', o: ['visiting', 'to visit', 'visit', 'visited'], e: 'worth ตามด้วย gerund เสมอ', c: 'grammar' },
      { q: 'Neither of the answers ___ correct.', o: ['is', 'are', 'were', 'have been'], e: 'neither of + คำนามพหูพจน์ ถือเป็นเอกพจน์ในภาษาเขียนที่เป็นทางการ', c: 'grammar' },
      { q: '"Reliable" describes someone who:', o: ['can be trusted to do what they promise', 'talks a lot in meetings', 'works very quickly', 'has many friends'], e: 'reliable = ไว้ใจได้ ทำตามที่รับปาก', c: 'vocabulary' },
      { q: 'He speaks English as well as he ___ French.', o: ['does', 'is', 'has', 'speak'], e: 'ใช้กริยาช่วย does แทนการพูดซ้ำกริยา speaks', c: 'grammar' },
      { q: 'I would rather ___ at home tonight.', o: ['stay', 'to stay', 'staying', 'stayed'], e: 'would rather ตามด้วยกริยาช่อง 1 ไม่มี to', c: 'grammar' },
      { q: 'The instructions were ___ ; nobody understood them.', o: ['confusing', 'confused', 'confusion', 'confuse'], e: 'สิ่งที่ทำให้สับสนใช้รูป -ing คือ confusing', c: 'grammar' },
    ],
  },
  B2: {
    difficulty: [6, 7],
    items: [
      { q: 'If she had studied harder, she ___ the exam.', o: ['would have passed', 'would pass', 'will pass', 'had passed'], e: 'เงื่อนไขแบบที่ 3 สมมติอดีต: would have + ช่องที่ 3', c: 'grammar' },
      { q: 'I had my car ___ last week.', o: ['repaired', 'repair', 'to repair', 'repairing'], e: 'โครงสร้าง have something done = จ้างให้คนอื่นทำให้', c: 'grammar' },
      { q: 'The proposal is being ___ by the committee at the moment.', o: ['considered', 'consider', 'consideration', 'considering'], e: 'passive แบบกำลังดำเนินอยู่: is being + ช่องที่ 3', c: 'grammar' },
      { q: 'He denied ___ anything about the incident.', o: ['knowing', 'to know', 'know', 'known'], e: 'deny ตามด้วย gerund', c: 'grammar' },
      { q: 'Hardly ___ the office when the phone rang.', o: ['had he entered', 'he had entered', 'did he enter', 'he entered'], e: 'ขึ้นต้นด้วย Hardly ต้องสลับกริยาช่วยมาหน้าประธาน', c: 'grammar' },
      { q: 'She is used to ___ long hours.', o: ['working', 'work', 'to work', 'worked'], e: 'be used to = คุ้นเคยกับ ตามด้วย gerund', c: 'grammar' },
      { q: 'The results were ___ with what we had predicted.', o: ['consistent', 'consisting', 'consistency', 'consist'], e: 'be consistent with = สอดคล้องกับ', c: 'vocabulary' },
      { q: 'I wish I ___ more attention in that lecture.', o: ['had paid', 'paid', 'have paid', 'would pay'], e: 'wish + past perfect ใช้เสียดายเรื่องที่ผ่านไปแล้ว', c: 'grammar' },
      { q: 'The new policy will ___ into effect next month.', o: ['come', 'go', 'take', 'make'], e: 'come into effect = เริ่มมีผลบังคับใช้', c: 'vocabulary' },
      { q: 'No sooner had the meeting started ___ the fire alarm went off.', o: ['than', 'when', 'then', 'that'], e: 'โครงสร้าง no sooner ... than คู่กันเสมอ', c: 'grammar' },
      { q: '"To be reluctant to do something" means:', o: ['to be unwilling and hesitant', 'to be eager and ready', 'to be forced by others', 'to be skilled at it'], e: 'reluctant = ลังเล ไม่เต็มใจ', c: 'vocabulary' },
      { q: 'The report, ___ was published last week, has caused controversy.', o: ['which', 'that', 'what', 'who'], e: 'อนุประโยคขยายแบบมีคอมมา (non-defining) ใช้ which ไม่ใช้ that', c: 'grammar' },
      { q: 'She objected ___ treated like a beginner.', o: ['to being', 'to be', 'being', 'be'], e: 'object to + gerund และรูปถูกกระทำคือ being + ช่องที่ 3', c: 'grammar' },
      { q: 'Their arguments were ___ ; each one contradicted the last.', o: ['inconsistent', 'consistent', 'persistent', 'insistent'], e: 'inconsistent = ขัดแย้งกันเอง ไม่สอดคล้อง', c: 'vocabulary' },
      { q: 'By this time next year, I ___ my degree.', o: ['will have completed', 'will complete', 'am completing', 'complete'], e: 'future perfect ใช้กับสิ่งที่จะเสร็จก่อนเวลาหนึ่งในอนาคต', c: 'grammar' },
      { q: 'The manager put ___ the meeting until Friday.', o: ['off', 'out', 'down', 'over'], e: 'put off = เลื่อนออกไป', c: 'vocabulary' },
      { q: 'Only after the deadline ___ that a mistake had been made.', o: ['did we realise', 'we realised', 'we did realise', 'realised we'], e: 'ขึ้นต้นด้วย Only after ต้องสลับกริยาช่วย did มาหน้าประธาน', c: 'grammar' },
      { q: 'The evidence ___ strongly that the theory is wrong.', o: ['suggests', 'suggest', 'is suggesting to', 'suggested to'], e: 'evidence เป็นคำนามนับไม่ได้ ใช้กริยาเอกพจน์', c: 'grammar' },
      { q: '"A thorough investigation" is one that is:', o: ['complete and careful in every detail', 'finished very quickly', 'done by an outside expert', 'kept secret from the public'], e: 'thorough = ละเอียดถี่ถ้วนครบทุกแง่มุม', c: 'vocabulary' },
      { q: 'Were it not for her support, the project ___ collapsed.', o: ['would have', 'will have', 'had', 'has'], e: 'เงื่อนไขแบบสลับรูปของอดีต ใช้คู่กับ would have + ช่องที่ 3', c: 'grammar' },
    ],
  },
  C1: {
    difficulty: [8, 9],
    items: [
      { q: 'Under no circumstances ___ the document be shared externally.', o: ['should', 'it should', 'should it be', 'will it'], e: 'วลีปฏิเสธขึ้นต้นประโยคต้องสลับกริยาช่วยมาหน้าประธาน: should the document be', c: 'grammar' },
      { q: 'It was not until the audit ___ that the discrepancies emerged.', o: ['was completed', 'completed', 'had complete', 'has completed'], e: 'the audit ถูกกระทำ จึงใช้รูป passive ในอดีต', c: 'grammar' },
      { q: 'The committee recommended that the rule ___ suspended.', o: ['be', 'is', 'was', 'will be'], e: 'หลัง recommend that ใช้ subjunctive คือกริยารูปฐาน be', c: 'grammar' },
      { q: '___ in the 1920s, the building retains much of its original character.', o: ['Constructed', 'Constructing', 'It constructed', 'Having construct'], e: 'participle clause แบบถูกกระทำใช้กริยาช่องที่ 3 ขึ้นต้น', c: 'grammar' },
      { q: 'Her account of the meeting was decidedly ___ ; several key facts were omitted.', o: ['selective', 'exhaustive', 'meticulous', 'comprehensive'], e: 'selective = เลือกเล่าเฉพาะบางส่วน สอดคล้องกับการละข้อเท็จจริงบางอย่าง', c: 'vocabulary' },
      { q: 'The findings ___ considerable doubt on the original hypothesis.', o: ['cast', 'threw', 'put', 'made'], e: 'สำนวนคงที่คือ cast doubt on = ทำให้เกิดข้อกังขา', c: 'vocabulary' },
      { q: 'Much ___ his surprise, the offer was withdrawn.', o: ['to', 'for', 'at', 'in'], e: 'สำนวน much to one’s surprise = ทำให้ประหลาดใจมาก', c: 'grammar' },
      { q: 'The proposal is ambitious, ___ somewhat impractical.', o: ['albeit', 'despite', 'nevertheless of', 'although of'], e: 'albeit = แม้ว่าจะ ใช้เชื่อมคำคุณศัพท์โดยไม่ต้องมีประโยคเต็ม', c: 'grammar' },
      { q: 'So convincing ___ that nobody questioned it.', o: ['was her argument', 'her argument was', 'was she argument', 'her argument'], e: 'ขึ้นต้นด้วย So + คำคุณศัพท์ ต้องสลับกริยามาหน้าประธาน', c: 'grammar' },
      { q: '"To equivocate" means to:', o: ['speak vaguely to avoid committing yourself', 'state your position very firmly', 'agree with everyone present', 'repeat an argument for emphasis'], e: 'equivocate = พูดกำกวมเพื่อเลี่ยงการผูกมัดตัวเอง', c: 'vocabulary' },
      { q: 'The scheme was ultimately ___ by its own complexity.', o: ['undermined', 'underlined', 'undertaken', 'understated'], e: 'undermine = บั่นทอนจนอ่อนแอลง', c: 'vocabulary' },
      { q: 'Little ___ how much the decision would cost them.', o: ['did they realise', 'they realised', 'they did realise', 'realised they'], e: 'Little ขึ้นต้นประโยคเป็นการเน้นเชิงปฏิเสธ ต้องสลับกริยาช่วย', c: 'grammar' },
      { q: 'His conclusions rest on a ___ premise that has never been tested.', o: ['questionable', 'questioning', 'questioned', 'question'], e: 'questionable = น่าเคลือบแคลง ใช้ขยายคำนาม premise', c: 'vocabulary' },
      { q: 'Had the warnings been heeded, the crisis ___ avoidable.', o: ['would have been', 'will be', 'would be', 'had been'], e: 'เงื่อนไขที่ 3 แบบสลับรูป ใช้คู่กับ would have been', c: 'grammar' },
      { q: 'The two accounts are difficult to ___ ; they contradict each other.', o: ['reconcile', 'reconsider', 'reconstruct', 'recollect'], e: 'reconcile = ทำให้สองสิ่งที่ขัดกันสอดคล้องกันได้', c: 'vocabulary' },
      { q: 'She is anything ___ satisfied with the outcome.', o: ['but', 'like', 'than', 'from'], e: 'anything but = ไม่ใช่เลย ตรงกันข้ามอย่างสิ้นเชิง', c: 'grammar' },
      { q: '"A tenuous connection" is one that is:', o: ['weak and barely supported', 'proven beyond doubt', 'recently discovered', 'widely accepted'], e: 'tenuous = บางเบา อ่อน แทบไม่มีน้ำหนัก', c: 'vocabulary' },
      { q: 'The minister stopped short ___ admitting responsibility.', o: ['of', 'to', 'from', 'at'], e: 'stop short of + gerund = เกือบจะทำแต่ไม่ถึงขั้นนั้น', c: 'grammar' },
      { q: 'Far from ___ the problem, the reform made it worse.', o: ['solving', 'solve', 'solved', 'to solve'], e: 'far from ตามด้วย gerund เสมอ', c: 'grammar' },
      { q: 'The data, ___ compelling, remain open to interpretation.', o: ['however', 'whatever', 'moreover', 'therefore'], e: 'however + คำคุณศัพท์ = ไม่ว่าจะ...เพียงใดก็ตาม', c: 'grammar' },
    ],
  },
  C2: {
    difficulty: [9, 10],
    items: [
      { q: 'Her prose is admired for its ___ : not a word is wasted.', o: ['economy', 'brevity of thought', 'redundancy', 'verbosity'], e: 'economy (of language) = การใช้ถ้อยคำอย่างประหยัดไม่ฟุ่มเฟือย', c: 'vocabulary' },
      { q: 'The apology struck many as ___ , offered only once the damage was public.', o: ['perfunctory', 'heartfelt', 'spontaneous', 'candid'], e: 'perfunctory = ทำพอเป็นพิธี ขาดความจริงใจ', c: 'vocabulary' },
      { q: 'Such ___ the outcry that the policy was reversed within days.', o: ['was', 'were', 'has been', 'it was'], e: 'Such + be ขึ้นต้นประโยค ต้องสลับกริยามาหน้าประธานเอกพจน์ the outcry', c: 'grammar' },
      { q: '"To damn with faint praise" is to:', o: ['criticise by praising only mildly', 'condemn in the strongest terms', 'praise someone excessively', 'refuse to comment at all'], e: 'สำนวนนี้คือการชมแบบอ่อยจนความหมายกลายเป็นการติ', c: 'vocabulary' },
      { q: 'The distinction he draws is ___ , resting on differences too small to matter.', o: ['specious', 'robust', 'salient', 'cogent'], e: 'specious = ดูสมเหตุสมผลแต่ที่จริงกลวง', c: 'vocabulary' },
      { q: 'Not for a moment ___ that the claim was credible.', o: ['did she suppose', 'she supposed', 'she did suppose', 'supposed she'], e: 'วลีปฏิเสธขึ้นต้นประโยคบังคับให้สลับกริยาช่วย did มาหน้าประธาน', c: 'grammar' },
      { q: 'His resignation was, ___ , an admission of failure.', o: ['in effect', 'in affect', 'on effect', 'at effect'], e: 'in effect = โดยเนื้อแท้แล้ว ในทางปฏิบัติ', c: 'vocabulary' },
      { q: 'The report is thorough; its recommendations, ___ , are timid.', o: ['however', 'therefore', 'thereby', 'whereas'], e: 'however ใช้แสดงความขัดแย้งกับข้อความก่อนหน้า', c: 'grammar' },
      { q: '"An intractable problem" is one that is:', o: ['very hard to manage or solve', 'easily resolved with effort', 'poorly understood but minor', 'created deliberately'], e: 'intractable = ดื้อรั้น แก้ไขได้ยากมาก', c: 'vocabulary' },
      { q: 'She has a ___ for understatement that can be mistaken for indifference.', o: ['penchant', 'penance', 'pendant', 'pittance'], e: 'penchant for = ความชอบหรือความโน้มเอียงที่จะทำสิ่งนั้น', c: 'vocabulary' },
      { q: 'Were the evidence ___ to emerge, the verdict would be overturned.', o: ['ever', 'never', 'always', 'once'], e: 'were ... ever to + กริยา เป็นการสมมติอนาคตที่ไม่น่าเกิด', c: 'grammar' },
      { q: 'The argument is circular: it ___ the very thing it sets out to prove.', o: ['presupposes', 'refutes', 'qualifies', 'illustrates'], e: 'presuppose = ตั้งสมมติฐานไว้ล่วงหน้า ซึ่งทำให้เหตุผลวนเป็นวงกลม', c: 'vocabulary' },
      { q: 'He spoke with a candour ___ in political life.', o: ['rarely encountered', 'rare encountering', 'rarely encounter', 'rare to encounter it'], e: 'ใช้ participle clause แบบถูกกระทำขยายคำนาม candour', c: 'grammar' },
      { q: '"To be at loggerheads" with someone means to:', o: ['be in strong disagreement', 'be in close partnership', 'be indebted to them', 'be unaware of them'], e: 'at loggerheads = ขัดแย้งกันอย่างหนัก', c: 'vocabulary' },
      { q: 'The proposal was rejected, ___ the objections of the finance committee.', o: ['owing largely to', 'owing largely for', 'due largely of', 'because largely'], e: 'owing to = เนื่องมาจาก ใช้กับคำนามตามหลัง', c: 'grammar' },
      { q: 'Her account is ___ : it explains the facts without straining them.', o: ['plausible', 'implausible', 'convoluted', 'tendentious'], e: 'plausible = ฟังขึ้น น่าเชื่อถือตามเหตุผล', c: 'vocabulary' },
      { q: 'So thoroughly ___ the original that the copy is indistinguishable.', o: ['does it resemble', 'it resembles', 'does it resembles', 'it does resemble'], e: 'So + คำวิเศษณ์ ขึ้นต้นประโยค ต้องสลับกริยาช่วย does มาหน้าประธาน', c: 'grammar' },
      { q: '"A pyrrhic victory" is a win that:', o: ['costs the winner more than it is worth', 'comes after a long delay', 'is achieved without any effort', 'is later reversed on appeal'], e: 'pyrrhic victory = ชนะแต่เสียหายหนักจนไม่คุ้ม', c: 'vocabulary' },
      { q: 'The minister was accused of being ___ with the truth.', o: ['economical', 'generous', 'meticulous', 'transparent'], e: 'สำนวน economical with the truth = เลี่ยงบาลี ปิดบังความจริงบางส่วน', c: 'vocabulary' },
      { q: 'Only in retrospect ___ the significance of those early warnings.', o: ['did they appreciate', 'they appreciated', 'appreciated they', 'they did appreciate'], e: 'Only + วลีบอกเวลาขึ้นต้นประโยค ต้องสลับกริยาช่วยมาหน้าประธาน', c: 'grammar' },
    ],
  },
}

function buildRecord(level, item, difficulty) {
  const [correct, ...rest] = item.o
  // สลับตำแหน่งเฉลยแบบคงที่ตามความยาวโจทย์ เพื่อไม่ให้คำตอบถูกอยู่ข้อแรกทุกครั้ง
  const position = item.q.length % item.o.length
  const options = [...rest]
  options.splice(position, 0, correct)

  return {
    question: item.q,
    options: options.map((text) => ({ text, isCorrect: text === correct })),
    correctAnswer: correct,
    explanation: item.e,
    difficulty,
    cefrLevel: level,
    category: item.c,
  }
}

/** ตรวจก่อนลง: เฉลยผิดหนึ่งข้อทำให้ระดับที่วัดได้เพี้ยนทั้งระบบ */
function validate(record) {
  const problems = []
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

  for (const [level, group] of Object.entries(BANK)) {
    group.items.forEach((item, index) => {
      const [min, max] = group.difficulty
      const difficulty = index % 2 === 0 ? min : max
      const record = buildRecord(level, item, difficulty)
      const problems = validate(record)
      if (problems.length) failures.push(`${level} · ${item.q.slice(0, 40)} → ${problems.join(', ')}`)
      else records.push(record)
    })
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

  console.log(`ตรวจผ่านทั้งหมด ${records.length} ข้อ · เพิ่มใหม่ ${added} ข้อ · ข้ามเพราะมีอยู่แล้ว ${skipped} ข้อ`)

  const totals = await prisma.question.groupBy({ by: ['cefrLevel'], _count: true })
  console.log('\nคลังข้อสอบหลังเพิ่ม:')
  totals
    .sort((a, b) => a.cefrLevel.localeCompare(b.cefrLevel))
    .forEach((t) => console.log(`  ${t.cefrLevel}: ${t._count} ข้อ`))
  console.log(`  รวม ${await prisma.question.count()} ข้อ`)
}

main()
  .catch((error) => {
    console.error('seed-questions failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
