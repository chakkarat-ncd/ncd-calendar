import type { Summary } from '../lib/counts'

type Tone = '' | 'bad' | 'warn' | 'ok'

const TONE: Record<Tone, string> = {
  '': 'text-ink',
  bad: 'text-bad',
  warn: 'text-warn',
  ok: 'text-ok',
}

function Stat({ n, label, tone = '' }: { n: number; label: string; tone?: Tone }) {
  return (
    <div className="bg-card border border-line rounded-[14px] px-4 py-[15px]">
      <div className={`font-mono text-[34px] font-semibold leading-none ${TONE[tone]}`}>{n}</div>
      <div className="text-ink-2 text-[13px] mt-1.5">{label}</div>
    </div>
  )
}

/** แถบสรุป 4 ตัวเลขของช่วงที่กำลังแสดง */
export function StatCards({ summary, days }: { summary: Summary; days: number }) {
  const span = `ใน ${days} วันข้างหน้า`
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-[18px]">
      <Stat n={summary.has.length} label={`วันที่มีนัด${span}`} />
      <Stat n={summary.over.length} label="วันที่เกินเพดาน 80" tone="bad" />
      <Stat n={summary.near.length} label="วันที่ใกล้เต็ม 61–80" tone="warn" />
      <Stat n={summary.free.length} label="วันที่ยังรับได้สบาย" tone="ok" />
    </div>
  )
}
