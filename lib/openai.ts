import OpenAI from 'openai'
import { resolveOpenAIKey, resolveOpenAIModel } from './settings'

/**
 * ตัวเชื่อมกับ OpenAI สำหรับฟีเจอร์ AI ทั้งหมดของระบบ
 *
 * ทุกฟีเจอร์ต้องเรียกผ่านที่นี่ เพื่อให้มีจุดเดียวที่รู้ว่าคีย์มาจากไหน
 * และเพื่อให้ "ไม่มีคีย์" เป็นสถานะที่ตรวจได้ ไม่ใช่ error ที่โผล่กลางทาง
 *
 * บทเรียนจากของเดิม: โค้ดวิเคราะห์วิดีโอตัวเก่าเรียกโมเดลที่ถูกปลดระวางแล้ว
 * แล้วมี fallback เงียบ ๆ ที่คืนค่า "B1" เสมอ ผู้ใช้จึงเห็นเหมือนระบบทำงาน
 * ทั้งที่ไม่เคยเรียก AI สำเร็จเลย ที่นี่จึงคืนสถานะความล้มเหลวออกไปด้วยเสมอ
 */

export type AIStatus = 'ok' | 'no-key' | 'error'

export interface AIResult<T> {
  status: AIStatus
  data: T | null
  /** ข้อความอธิบายเมื่อใช้ไม่ได้ ใช้แสดงให้ผู้ดูแลเห็นว่าติดตรงไหน */
  message?: string
  model?: string
}

export async function getOpenAIClient(): Promise<{
  client: OpenAI | null
  source: 'env' | 'database' | 'none'
}> {
  const { key, source } = await resolveOpenAIKey()
  if (!key) return { client: null, source }
  return { client: new OpenAI({ apiKey: key }), source }
}

/**
 * เรียกโมเดลแล้วบังคับให้ตอบเป็น JSON ตามรูปแบบที่กำหนด
 * คืน AIResult เสมอ ผู้เรียกจึงต้องเขียนทางเลือกสำรองไว้ ไม่ใช่สมมติว่าสำเร็จ
 */
export async function askForJSON<T>(options: {
  system: string
  user: string
  maxTokens?: number
}): Promise<AIResult<T>> {
  const { client } = await getOpenAIClient()
  if (!client) {
    return {
      status: 'no-key',
      data: null,
      message: 'ยังไม่ได้ตั้งค่า OpenAI API key — ตั้งได้ที่หน้าตั้งค่าของผู้ดูแลระบบ',
    }
  }

  const model = await resolveOpenAIModel()

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: options.system },
        { role: 'user', content: options.user },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: options.maxTokens ?? 1000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return { status: 'error', data: null, message: 'โมเดลไม่ได้ตอบอะไรกลับมา', model }
    }

    return { status: 'ok', data: JSON.parse(content) as T, model }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('OpenAI request failed:', message)
    return { status: 'error', data: null, message, model }
  }
}

/** ทดสอบว่าคีย์ใช้ได้จริงด้วยการเรียกจริงหนึ่งครั้ง ไม่ใช่แค่ตรวจรูปแบบ */
export async function testConnection(apiKey: string, model: string): Promise<{
  ok: boolean
  message: string
}> {
  try {
    const client = new OpenAI({ apiKey })
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'ตอบกลับด้วยคำว่า OK เท่านั้น' }],
      max_completion_tokens: 5,
    })
    const reply = response.choices[0]?.message?.content?.trim() || ''
    return { ok: true, message: `เชื่อมต่อสำเร็จ · โมเดล ${model} ตอบกลับว่า "${reply}"` }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // แปลข้อผิดพลาดที่พบบ่อยให้เป็นภาษาที่ผู้ดูแลเอาไปแก้ต่อได้
    if (/401|invalid[_ ]api[_ ]key|Incorrect API key/i.test(message)) {
      return { ok: false, message: 'คีย์ไม่ถูกต้องหรือถูกยกเลิกแล้ว' }
    }
    if (/429|quota|billing/i.test(message)) {
      return { ok: false, message: 'คีย์ใช้ได้แต่เครดิตหมดหรือถูกจำกัดอัตราการเรียก — ตรวจสอบยอดเงินที่ OpenAI' }
    }
    if (/model|does not exist|404/i.test(message)) {
      return { ok: false, message: `บัญชีนี้ไม่มีสิทธิ์ใช้โมเดล ${model} — ลองเปลี่ยนเป็นโมเดลอื่น` }
    }
    return { ok: false, message }
  }
}
