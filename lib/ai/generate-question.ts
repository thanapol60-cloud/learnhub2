import { runAgent, AgentResult } from './runner'
import { SUBJECTS, SubjectKey } from '../subjects'
import { topicLabel } from '../topics'

/**
 * ตัวแทนที่ 6 — ผู้ออกข้อสอบ (ทำงานเป็นคู่: ผู้ร่าง + ผู้ตรวจ)
 *
 * เคยลองใช้โมเดลท้องถิ่นผ่าน Ollama มาก่อน ผลคือรูปแบบ JSON ถูกต้องทุกครั้ง
 * แต่ "เฉลยผิด" ในทุกตัวอย่างที่สุ่มตรวจ ข้อสอบที่เฉลยผิดอันตรายกว่าไม่มีข้อสอบ
 * เพราะระบบจะบอกผู้เรียนว่าเขาผิดทั้งที่ตอบถูก แล้วลดระดับเขาลงด้วย
 *
 * บทเรียนนั้นทำให้ที่นี่แยกเป็นสองขั้นเสมอ
 *   ขั้นที่ 1 ให้โมเดลร่างข้อสอบ
 *   ขั้นที่ 2 ให้โมเดล "ตอบข้อสอบนั้นใหม่โดยไม่เห็นเฉลย" แล้วเทียบว่าตรงกันไหม
 * ถ้าสองขั้นไม่ตรงกัน แปลว่าข้อนั้นกำกวมหรือเฉลยผิด ระบบจะทิ้งทันที ไม่ส่งต่อให้ผู้ดูแล
 */

export interface DraftQuestion {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  passage?: string
}

export interface VerifiedQuestion extends DraftQuestion {
  /** ผ่านการตรวจสอบด้วยการให้โมเดลตอบใหม่แล้วตรงกัน */
  verified: true
}

interface AnswerAttempt {
  answer: string
  confidence: number
}

/** ตรวจโครงสร้างก่อน ไม่ต้องเปลืองการเรียกโมเดลกับข้อที่ผิดรูปตั้งแต่ต้น */
function structureProblems(draft: DraftQuestion): string[] {
  const problems: string[] = []
  if (!draft.question?.trim()) problems.push('ไม่มีโจทย์')
  if (!Array.isArray(draft.options) || draft.options.length !== 4) problems.push('ตัวเลือกไม่ครบ 4')
  else {
    if (new Set(draft.options.map((o) => o.trim())).size !== 4) problems.push('ตัวเลือกซ้ำกัน')
    if (!draft.options.includes(draft.correctAnswer)) problems.push('เฉลยไม่อยู่ในตัวเลือก')
  }
  if (!draft.explanation?.trim()) problems.push('ไม่มีคำอธิบาย')
  if (draft.explanation && !/[฀-๿]/.test(draft.explanation) && !/\d/.test(draft.explanation))
    problems.push('คำอธิบายไม่ใช่ภาษาไทย')
  return problems
}

