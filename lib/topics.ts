/**
 * ชื่อหัวข้อสำหรับแสดงผล — คีย์ตรงกับ Question.topic และ Course.topics
 * (สคริปต์ scripts/tag-question-topics.mjs เป็นตัวกำหนดว่ามีหัวข้ออะไรบ้าง)
 */
export const TOPIC_LABELS: Record<string, string> = {
  'verb-to-be': 'Verb to be',
  articles: 'Articles (a/an/the)',
  plurals: 'คำนามพหูพจน์',
  'pronouns-possessives': 'สรรพนามและความเป็นเจ้าของ',
  'present-simple': 'Present simple',
  'present-continuous': 'Present continuous',
  'past-simple': 'Past simple',
  'wh-questions': 'การตั้งคำถาม Wh-',
  prepositions: 'คำบุพบท',
  comparatives: 'การเปรียบเทียบ',
  quantifiers: 'การบอกปริมาณ',
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
  collocations: 'คำที่ใช้คู่กัน',
  'linking-words': 'คำเชื่อมและการขัดแย้ง',
  subjunctive: 'Subjunctive',
  'participle-clauses': 'Participle clauses',
  idioms: 'สำนวน',
  'register-nuance': 'ระดับภาษาและนัยของคำ',
  'vocabulary-precision': 'การเลือกใช้คำ',
  'reading-detail': 'อ่านจับใจความ: รายละเอียด',
  'reading-main-idea': 'อ่านจับใจความ: ใจความหลัก',
  'reading-inference': 'อ่านจับใจความ: ตีความ',
  'word-order': 'ลำดับคำในประโยค',
  'word-formation': 'การสร้างคำ',
}

/** หัวข้อที่ไม่รู้จักให้แสดงคีย์ดิบ ดีกว่าแสดงค่าว่าง */
export function topicLabel(topic: string): string {
  return TOPIC_LABELS[topic] ?? topic
}
