import { FRESH_DAYS, STALE_DAYS } from '../lib/constants'
import { fmtDateTime } from '../lib/date'

type Tone = 'fresh' | 'aging' | 'stale'

/**
 * โทนสีชุดเดียวกับเกณฑ์สีในปฏิทิน เพื่อให้ทีมอ่านความหมายได้ทันทีโดยไม่ต้องเรียนรู้ใหม่
 * เขียวคือพอใช้ได้ เหลืองคือเริ่มต้องสนใจ แดงคือมีปัญหา
 */
const TONE: Record<Tone, { box: string; dot: string; lead: string; text: string }> = {
  fresh: {
    box: 'bg-ok-bg border-ok-line',
    dot: 'bg-ok',
    lead: 'text-ok-ink',
    text: 'ข้อมูลล่าสุด',
  },
  aging: {
    box: 'bg-warn-bg border-warn-line',
    dot: 'bg-warn',
    lead: 'text-warn-ink',
    text: 'ควรอัปเดต',
  },
  stale: {
    box: 'bg-bad-bg border-bad-line',
    dot: 'bg-bad',
    lead: 'text-bad-ink',
    text: 'ข้อมูลอาจไม่ทันสมัย',
  },
}

function toneOf(days: number): Tone {
  if (days <= FRESH_DAYS) return 'fresh'
  if (days <= STALE_DAYS) return 'aging'
  return 'stale'
}

/**
 * บอกว่ายอดที่เห็นสดแค่ไหน — ทีมต้องเห็นก่อนตัดสินใจนัดผู้ป่วย
 * เนื้อหาอยู่กึ่งกลาง ส่วนปุ่มโหลดใหม่อยู่ขวาสุด
 */
export function FreshnessBar({
  uploadedAt,
  uploadedBy,
  days,
  loading,
  onReload,
}: {
  uploadedAt: Date
  uploadedBy: string
  days: number
  loading: boolean
  onReload: () => void
}) {
  const t = TONE[toneOf(days)]
  const ago = days <= 0 ? 'อัปเดตวันนี้' : `${days} วันที่แล้ว`

  return (
    // สามคอลัมน์ ตัวถ่วงซ้ายกับปุ่มขวากว้างเท่ากันไม่ได้ แต่ 1fr ทั้งคู่ทำให้ตรงกลางอยู่กึ่งกลางจริง
    <div
      className={
        'rounded-[12px] border px-4 py-3 mb-[18px] grid gap-2 items-center ' +
        'sm:grid-cols-[1fr_auto_1fr] ' +
        t.box
      }
    >
      <div className="hidden sm:block" />

      <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center">
        <span className={`w-[10px] h-[10px] rounded-full shrink-0 ${t.dot}`} />
        <span className={`text-[14px] font-semibold ${t.lead}`}>{t.text}</span>
        <span className="text-[18px] font-bold text-ink">{fmtDateTime(uploadedAt)}</span>
        <span className="text-[13px] text-ink-2">
          โดย {uploadedBy || 'ไม่ระบุชื่อ'} · {ago}
        </span>
      </div>

      <div className="flex justify-center sm:justify-end">
        <button type="button" className="rb bg-white" onClick={onReload} disabled={loading}>
          {loading ? 'กำลังโหลด…' : 'โหลดใหม่'}
        </button>
      </div>
    </div>
  )
}
