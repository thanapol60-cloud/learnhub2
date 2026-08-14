import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-middleware'
import { AI_AGENTS } from '@/lib/ai/runner'
import { resolveOpenAIKey, resolveOpenAIModel } from '@/lib/settings'

export const dynamic = 'force-dynamic'

/**
 * สถานะของระบบ AI ทั้งหมด พร้อมสถิติการเรียกใช้จริง
 *
 * มีไว้ตอบคำถามว่า "ระบบ AI ทำงานจริงหรือเปล่า" ด้วยตัวเลขที่ตรวจสอบได้
 * ไม่ใช่คำกล่าวอ้าง — ตัวเลขทุกตัวมาจากตาราง AiUsage ที่บันทึกทุกการเรียก
 * ทั้งครั้งที่สำเร็จและครั้งที่ล้มเหลว
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { key, source } = await resolveOpenAIKey()
    const model = await resolveOpenAIModel()

    const usage = await prisma.aiUsage.groupBy({
      by: ['agent', 'status'],
      _count: true,
      _sum: { promptTokens: true, outputTokens: true },
      _avg: { latencyMs: true },
    })

    const agents = AI_AGENTS.map((agent) => {
      const rows = usage.filter((u) => u.agent === agent.id)
      const ok = rows.find((r) => r.status === 'ok')
      const errors = rows
        .filter((r) => r.status === 'error')
        .reduce((sum, r) => sum + r._count, 0)
      const noKey = rows
        .filter((r) => r.status === 'no-key')
        .reduce((sum, r) => sum + r._count, 0)

      return {
        ...agent,
        calls: rows.reduce((sum, r) => sum + r._count, 0),
        successes: ok?._count ?? 0,
        errors,
        skippedNoKey: noKey,
        promptTokens: ok?._sum.promptTokens ?? 0,
        outputTokens: ok?._sum.outputTokens ?? 0,
        avgLatencyMs: Math.round(ok?._avg.latencyMs ?? 0),
      }
    })

    const recent = await prisma.aiUsage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        agent: true,
        model: true,
        status: true,
        promptTokens: true,
        outputTokens: true,
        latencyMs: true,
        errorMessage: true,
        createdAt: true,
      },
    })

    const totals = agents.reduce(
      (acc, a) => ({
        calls: acc.calls + a.calls,
        successes: acc.successes + a.successes,
        errors: acc.errors + a.errors,
        promptTokens: acc.promptTokens + a.promptTokens,
        outputTokens: acc.outputTokens + a.outputTokens,
      }),
      { calls: 0, successes: 0, errors: 0, promptTokens: 0, outputTokens: 0 }
    )

    return NextResponse.json({
      configured: Boolean(key),
      source,
      model,
      agents,
      totals,
      recent,
    })
  } catch (error) {
    console.error('อ่านสถานะ AI ไม่สำเร็จ:', error)
    return NextResponse.json({ error: 'อ่านสถานะ AI ไม่สำเร็จ' }, { status: 500 })
  }
}
