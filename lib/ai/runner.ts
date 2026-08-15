import { prisma } from '../db'
import { getOpenAIClient } from '../openai'
import { resolveOpenAIModel } from '../settings'

/**
 * ตัวกลางที่ตัวแทน AI ทุกตัวต้องเรียกผ่าน
 *
 * ทำสามอย่างที่ทุกตัวต้องการเหมือนกัน จึงไม่ต้องเขียนซ้ำ
 *   1. หาคีย์และโมเดล แล้วบอกให้ชัดเมื่อยังไม่ได้ตั้งค่า
 *   2. บังคับให้ผลลัพธ์เป็น JSON ตามรูปแบบที่ตกลงไว้
 *   3. บันทึกทุกการเรียกลง AiUsage ทั้งที่สำเร็จและล้มเหลว
 *
 * ข้อ 3 สำคัญกว่าที่คิด — ระบบ AI ตัวเดิมของโปรเจกต์นี้ล้มเหลวเงียบ ๆ มานาน
 * เพราะเรียกโมเดลที่ถูกปลดระวางแล้วตกไปใช้ค่า fallback โดยไม่มีใครรู้
 * เมื่อมีบันทึกทุกครั้ง ความล้มเหลวจะนับได้ ไม่ใช่มองไม่เห็น
 */

export type AIStatus = 'ok' | 'no-key' | 'error'

export interface AgentResult<T> {
  status: AIStatus
  data: T | null
  model?: string
  message?: string
  latencyMs?: number
}

interface RunOptions {
  /** ชื่อตัวแทน ใช้แยกในบันทึกการใช้งาน */
  agent: string
  system: string
  user: string
  maxTokens?: number
  userId?: string
  /** อุณหภูมิต่ำสำหรับงานที่ต้องการความสม่ำเสมอ เช่น การจัดระดับ */
  temperature?: number
}

async function log(entry: {
  agent: string
  model: string
  status: AIStatus
  promptTokens?: number
  outputTokens?: number
  latencyMs: number
  userId?: string
  errorMessage?: string
}) {
  try {
    await prisma.aiUsage.create({
      data: {
        agent: entry.agent,
        model: entry.model,
        status: entry.status,
        promptTokens: entry.promptTokens ?? 0,
        outputTokens: entry.outputTokens ?? 0,
        latencyMs: entry.latencyMs,
        userId: entry.userId,
        errorMessage: entry.errorMessage?.slice(0, 1000),
      },
    })
  } catch (error) {
    // บันทึกไม่ได้ไม่ควรทำให้ฟีเจอร์ที่ผู้ใช้กำลังใช้อยู่ล้มตาม
    console.error('บันทึกการใช้งาน AI ไม่สำเร็จ:', error)
  }
}

export async function runAgent<T>(options: RunOptions): Promise<AgentResult<T>> {
  const startedAt = Date.now()
  const { client } = await getOpenAIClient()
  const model = await resolveOpenAIModel()

  if (!client) {
    await log({
      agent: options.agent,
      model,
      status: 'no-key',
      latencyMs: Date.now() - startedAt,
      userId: options.userId,
    })
    return {
      status: 'no-key',
      data: null,
      message: 'ยังไม่ได้ตั้งค่า OpenAI API key',
    }
  }

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: options.system },
        { role: 'user', content: options.user },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: options.maxTokens ?? 900,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    })

    const latencyMs = Date.now() - startedAt
    const content = response.choices[0]?.message?.content

    if (!content) {
      await log({
        agent: options.agent,
        model,
        status: 'error',
        latencyMs,
        userId: options.userId,
        errorMessage: 'โมเดลไม่ได้ตอบเนื้อหากลับมา',
      })
      return { status: 'error', data: null, model, message: 'โมเดลไม่ได้ตอบกลับ', latencyMs }
    }

    const data = JSON.parse(content) as T

    await log({
      agent: options.agent,
      model,
      status: 'ok',
      promptTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
      latencyMs,
      userId: options.userId,
    })

    return { status: 'ok', data, model, latencyMs }
  } catch (error) {
    const latencyMs = Date.now() - startedAt
    const message = error instanceof Error ? error.message : String(error)
    await log({
      agent: options.agent,
      model,
      status: 'error',
      latencyMs,
      userId: options.userId,
      errorMessage: message,
    })
    console.error(`[AI:${options.agent}] ล้มเหลว:`, message)
    return { status: 'error', data: null, model, message, latencyMs }
  }
}

