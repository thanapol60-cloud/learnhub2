import { CEFRLevel } from './cefr'

export interface SeedQuestion {
  question: string
  options: Array<{ text: string; isCorrect: boolean }>
  correctAnswer: string
  explanation: string
  difficulty: number
  cefrLevel: CEFRLevel
  category: string
}

const q = (
  question: string,
  correct: string,
  wrong: [string, string, string],
  explanation: string,
  difficulty: number,
  cefrLevel: CEFRLevel,
  category: string
): SeedQuestion => ({
  question,
  options: [
    { text: correct, isCorrect: true },
    { text: wrong[0], isCorrect: false },
    { text: wrong[1], isCorrect: false },
    { text: wrong[2], isCorrect: false },
  ],
  correctAnswer: correct,
  explanation,
  difficulty,
  cefrLevel,
  category,
})

export const SEED_QUESTIONS: SeedQuestion[] = [
  // ---------- A1 ----------
  q('Choose the correct greeting in the morning.', 'Good morning', ['Good night', 'Good evening', 'Goodbye'],
    'ทักทายตอนเช้าใช้ "Good morning" ส่วน "Good evening" ใช้ตอนเย็น', 1, 'A1', 'vocabulary'),
  q('I ___ a student.', 'am', ['is', 'are', 'be'],
    'ประธาน I ใช้ verb to be เป็น "am" เสมอ', 1, 'A1', 'grammar'),
  q('She ___ my sister.', 'is', ['am', 'are', 'be'],
    'ประธานเอกพจน์ (she) ใช้ "is"', 1, 'A1', 'grammar'),
  q('Choose the correct plural of "book".', 'books', ['bookes', 'bookies', 'book'],
    'คำนามทั่วไปเติม -s เพื่อทำเป็นพหูพจน์', 1, 'A1', 'grammar'),
  q('What colour is the sky on a clear day?', 'Blue', ['Green', 'Brown', 'Purple'],
    'ท้องฟ้าในวันที่อากาศแจ่มใสเป็นสีฟ้า (blue)', 1, 'A1', 'vocabulary'),
  q('Complete: "I have ___ apple."', 'an', ['a', 'the', 'some'],
    'ใช้ "an" หน้าคำที่ขึ้นต้นด้วยเสียงสระ เช่น apple', 2, 'A1', 'grammar'),
  q('Which number comes after twelve?', 'Thirteen', ['Twenty', 'Eleven', 'Thirty'],
    'ลำดับคือ twelve (12) แล้วตามด้วย thirteen (13)', 1, 'A1', 'vocabulary'),
  q('Choose the correct spelling.', 'tomorrow', ['tomorow', 'tommorow', 'tomarrow'],
    'สะกดถูกคือ tomorrow (พรุ่งนี้)', 2, 'A1', 'vocabulary'),
  q('"Thank you" means:', 'ขอบคุณ', ['ขอโทษ', 'สวัสดี', 'ลาก่อน'],
    '"Thank you" แปลว่า ขอบคุณ', 1, 'A1', 'vocabulary'),
  q('___ is your name?', 'What', ['Who', 'Where', 'When'],
    'ถามชื่อใช้ "What is your name?"', 2, 'A1', 'grammar'),

  // ---------- A2 ----------
  q('She ___ to school every day.', 'goes', ['go', 'going', 'gone'],
    'ประธานเอกพจน์บุรุษที่ 3 ใน present simple ต้องเติม -s/-es', 3, 'A2', 'grammar'),
  q('Yesterday I ___ a film.', 'watched', ['watch', 'watching', 'watches'],
    'yesterday บอกอดีต จึงใช้ past simple: watched', 3, 'A2', 'grammar'),
  q('This box is ___ than that one.', 'heavier', ['heavy', 'heaviest', 'more heavy'],
    'เปรียบเทียบสองสิ่งใช้ comparative: heavy → heavier', 3, 'A2', 'grammar'),
  q('There ___ four chairs in the room.', 'are', ['is', 'be', 'was'],
    'ประธานพหูพจน์ (four chairs) ใช้ "are"', 3, 'A2', 'grammar'),
  q('I usually get up ___ 7 o\'clock.', 'at', ['in', 'on', 'to'],
    'บอกเวลาเป็นจุดใช้ "at" เช่น at 7 o\'clock', 3, 'A2', 'grammar'),
  q('"Excuse me" is used to:', 'politely get attention', ['say goodbye', 'give a gift', 'order food'],
    '"Excuse me" ใช้เรียกความสนใจอย่างสุภาพ หรือขอทาง', 3, 'A2', 'vocabulary'),
  q('He ___ swim when he was five.', 'could', ['can', 'will', 'must'],
    'พูดถึงความสามารถในอดีตใช้ "could"', 4, 'A2', 'grammar'),
  q('How ___ does the ticket cost?', 'much', ['many', 'long', 'far'],
    'ถามราคาใช้ "How much"', 3, 'A2', 'grammar'),
  q('Choose the correct word: "My brother is a ___. He cooks in a restaurant."', 'chef', ['nurse', 'pilot', 'farmer'],
    'คนที่ทำอาหารในร้านอาหารเรียกว่า chef', 3, 'A2', 'vocabulary'),
  q('We ___ often go to the beach in winter.', 'don\'t', ['doesn\'t', 'isn\'t', 'aren\'t'],
    'ประธาน we ใน present simple ปฏิเสธใช้ "don\'t"', 4, 'A2', 'grammar'),

  // ---------- B1 ----------
  q('I ___ here since 2019.', 'have lived', ['live', 'lived', 'am living'],
    '"since + จุดเริ่มเวลา" ใช้กับ present perfect', 5, 'B1', 'grammar'),
  q('If it rains tomorrow, we ___ at home.', 'will stay', ['stayed', 'would stay', 'stay'],
    'เงื่อนไขแบบที่ 1: If + present simple, will + verb', 5, 'B1', 'grammar'),
  q('If I ___ you, I would study harder.', 'were', ['was', 'am', 'had been'],
    'เงื่อนไขแบบที่ 2 ใช้ "were" กับทุกประธาน', 5, 'B1', 'grammar'),
  q('The man ___ lives next door is a doctor.', 'who', ['which', 'whose', 'where'],
    'ใช้ "who" ขยายคำนามที่เป็นคน', 5, 'B1', 'grammar'),
  q('"Procrastination" means:', 'การผัดวันประกันพรุ่ง', ['การวางแผน', 'ความเร่งรีบ', 'ความตั้งใจ'],
    'procrastination คือการผัดผ่อนงานออกไป', 5, 'B1', 'vocabulary'),
  q('I\'m interested ___ learning new languages.', 'in', ['at', 'on', 'for'],
    'สำนวนตายตัวคือ "be interested in"', 4, 'B1', 'grammar'),
  q('The letter ___ yesterday.', 'was sent', ['sent', 'is sent', 'has sent'],
    'ประโยค passive ในอดีต: was/were + past participle', 5, 'B1', 'grammar'),
  q('You look tired. You ___ take a break.', 'should', ['must', 'can', 'will'],
    '"should" ใช้ให้คำแนะนำ', 5, 'B1', 'grammar'),
  q('Please ___ the form before you leave.', 'fill in', ['fill up', 'fill off', 'fill down'],
    'phrasal verb "fill in" หมายถึงกรอกแบบฟอร์ม', 6, 'B1', 'vocabulary'),
  q('She speaks English ___ than her brother.', 'more fluently', ['fluenter', 'most fluently', 'fluently'],
    'คำวิเศษณ์หลายพยางค์เปรียบเทียบด้วย "more"', 5, 'B1', 'grammar'),

  // ---------- B2 ----------
  q('The ___ of the building is impressive.', 'architecture', ['construct', 'building', 'architect'],
    'architecture หมายถึงงานออกแบบสถาปัตยกรรม ส่วน architect คือตัวบุคคล', 6, 'B2', 'vocabulary'),
  q('Choose the most polite way to disagree.', 'I see your point, but I have a different view.',
    ['You are completely wrong.', 'That makes no sense.', 'No way.'],
    'การไม่เห็นด้วยอย่างสุภาพควรรับฟังก่อนแล้วค่อยเสนอมุมมองต่าง', 7, 'B2', 'vocabulary'),
  q('He said he ___ finished the report.', 'had', ['has', 'have', 'was'],
    'reported speech เลื่อนกาล present perfect → past perfect (had)', 7, 'B2', 'grammar'),
  q('I look forward to ___ from you.', 'hearing', ['hear', 'be heard', 'have heard'],
    '"look forward to" ตามด้วย gerund (-ing)', 6, 'B2', 'grammar'),
  q('She has been working here ___ five years.', 'for', ['since', 'during', 'from'],
    '"for" ใช้กับช่วงระยะเวลา ส่วน "since" ใช้กับจุดเริ่มต้น', 6, 'B2', 'grammar'),
  q('___ the heavy rain, the match continued.', 'Despite', ['Although', 'However', 'Because'],
    '"Despite" ตามด้วยคำนาม ส่วน "Although" ตามด้วยประโยค', 7, 'B2', 'grammar'),
  q('The company decided to ___ the launch until next year.', 'postpone', ['cancel', 'promote', 'proceed'],
    'postpone คือเลื่อนออกไป ต่างจาก cancel ที่แปลว่ายกเลิก', 6, 'B2', 'vocabulary'),
  q('It\'s high time we ___ something about it.', 'did', ['do', 'will do', 'have done'],
    'สำนวน "It\'s high time" ตามด้วย past simple แม้พูดถึงปัจจุบัน', 8, 'B2', 'grammar'),
  q('His argument was ___ ; nobody could refute it.', 'compelling', ['dull', 'trivial', 'vague'],
    'compelling หมายถึงน่าเชื่อถือจนโต้แย้งได้ยาก', 7, 'B2', 'vocabulary'),
  q('Not only ___ late, but he also forgot the documents.', 'was he', ['he was', 'he is', 'was him'],
    'ขึ้นต้นด้วย "Not only" ต้องผัน verb มาไว้หน้าประธาน (inversion)', 8, 'B2', 'grammar'),

  // ---------- C1 ----------
  q('The company\'s ___ to adapt proved to be its downfall.', 'reluctance', ['reluctant', 'reluctantly', 'reluctance to'],
    'ตำแหน่งนี้ต้องการคำนาม จึงใช้ reluctance', 8, 'C1', 'grammar'),
  q('"Ephemeral" means:', 'lasting a very short time', ['extremely rare', 'very beautiful', 'highly complex'],
    'ephemeral = คงอยู่ชั่วครู่', 8, 'C1', 'vocabulary'),
  q('Rarely ___ such a compelling performance.', 'have we seen', ['we have seen', 'we saw', 'did we saw'],
    'คำบอกความถี่เชิงลบขึ้นต้นประโยคต้องใช้ inversion', 9, 'C1', 'grammar'),
  q('It was his persistence ___ ultimately won him the position.', 'that', ['which was', 'what', 'who'],
    'โครงสร้าง cleft sentence: It was X that ...', 8, 'C1', 'grammar'),
  q('The report was deliberately ___ to avoid taking a firm position.', 'ambiguous', ['explicit', 'concise', 'candid'],
    'ambiguous คือกำกวม ตรงข้ามกับ explicit ที่ชัดเจน', 8, 'C1', 'vocabulary'),
  q('The board insisted that the policy ___ reviewed immediately.', 'be', ['is', 'was', 'will be'],
    'หลัง insist that ใช้ subjunctive คือ verb รูป base form', 9, 'C1', 'grammar'),
  q('Her explanation only served to ___ the confusion.', 'compound', ['alleviate', 'resolve', 'clarify'],
    'compound ในที่นี้แปลว่าทำให้ยิ่งแย่ลง', 9, 'C1', 'vocabulary'),
  q('Had she known the risks, she ___ differently.', 'would have acted', ['would act', 'had acted', 'will act'],
    'เงื่อนไขแบบที่ 3 ละ if แล้วผัน Had ขึ้นต้น', 9, 'C1', 'grammar'),
  q('"To take something with a grain of salt" means to:', 'treat it with scepticism', ['accept it fully', 'find it delicious', 'repeat it often'],
    'สำนวนนี้แปลว่าอย่าเพิ่งเชื่อทั้งหมด ควรตั้งข้อสงสัยไว้บ้าง', 8, 'C1', 'vocabulary'),
  q('The findings are ___ with our earlier hypothesis.', 'consistent', ['consistent to', 'consisting', 'consisted'],
    'collocation ที่ถูกคือ "consistent with"', 8, 'C1', 'vocabulary'),

  // ---------- C2 ----------
  q('The author\'s ___ observations reveal deep insight.', 'perspicacious', ['obvious', 'confusing', 'hesitant'],
    'perspicacious คือมีสายตาแหลมคม เข้าใจลึกซึ้ง', 10, 'C2', 'vocabulary'),
  q('"Ubiquitous" most nearly means:', 'present everywhere', ['rarely seen', 'strongly disliked', 'newly invented'],
    'ubiquitous = พบได้ทุกหนทุกแห่ง', 9, 'C2', 'vocabulary'),
  q('His remarks were considered ___ and cost him his position.', 'injudicious', ['prudent', 'measured', 'astute'],
    'injudicious คือขาดวิจารณญาณ ตรงข้ามกับ prudent', 10, 'C2', 'vocabulary'),
  q('Little ___ that the decision would prove so consequential.', 'did they realise', ['they realised', 'they did realise', 'realised they'],
    '"Little" ขึ้นต้นประโยคเชิงลบต้องใช้ inversion', 10, 'C2', 'grammar'),
  q('The policy was criticised for being ___ — it addressed symptoms, not causes.', 'palliative', ['radical', 'systemic', 'exhaustive'],
    'palliative คือบรรเทาอาการโดยไม่แก้ต้นเหตุ', 10, 'C2', 'vocabulary'),
  q('She has an ___ grasp of the subject, rarely matched by her peers.', 'unparalleled', ['adequate', 'elementary', 'tentative'],
    'unparalleled คือไม่มีใครเทียบได้', 9, 'C2', 'vocabulary'),
  q('The argument, ___ elegant, ultimately rests on a false premise.', 'however', ['although', 'despite', 'whereas'],
    'โครงสร้าง "however + adjective" แปลว่าไม่ว่าจะ...เพียงใดก็ตาม', 10, 'C2', 'grammar'),
  q('"To hold forth" on a topic means to:', 'speak at length about it', ['avoid discussing it', 'summarise it briefly', 'write about it'],
    'hold forth คือพูดยืดยาวเกี่ยวกับเรื่องใดเรื่องหนึ่ง', 10, 'C2', 'vocabulary'),
  q('Were the proposal ___ , the committee would reconsider.', 'amended', ['amend', 'amending', 'to amending'],
    'โครงสร้าง inversion แบบ formal: Were + ประธาน + past participle', 10, 'C2', 'grammar'),
  q('His account of events was notably ___ , omitting all inconvenient details.', 'tendentious', ['impartial', 'exhaustive', 'meticulous'],
    'tendentious คือลำเอียง มีวาระซ่อนเร้น ตรงข้ามกับ impartial', 10, 'C2', 'vocabulary'),
]

