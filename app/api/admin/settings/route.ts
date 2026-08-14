import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getUser } from '@/lib/auth-middleware'
import {
  DEFAULT_OPENAI_MODEL,
  SETTING_KEYS,
  deleteSetting,
  looksLikeOpenAIKey,
  maskKey,
  resolveOpenAIKey,
  resolveOpenAIModel,
  setSetting,
} from '@/lib/settings'
import { testConnection } from '@/lib/openai'

export const dynamic = 'force-dynamic'

/**
 * ค่าตั้งของระบบสำหรับผู้ดูแล
 *
 * หลักที่ยึดตลอดไฟล์นี้: **ไม่ส่งคีย์เต็มกลับไปที่เบราว์เซอร์ไม่ว่ากรณีใด**
 * แม้ผู้เรียกจะผ่านการตรวจสิทธิ์ผู้ดูแลแล้วก็ตาม เพราะค่าที่ส่งออกไปหน้าเว็บ
 * จะไปโผล่ใน devtools, ประวัติเครือข่าย และแคชของเบราว์เซอร์
 * ผู้ดูแลเห็นแค่รูปแบบปิดบัง (sk-abc••••1234) ซึ่งพอให้รู้ว่าเป็นคีย์ตัวไหน
 */

/** อ่านสถานะปัจจุบัน — บอกว่าตั้งคีย์แล้วหรือยัง มาจากไหน และใช้โมเดลอะไร */
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { key, source } = await resolveOpenAIKey()
    const model = await resolveOpenAIModel()

    return NextResponse.json({
      openai: {
        configured: Boolean(key),
        source, // env | database | none
        maskedKey: key ? maskKey(key) : null,
        model,
        defaultModel: DEFAULT_OPENAI_MODEL,
        // ตั้งผ่าน environment แล้วแก้จากหน้าเว็บไม่ได้ เพราะ env มีลำดับสูงกว่า
        editable: source !== 'env',
      },
    })
  } catch (error) {
    console.error('Failed to read settings:', error)
    return NextResponse.json({ error: 'อ่านค่าตั้งไม่สำเร็จ' }, { status: 500 })
  }
}

/** บันทึกคีย์และโมเดล — ทดสอบการเชื่อมต่อจริงก่อนบันทึกเสมอ */
export async function PUT(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const admin = await getUser(request)
    const body = await request.json()
    const model: string = (body?.model || DEFAULT_OPENAI_MODEL).trim()

    // บันทึกเฉพาะโมเดล โดยไม่แตะคีย์เดิม
    if (body?.apiKey === undefined || body.apiKey === '') {
      await setSetting(SETTING_KEYS.openaiModel, model, { updatedById: admin?.id })
      return NextResponse.json({ ok: true, message: `บันทึกโมเดล ${model} แล้ว` })
    }

    const apiKey: string = String(body.apiKey).trim()

    if (!looksLikeOpenAIKey(apiKey)) {
      return NextResponse.json(
        {
          error:
            'รูปแบบคีย์ไม่ถูกต้อง — คีย์ของ OpenAI ขึ้นต้นด้วย sk- และยาวกว่านี้ ตรวจว่าคัดลอกมาครบหรือไม่',
        },
        { status: 400 }
      )
    }

    // ทดสอบก่อนบันทึก ไม่งั้นผู้ดูแลจะเพิ่งรู้ว่าคีย์ผิดตอนที่ผู้เรียนใช้งานจริง
    const test = await testConnection(apiKey, model)
    if (!test.ok) {
      return NextResponse.json(
        { error: `ทดสอบคีย์ไม่ผ่าน จึงไม่บันทึก: ${test.message}` },
        { status: 400 }
      )
    }

    await setSetting(SETTING_KEYS.openaiApiKey, apiKey, {
      encrypted: true,
      updatedById: admin?.id,
    })
    await setSetting(SETTING_KEYS.openaiModel, model, { updatedById: admin?.id })

    return NextResponse.json({
      ok: true,
      message: test.message,
      maskedKey: maskKey(apiKey),
    })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json({ error: 'บันทึกค่าตั้งไม่สำเร็จ' }, { status: 500 })
  }
}

/** ลบคีย์ที่เก็บไว้ ระบบจะกลับไปทำงานแบบไม่มี AI */
export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    await deleteSetting(SETTING_KEYS.openaiApiKey)
    return NextResponse.json({ ok: true, message: 'ลบคีย์ออกจากระบบแล้ว' })
  } catch (error) {
    console.error('Failed to delete key:', error)
    return NextResponse.json({ error: 'ลบคีย์ไม่สำเร็จ' }, { status: 500 })
  }
}