/** รายชื่อตัวแทน AI ทั้งหมดในระบบ ใช้แสดงสถานะในคอนโซลผู้ดูแล */
export const AI_AGENTS = [
  {
    id: 'explain-answer',
    name: 'ผู้อธิบายคำตอบ',
    supports: 'ผู้เรียน',
    purpose: 'อธิบายเป็นรายบุคคลว่าทำไมคำตอบที่เลือกจึงผิด และควรจำหลักอะไร',
  },
  {
    id: 'recommend-courses',
    name: 'ผู้แนะนำคอร์ส',
    supports: 'ผู้เรียน',
    purpose: 'จัดลำดับคอร์สจากจุดอ่อนที่วัดได้ พร้อมเหตุผลว่าทำไมควรเรียนตัวนี้ก่อน',
  },
  {
    id: 'select-question',
    name: 'ผู้คัดข้อสอบ',
    supports: 'ผู้เรียน',
    purpose: 'เลือกหัวข้อของข้อถัดไปจากรูปแบบการตอบ แทนการสุ่มล้วน',
  },
  {
    id: 'analytics-insight',
    name: 'ผู้สรุปสถิติ',
    supports: 'ผู้ดูแล',
    purpose: 'อ่านการกระจายระดับและอัตราตอบผิด แล้วสรุปว่าควรลงมือทำอะไรต่อ',
  },
  {
    id: 'classify-video',
    name: 'ผู้จัดระดับเนื้อหา',
    supports: 'ผู้ดูแล',
    purpose: 'เสนอระดับของวิดีโอจากชื่อและคำอธิบาย พร้อมเหตุผลและความมั่นใจ',
  },
  {
    id: 'chatbot',
    name: 'ผู้ช่วยตอบคำถาม',
    supports: 'ผู้เรียน',
    purpose:
      'ตอบคำถามการใช้งาน โดยตอบจากข้อมูลของผู้ถามและคลังคำถามที่พบบ่อยก่อน เรียก AI เฉพาะคำถามที่สองชั้นแรกตอบไม่ได้',
  },
  {
    id: 'assess-writing',
    name: 'ผู้ตรวจงานเขียน',
    supports: 'ผู้เรียน',
    purpose:
      'ตรวจงานเขียนจริงแล้วประเมินระดับพร้อมแก้รายจุด วัดความสามารถในการผลิตภาษาที่ข้อสอบปรนัยวัดไม่ได้',
  },
  {
    id: 'generate-question',
    name: 'ผู้ออกข้อสอบ',
    supports: 'ทีมวิชาการ',
    purpose: 'ร่างข้อสอบใหม่ตามระดับและหัวข้อ แล้วให้ตัวตรวจสอบยืนยันเฉลยก่อนใช้',
  },
] as const

/**
 * ปรับค่าความมั่นใจให้อยู่ในช่วง 0–100 เสมอ
 *
 * โมเดลตอบมาได้สองแบบแม้จะสั่งให้ใช้ 0–100 คือเป็นเปอร์เซ็นต์ (70)
 * หรือเป็นเศษส่วน (0.7) ถ้าไม่แปลง ค่า 0.7 จะแสดงเป็น "0.7%"
 * ซึ่งอ่านแล้วเข้าใจว่าแทบไม่มั่นใจเลย ทั้งที่โมเดลหมายถึงมั่นใจ 70%
 */
export function normaliseConfidence(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  // ค่าที่ไม่เกิน 1 ตีความว่าเป็นเศษส่วน ยกเว้น 0 ซึ่งแปลว่าไม่มั่นใจจริง ๆ
  const scaled = n > 0 && n <= 1 ? n * 100 : n
  return Math.round(Math.max(0, Math.min(100, scaled)))
}
