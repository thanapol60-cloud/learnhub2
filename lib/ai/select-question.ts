import { runAgent, AgentResult } from './runner'
import { SUBJECTS, SubjectKey } from '../subjects'
import { topicLabel } from '../topics'

/**
 * ตัวแทนที่ 3 — ผู้คัดข้อสอบ
 *
 * กลไกเดิมเลือกข้อถัดไปด้วยการสุ่มจากระดับปัจจุบันล้วน ๆ ซึ่งเสียโอกาสสองทาง
 *   - ถ้าผู้เรียนพลาดเรื่อง conditionals ไปแล้วสองข้อ การสุ่มอาจไม่หยิบเรื่องนั้นมาอีกเลย
 *     ทั้งที่ควรถามซ้ำเพื่อยืนยันว่าเป็นจุดอ่อนจริงหรือแค่พลาดครั้งเดียว
 *   - หัวข้อที่ยังไม่เคยถามเลยจะไม่ถูกวัด ทำให้ภาพจุดอ่อนไม่ครบ
 *
 * ตัวนี้เลือกเฉพาะ "หัวข้อ" ของข้อถัดไป ไม่ได้เลือกตัวข้อสอบเอง
 * การเลือกข้อจริงยังทำด้วยโค้ดเหมือนเดิม จึงยังกันข้อซ้ำและกันการหลุดระดับได้อยู่
 * ถ้า AI ใช้ไม่ได้ ระบบกลับไปสุ่มแบบเดิมทันทีโดยไม่มีผลต่อผู้เรียน
 */

export interface QuestionChoice {
  /** หัวข้อที่ควรถามต่อ ต้องเป็นหนึ่งในรายการที่ให้ไป */
  topic: string
  /** เหตุผลสั้น ๆ ใช้เก็บไว้ตรวจสอบ ไม่ได้แสดงให้ผู้เรียนเห็น */
  reason: string
}

export async function selectNextTopic(input: {
  subject: SubjectKey
  level: string
  /** ผลตอบในรอบนี้ เรียงจากเก่าไปใหม่ */
  history: Array<{ topic: string | null; isCorrect: boolean }>
  /** หัวข้อที่ยังมีข้อสอบเหลือให้ถามในระดับนี้ */
  availableTopics: string[]
  userId?: string
}): Promise<AgentResult<QuestionChoice>> {
  const definition = SUBJECTS[input.subject]

  // สรุปผลรายหัวข้อให้โมเดลอ่านง่าย แทนการส่งประวัติดิบทั้งหมด
  const byTopic = new Map<string, { correct: number; wrong: number }>()
  for (const entry of input.history) {
    if (!entry.topic) continue
    const stat = byTopic.get(entry.topic) ?? { correct: 0, wrong: 0 }
    entry.isCorrect ? (stat.correct += 1) : (stat.wrong += 1)
    byTopic.set(entry.topic, stat)
  }

  const untested = input.availableTopics.filter((t) => !byTopic.has(t))

  const result = await runAgent<QuestionChoice>({
    agent: 'select-question',
    userId: input.userId,
    maxTokens: 200,
    temperature: 0.4,
    system: [
      `คุณกำลังคุมการสอบวัดระดับวิชา${definition.name}แบบปรับความยาก`,
      'หน้าที่คือเลือกว่าข้อถัดไปควรถามหัวข้ออะไร เพื่อให้วัดระดับได้แม่นที่สุดด้วยจำนวนข้อที่จำกัด',
      '',
      'หลักการเลือก:',
      '- หัวข้อที่เพิ่งตอบผิด ควรถามซ้ำอีกครั้งเพื่อแยกว่าเป็นจุดอ่อนจริงหรือพลาดครั้งเดียว',
      '- หัวข้อที่ยังไม่เคยถามเลย ควรได้รับโอกาสถาม เพื่อให้ภาพความสามารถครบด้าน',
      '- หัวข้อที่ตอบถูกติดกันหลายครั้งแล้ว ไม่ต้องถามซ้ำ เพราะไม่ได้ข้อมูลเพิ่ม',
      '',
      'กติกา:',
      '- topic ต้องเป็นค่าที่อยู่ในรายการหัวข้อที่ใช้ได้เท่านั้น ห้ามสร้างใหม่',
      '- reason เป็นภาษาไทย ไม่เกิน 1 ประโยค',
      '',
      'ตอบเป็น JSON: {"topic": string, "reason": string}',
    ].join('\n'),
    user: [
      `ระดับปัจจุบัน: ${input.level}`,
      `ทำไปแล้ว ${input.history.length} ข้อ`,
      '',
      'ผลรายหัวข้อในรอบนี้:',
      ...(byTopic.size
        ? [...byTopic.entries()].map(
            ([topic, s]) => `- ${topic} (${topicLabel(topic)}): ถูก ${s.correct} ผิด ${s.wrong}`
          )
        : ['- ยังไม่มี นี่เป็นข้อแรก']),
      '',
      `หัวข้อที่ยังไม่เคยถาม: ${untested.length ? untested.join(', ') : 'ไม่มี ถามครบทุกหัวข้อแล้ว'}`,
      '',
      `หัวข้อที่ใช้ได้ (เลือกจากรายการนี้เท่านั้น): ${input.availableTopics.join(', ')}`,
    ].join('\n'),
  })

  // โมเดลอาจตอบหัวข้อที่ไม่มีข้อสอบเหลือ ถือว่าใช้ไม่ได้ ให้ผู้เรียกกลับไปสุ่มแบบเดิม
  if (result.status === 'ok' && result.data && !input.availableTopics.includes(result.data.topic)) {
    return {
      ...result,
      status: 'error',
      data: null,
      message: `โมเดลเลือกหัวข้อ "${result.data.topic}" ซึ่งไม่มีข้อสอบเหลือในระดับนี้`,
    }
  }

  return result
}
