import Link from 'next/link'
import { BrandMark } from './brand-mark'

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">
              LearnHub
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
            แพลตฟอร์มประเมินระดับภาษาอังกฤษแบบปรับระดับอัตโนมัติ
            อ้างอิงกรอบมาตรฐาน CEFR ของสภายุโรป
            พร้อมคำแนะนำคอร์สเรียนที่ตรงกับผลประเมิน
          </p>
        </div>

        <div>
          <p className="eyebrow mb-4">การใช้งาน</p>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li>
              <Link href="/assessment" className="hover:text-brand-800">
                เริ่มแบบประเมิน
              </Link>
            </li>
            <li>
              <Link href="/courses" className="hover:text-brand-800">
                คอร์สเรียนทั้งหมด
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-brand-800">
                ความก้าวหน้าของฉัน
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4">มาตรฐาน</p>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li>ระดับ A1 – C2 ตามกรอบ CEFR</li>
            <li>ปรับความยากตามผลตอบรายข้อ</li>
            <li>รายงานผลพร้อมคำอธิบาย</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} LearnHub. สงวนลิขสิทธิ์.</p>
          <p>CEFR — Common European Framework of Reference for Languages</p>
        </div>
      </div>
    </footer>
  )
}