export async function generateQuestion(input: {
  subject: SubjectKey
  level: string
  topic: string
  /** โจทย์ที่มีอยู่แล้ว ส่งไปกันไม่ให้ออกซ้ำ */
  existingQuestions?: string[]
  userId?: string
}): Promise<AgentResult<VerifiedQuestion> & { rejectedReason?: string }> {
  const definition = SUBJECTS[input.subject]

  // ---- ขั้นที่ 1: ร่างข้อสอบ ----
  const draft = await runAgent<DraftQuestion>({
    agent: 'generate-question',
    userId: input.userId,
    maxTokens: 800,
    temperature: 0.7, // ต้องการความหลากหลายในขั้นร่าง
    system: [
      `คุณเป็นผู้ออกข้อสอบวิชา${definition.name}`,
      `ระดับ ${input.level}: ${definition.levelDescriptions[input.level]}`,
      '',
      'กติกา:',
      '- ออกข้อสอบปรนัย 4 ตัวเลือก มีคำตอบถูกเพียงข้อเดียวและต้องถูกอย่างไม่มีข้อโต้แย้ง',
      '- ตัวลวงทั้งสามต้องผิดชัดเจน แต่ดูน่าเชื่อพอที่คนไม่แม่นจะเลือก',
      '- คำอธิบายเป็นภาษาไทย บอกว่าทำไมข้อถูกจึงถูก',
      '- ห้ามออกข้อที่กำกวมหรือขึ้นกับบริบทที่ไม่ได้ให้ไว้',
      '- ห้ามคัดลอกข้อสอบจากแหล่งใด ต้องแต่งขึ้นใหม่',
      '',
      'ตอบเป็น JSON: {"question": string, "options": [string,string,string,string], "correctAnswer": string, "explanation": string}',
    ].join('\n'),
    user: [
      `หัวข้อที่ต้องการวัด: ${topicLabel(input.topic)} (${input.topic})`,
      `ระดับ: ${input.level}`,
      input.existingQuestions?.length
        ? `ห้ามซ้ำหรือใกล้เคียงกับข้อเหล่านี้:\n${input.existingQuestions
            .slice(0, 10)
            .map((q) => `- ${q}`)
            .join('\n')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n'),
  })

  if (draft.status !== 'ok' || !draft.data) {
    return { ...draft, data: null }
  }

  const problems = structureProblems(draft.data)
  if (problems.length) {
    return {
      status: 'error',
      data: null,
      model: draft.model,
      message: `ข้อที่ร่างมาไม่ผ่านการตรวจโครงสร้าง: ${problems.join(', ')}`,
      rejectedReason: problems.join(', '),
    }
  }

  // ---- ขั้นที่ 2: ตรวจเฉลยด้วยการให้ตอบใหม่โดยไม่เห็นเฉลย ----
  const check = await runAgent<AnswerAttempt>({
    agent: 'generate-question',
    userId: input.userId,
    maxTokens: 200,
    temperature: 0, // ขั้นตรวจต้องนิ่งที่สุด
    system: [
      `คุณเป็นผู้เชี่ยวชาญวิชา${definition.name} กำลังทำข้อสอบ`,
      'เลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว',
      'ถ้าโจทย์กำกวมจนมีคำตอบถูกได้มากกว่าหนึ่งข้อ ให้ confidence ต่ำกว่า 50',
      '',
      'ตอบเป็น JSON: {"answer": string, "confidence": number}',
      'answer ต้องเป็นข้อความของตัวเลือกที่เลือก ตรงตามที่ให้มาทุกตัวอักษร',
    ].join('\n'),
    user: [
      draft.data.question,
      '',
      ...draft.data.options.map((o) => `- ${o}`),
    ].join('\n'),
  })

  if (check.status !== 'ok' || !check.data) {
    return {
      status: 'error',
      data: null,
      model: draft.model,
      message: 'ตรวจสอบเฉลยไม่สำเร็จ จึงไม่รับข้อนี้',
      rejectedReason: 'ขั้นตรวจสอบล้มเหลว',
    }
  }

  // นี่คือด่านที่ Ollama เคยไม่ผ่าน — เฉลยที่ร่างไว้กับคำตอบที่ตรวจได้ต้องตรงกัน
  if (check.data.answer.trim() !== draft.data.correctAnswer.trim()) {
    return {
      status: 'error',
      data: null,
      model: draft.model,
      message: `เฉลยไม่ตรงกับที่ตรวจได้ (ร่างว่า "${draft.data.correctAnswer}" แต่ตรวจได้ "${check.data.answer}") จึงทิ้งข้อนี้`,
      rejectedReason: 'เฉลยไม่ตรงกับการตรวจสอบ',
    }
  }

  if ((check.data.confidence ?? 0) < 70) {
    return {
      status: 'error',
      data: null,
      model: draft.model,
      message: `ข้อนี้กำกวมเกินไป (ความมั่นใจตอนตรวจ ${check.data.confidence}%) จึงไม่รับ`,
      rejectedReason: 'โจทย์กำกวม',
    }
  }

  return {
    status: 'ok',
    data: { ...draft.data, verified: true },
    model: draft.model,
  }
}
