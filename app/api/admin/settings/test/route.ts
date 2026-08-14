import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { testConnection } from '@/lib/openai'
import { resolveOpenAIKey, resolveOpenAIModel } from '@/lib/settings'

export const dynamic = 'force-dynamic'

/**
 * ทดสอบคีย์ที่ตั้งค่าไว้แล้ว ด้วยการเรียก OpenAI จริงหนึ่งครั้ง
 * ใช้ตรวจว่าคีย์ยังใช้ได้อยู่หรือเครดิตหมดไปแล้ว โดยไม่ต้องรอให้ผู้เรียนเจอปัญหาก่อน
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  const { key } = await resolveOpenAIKey()
  if (!key) {
    return NextResponse.json(
      { ok: false, message: 'ยังไม่ได้ตั้งค่าคีย์' },
      { status: 400 }
    )
  }

  const model = await resolveOpenAIModel()
  const result = await testConnection(key, model)
  return NextResponse.json(result)
}
