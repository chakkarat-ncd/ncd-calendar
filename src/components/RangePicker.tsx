import { RANGE_OPTIONS, type RangeOption } from '../lib/constants'
import { fmt } from '../lib/date'

/** ปุ่มเลือกช่วงวัน พร้อมคำเตือนเมื่อยังมีนัดอยู่เลยช่วงที่แสดง */
export function RangePicker({
  value,
  onChange,
  from,
  to,
  days,
  beyond,
}: {
  value: RangeOption
  onChange: (v: RangeOption) => void
  from: Date
  to: Date
  days: number
  beyond: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-ink-2 mb-3">
      <span>
        แสดง {days} วันข้างหน้า ({fmt(from)} – {fmt(to)})
      </span>
      {RANGE_OPTIONS.map((v) => (
        <button
          key={String(v)}
          type="button"
          className={'rb' + (v === value ? ' on' : '')}
          onClick={() => onChange(v)}
        >
          {v === 'all' ? 'ทั้งหมด' : `${v} วัน`}
        </button>
      ))}
      {beyond > 0 && (
        <span className="bg-warn-bg border border-warn-line text-[#7A5210] rounded-[7px] px-[11px] py-[5px] text-[13px]">
          ยังมีอีก {beyond.toLocaleString()} นัดหลัง {fmt(to)} — กด “ทั้งหมด” เพื่อดูให้ครบ
        </span>
      )}
    </div>
  )
}
