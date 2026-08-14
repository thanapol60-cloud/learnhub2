import { runAgent, AgentResult } from './runner'
import { SUBJECTS, SubjectKey } from '../subjects'
import { topicLabel } from '../topics'

/**
 * ตัวแทนที่ 4 — ผู้สรุปสถิติ
 *
 * การ์ด "ข้อสังเกตจากข้อมูล" กับ "สิ่งที่ควรดำเนินการต่อ" ในหน้าสถิติเดิม
 * เป็นข้อความตายตัวที่เขียนไว้ในโค้ด ไม่ได้อ่านข้อมูลจริงเลย จึงพูดเหมือนกันหมด
 * ไม่ว่าผู้เรียนจะกระจุกที่ระดับไหนหรือพลาดหัวข้ออะไร
 *
 * ตัวนี้อ่านการกระจายระดับและอัตราตอบผิดรายหัวข้อจริง แล้วสรุปว่าควรลงมือทำอะไร
 */

export interface AnalyticsInsight {
  /** ข้อสังเกตจากข้อมูล — สิ่งที่เห็นได้จากตัวเลข */
  observations: string[]
  /** สิ่งที่ควรดำเนินการต่อ — ข้อเสนอที่ทำได้จริง */
  actions: string[]
}

export async function summariseAnalytics(input: {
  subject: SubjectKey
  levelDistribution: Record<string, number>
  assessed: number
  averageLevel: string
  enrollments: number
  /** หัวข้อที่ผู้เรียนพลาดมากที่สุดในวิชานี้ */
  weakestTopics: Array<{ topic: string; wrong: number; attempted: number }>
  /** จำนวนข้อสอบที่มีในแต่ละระดับ ใช้ดูว่าคลังบางระดับบางเกินไปไหม */
  questionsPerLevel: Record<string, number>
  userId?: string
}): Promise<AgentResult<AnalyticsInsight>> {
  const definition = SUBJECTS[input.subject]

  return runAgent<AnalyticsInsight>({
    agent: 'analytics-insight',
    userId: input.userId,
    maxTokens: 700,
    temperature: 0.3,
    system: [
      'คุณเป็นนักวิเคราะห์ข้อมูลการศึกษาที่ให้คำแนะนำกับผู้ดูแลแพลตฟอร์มเรียนออนไลน์',
      'หน้าที่คือดูตัวเลขจริงแล้วบอกว่าเห็นอะไร และควรลงมือทำอะไรต่อ',
      '',
      'กติกา:',
      '- ตอบเป็นภาษาไทย',
      '- อ้างตัวเลขจริงจากข้อมูลที่ให้มาเสมอ ห้ามพูดลอย ๆ แบบที่ใช้กับข้อมูลชุดไหนก็ได้',
      '- observations 3 ข้อ actions 3 ข้อ แต่ละข้อไม่เกิน 1 ประโยค',
      '- actions ต้องเป็นสิ่งที่ผู้ดูแลลงมือทำได้จริง เช่น เพิ่มข้อสอบระดับไหน ทำคอร์สเรื่องอะไร',
      '- ถ้าข้อมูลน้อยเกินกว่าจะสรุปได้ ให้บอกตรง ๆ ว่าต้องรอข้อมูลเพิ่ม',
      '',
      'ตอบเป็น JSON: {"observations": [string], "actions": [string]}',
    ].join('\n'),
    user: [
      `วิชา: ${definition.name} (เกณฑ์ ${definition.framework})`,
      `ผู้เรียนที่ประเมินแล้ว: ${input.assessed} คน · ระดับเฉลี่ย ${input.averageLevel}`,
      `การลงทะเบียนคอร์สวิชานี้: ${input.enrollments} รายการ`,
      '',
      'การกระจายผู้เรียนตามระดับ:',
      ...definition.levels.map(
        (level) =>
          `- ${level} (${definition.levelDescriptions[level]}): ${input.levelDistribution[level] ?? 0} คน`
      ),
      '',
      'จำนวนข้อสอบที่มีในแต่ละระดับ:',
      ...definition.levels.map((level) => `- ${level}: ${input.questionsPerLevel[level] ?? 0} ข้อ`),
      '',
      'หัวข้อที่ผู้เรียนพลาดมากที่สุด:',
      ...(input.weakestTopics.length
        ? input.weakestTopics.map(
            (t) =>
              `- ${topicLabel(t.topic)}: ผิด ${t.wrong} จาก ${t.attempted} ข้อ (${Math.round(
                (t.wrong / t.attempted) * 100
              )}%)`
          )
        : ['- ยังไม่มีข้อมูลมากพอ']),
    ].join('\n'),
  })
}
