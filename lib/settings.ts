import crypto from 'crypto'
import { prisma } from './db'

/**
 * ที่เก็บค่าตั้งของระบบ พร้อมการเข้ารหัสสำหรับค่าที่เป็นความลับ
 *
 * API key ที่ผู้ดูแลกรอกผ่านหน้าเว็บจะถูกเข้ารหัสด้วย AES-256-GCM ก่อนลงฐานข้อมูลเสมอ
 * เหตุผลคือถ้าฐานข้อมูลรั่ว (ซึ่งเคยเกิดกับโปรเจกต์นี้มาแล้วจากสตริงเชื่อมต่อที่หลุดขึ้น
 * ที่เก็บโค้ดสาธารณะ) คนที่ได้ข้อมูลไปจะยังใช้คีย์ไม่ได้ถ้าไม่มีกุญแจฝั่งเซิร์ฟเวอร์
 *
 * GCM เลือกเพราะตรวจจับการถูกแก้ไขได้ในตัว ถ้ามีคนแก้ค่าในฐานข้อมูลตรง ๆ การถอดรหัสจะล้มเหลว
 * แทนที่จะคืนข้อมูลขยะออกมาเงียบ ๆ
 */

const ALGORITHM = 'aes-256-gcm'

export const SETTING_KEYS = {
  openaiApiKey: 'openai.apiKey',
  openaiModel: 'openai.model',
} as const

/** โมเดลเริ่มต้น เลือกตัวที่ราคาถูกและเร็วพอสำหรับงานอธิบาย/จัดลำดับ */
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

/**
 * กุญแจเข้ารหัสมาจาก SETTINGS_SECRET ถ้าตั้งไว้
 * ถ้าไม่ได้ตั้ง จะอนุมานจาก DATABASE_URL ซึ่งเป็นความลับฝั่งเซิร์ฟเวอร์อยู่แล้ว
 * เพื่อให้ระบบใช้งานได้ทันทีโดยไม่ต้องตั้งค่าเพิ่ม และไม่มีทางเก็บคีย์เป็นข้อความธรรมดา
 *
 * ข้อแลกเปลี่ยน: ถ้าเปลี่ยน DATABASE_URL โดยไม่ได้ตั้ง SETTINGS_SECRET ไว้
 * ค่าที่เข้ารหัสไว้เดิมจะถอดไม่ออก ผู้ดูแลต้องกรอกคีย์ใหม่ — ระบบจะแจ้งให้ทราบ ไม่พังเงียบ
 */
function encryptionKey(): Buffer {
  const secret = process.env.SETTINGS_SECRET || process.env.DATABASE_URL
  if (!secret) {
    throw new Error('ต้องตั้ง SETTINGS_SECRET หรือ DATABASE_URL ก่อนใช้ที่เก็บค่าตั้ง')
  }
  return crypto.createHash('sha256').update(secret).digest()
}

function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // เก็บ iv, tag และเนื้อหาไว้ด้วยกัน เพื่อให้ถอดรหัสได้จากค่าเดียว
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':')
}

function decrypt(stored: string): string | null {
  try {
    const [ivPart, tagPart, dataPart] = stored.split(':')
    if (!ivPart || !tagPart || !dataPart) return null
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      encryptionKey(),
      Buffer.from(ivPart, 'base64')
    )
    decipher.setAuthTag(Buffer.from(tagPart, 'base64'))
    return Buffer.concat([
      decipher.update(Buffer.from(dataPart, 'base64')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    // กุญแจเปลี่ยนไปหรือข้อมูลถูกแก้ — คืน null ให้ผู้เรียกจัดการ ดีกว่าโยน error ขึ้นไปทั้งคำขอ
    return null
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } })
  if (!row) return null
  return row.encrypted ? decrypt(row.value) : row.value
}

export async function setSetting(
  key: string,
  value: string,
  options: { encrypted?: boolean; updatedById?: string } = {}
): Promise<void> {
  const encrypted = options.encrypted ?? false
  const stored = encrypted ? encrypt(value) : value
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: stored, encrypted, updatedById: options.updatedById },
    update: { value: stored, encrypted, updatedById: options.updatedById },
  })
}

export async function deleteSetting(key: string): Promise<void> {
  await prisma.setting.deleteMany({ where: { key } })
}

/**
 * คีย์ OpenAI ที่ระบบจะใช้จริง
 *
 * ตัวแปรสภาพแวดล้อมมาก่อนค่าที่กรอกในหน้าเว็บเสมอ เพราะถือว่าผู้ดูแลเซิร์ฟเวอร์
 * มีอำนาจเหนือกว่าผู้ดูแลระบบในแอป และช่วยให้ตัดการใช้งานฉุกเฉินได้จากฝั่ง deployment
 */
export async function resolveOpenAIKey(): Promise<{
  key: string | null
  source: 'env' | 'database' | 'none'
}> {
  if (process.env.OPENAI_API_KEY) {
    return { key: process.env.OPENAI_API_KEY, source: 'env' }
  }
  const stored = await getSetting(SETTING_KEYS.openaiApiKey)
  if (stored) return { key: stored, source: 'database' }
  return { key: null, source: 'none' }
}

export async function resolveOpenAIModel(): Promise<string> {
  return (
    process.env.OPENAI_MODEL ||
    (await getSetting(SETTING_KEYS.openaiModel)) ||
    DEFAULT_OPENAI_MODEL
  )
}

/**
 * ปิดบังคีย์ให้เหลือแค่พอให้ผู้ดูแลรู้ว่าเป็นคีย์ตัวไหน
 * ห้ามส่งคีย์เต็มกลับไปที่เบราว์เซอร์ไม่ว่ากรณีใด แม้ผู้เรียกจะเป็นผู้ดูแลก็ตาม
 */
export function maskKey(key: string): string {
  if (key.length <= 12) return '••••'
  return `${key.slice(0, 7)}••••${key.slice(-4)}`
}

/** ตรวจรูปแบบคีย์เบื้องต้น เพื่อจับการวางผิดช่องก่อนจะยิงไปที่ OpenAI */
export function looksLikeOpenAIKey(key: string): boolean {
  return /^sk-[A-Za-z0-9_-]{20,}$/.test(key.trim())
}