export interface SeedCourse {
  title: string
  description: string
  cefrLevel: CEFRLevel
  instructorName: string
  duration: number
  learningOutcomes: string[]
  videos: Array<{ title: string; description: string; minutes: number }>
}

export const SEED_COURSES: SeedCourse[] = [
  {
    title: 'English Foundations',
    description: 'ปูพื้นฐานภาษาอังกฤษตั้งแต่เริ่มต้น เหมาะกับผู้ที่เพิ่งหัดใช้ภาษาอังกฤษในชีวิตประจำวัน',
    cefrLevel: 'A1',
    instructorName: 'Sarah Johnson',
    duration: 20,
    learningOutcomes: ['ทักทายและแนะนำตัว', 'ตัวเลขและสี', 'Verb to be', 'คำนามเอกพจน์และพหูพจน์'],
    videos: [
      { title: 'Greetings and Introductions', description: 'ทักทายและแนะนำตัวในสถานการณ์ทั่วไป', minutes: 8 },
      { title: 'Verb To Be: am, is, are', description: 'การใช้ verb to be กับประธานแต่ละแบบ', minutes: 12 },
      { title: 'Numbers, Colours and Everyday Nouns', description: 'คำศัพท์พื้นฐานที่ใช้บ่อยที่สุด', minutes: 10 },
    ],
  },
  {
    title: 'Everyday Communication',
    description: 'สื่อสารเรื่องใกล้ตัวได้ด้วยประโยคง่าย ๆ เช่น กิจวัตร การซื้อของ และการถามทาง',
    cefrLevel: 'A2',
    instructorName: 'Michael Smith',
    duration: 30,
    learningOutcomes: ['Present simple', 'Past simple', 'การเปรียบเทียบขั้นกว่า', 'บทสนทนาในชีวิตประจำวัน'],
    videos: [
      { title: 'Talking About Your Daily Routine', description: 'เล่ากิจวัตรประจำวันด้วย present simple', minutes: 14 },
      { title: 'Past Simple for Beginners', description: 'เล่าเรื่องที่เกิดขึ้นแล้วด้วย past simple', minutes: 15 },
      { title: 'Shopping and Asking for Prices', description: 'บทสนทนาเวลาซื้อของและถามราคา', minutes: 11 },
    ],
  },
  {
    title: 'Intermediate Conversation',
    description: 'ยกระดับการสนทนาให้เป็นธรรมชาติ แสดงความคิดเห็นและเล่าประสบการณ์ได้ลื่นไหลขึ้น',
    cefrLevel: 'B1',
    instructorName: 'Emma Wilson',
    duration: 40,
    learningOutcomes: ['Present perfect', 'ประโยคเงื่อนไข', 'Relative clauses', 'การแสดงความคิดเห็น'],
    videos: [
      { title: 'Present Perfect in Real Conversations', description: 'ใช้ present perfect เล่าประสบการณ์', minutes: 18 },
      { title: 'Conditionals Type 1 and 2', description: 'พูดถึงเงื่อนไขและสถานการณ์สมมติ', minutes: 20 },
      { title: 'Expressing Opinions Naturally', description: 'วลีที่เจ้าของภาษาใช้แสดงความคิดเห็น', minutes: 16 },
    ],
  },
  {
    title: 'Business English Essentials',
    description: 'ภาษาอังกฤษสำหรับที่ทำงาน ครอบคลุมการเขียนอีเมล การประชุม และการนำเสนอ',
    cefrLevel: 'B2',
    instructorName: 'David Brown',
    duration: 45,
    learningOutcomes: ['การเขียนอีเมลเชิงธุรกิจ', 'ศัพท์การประชุม', 'ทักษะการนำเสนอ', 'การเจรจาต่อรอง'],
    videos: [
      { title: 'Writing Professional Emails', description: 'โครงสร้างและโทนของอีเมลเชิงธุรกิจ', minutes: 22 },
      { title: 'Leading and Joining Meetings', description: 'วลีที่ใช้ในการประชุมภาษาอังกฤษ', minutes: 25 },
      { title: 'Presentation Skills That Persuade', description: 'เทคนิคการนำเสนอให้น่าเชื่อถือ', minutes: 24 },
    ],
  },
  {
    title: 'Advanced Academic English',
    description: 'ภาษาอังกฤษเชิงวิชาการสำหรับการเขียนเรียงความ การวิเคราะห์ และการอ้างอิงแหล่งข้อมูล',
    cefrLevel: 'C1',
    instructorName: 'Jennifer Davis',
    duration: 50,
    learningOutcomes: ['การเขียนเชิงวิชาการ', 'ไวยากรณ์ขั้นสูง', 'การวิเคราะห์เชิงวิพากษ์', 'โครงสร้างเรียงความ'],
    videos: [
      { title: 'Structuring an Academic Essay', description: 'วางโครงเรียงความให้มีเหตุผลรองรับ', minutes: 28 },
      { title: 'Advanced Grammar: Inversion and Cleft Sentences', description: 'โครงสร้างประโยคระดับสูง', minutes: 26 },
      { title: 'Critical Reading and Analysis', description: 'อ่านเชิงวิพากษ์และประเมินข้อโต้แย้ง', minutes: 30 },
    ],
  },
  {
    title: 'Mastery and Nuance',
    description: 'ขัดเกลาภาษาให้ใกล้เคียงเจ้าของภาษา เน้นสำนวน ระดับภาษา และความละเอียดอ่อนของความหมาย',
    cefrLevel: 'C2',
    instructorName: 'Robert Taylor',
    duration: 60,
    learningOutcomes: ['สำนวนขั้นสูง', 'การเลือกระดับภาษา', 'การโต้วาที', 'ความแม่นยำของคำศัพท์'],
    videos: [
      { title: 'Idiomatic English in Context', description: 'สำนวนที่เจ้าของภาษาใช้จริงพร้อมบริบท', minutes: 32 },
      { title: 'Register: Formal, Neutral and Informal', description: 'เลือกใช้ระดับภาษาให้เหมาะกับสถานการณ์', minutes: 30 },
      { title: 'Debate and Argumentation', description: 'สร้างและหักล้างข้อโต้แย้งอย่างมีชั้นเชิง', minutes: 34 },
    ],
  },
]
